import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        // --- Email + Password ---
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Vui lòng nhập email và mật khẩu');
                }

                await connectDB();

                const user = await User.findOne({ email: credentials.email }).select('+password');

                if (!user) {
                    throw new Error('Email không tồn tại');
                }

                if (!user.password) {
                    throw new Error('Tài khoản này sử dụng đăng nhập qua Google/GitHub');
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    throw new Error('Mật khẩu không chính xác');
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    image: user.avatar,
                    role: user.role,
                    plan: user.subscription?.plan || 'free'
                };
            }
        }),

        // --- Google OAuth ---
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),

        // --- GitHub OAuth ---
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
    ],

    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'google' || account?.provider === 'github') {
                await connectDB();

                const existingUser = await User.findOne({ email: user.email });

                if (!existingUser) {
                    // Tạo user mới cho OAuth
                    await User.create({
                        name: user.name,
                        email: user.email,
                        avatar: user.image,
                        provider: account.provider,
                        role: 'free'
                    });
                }
            }
            return true;
        },

        async jwt({ token, user }) {
            if (user) {
                await connectDB();
                const dbUser = await User.findOne({ email: user.email });
                if (dbUser) {
                    token.id = dbUser._id.toString();
                    token.role = dbUser.role;
                    token.plan = dbUser.subscription?.plan || 'free';
                }
            }
            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.plan = token.plan;
            }
            return session;
        }
    },

    pages: {
        signIn: '/login',
        error: '/login',
    },

    session: {
        strategy: 'jwt',
    },

    secret: process.env.NEXTAUTH_SECRET,
});
