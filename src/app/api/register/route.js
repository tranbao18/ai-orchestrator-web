import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request) {
    try {
        const { name, email, password } = await request.json();

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Tất cả các trường đều bắt buộc' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
                { status: 400 }
            );
        }

        await connectDB();

        // Kiểm tra email đã tồn tại
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email này đã được đăng ký' },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Tạo user mới
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            provider: 'credentials',
            role: 'free'
        });

        return NextResponse.json(
            {
                message: 'Đăng ký thành công!',
                user: { id: user._id, name: user.name, email: user.email }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json(
            { error: 'Lỗi server, vui lòng thử lại sau' },
            { status: 500 }
        );
    }
}
