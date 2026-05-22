import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Conversation from '@/models/Conversation';

export async function GET() {
    try {
        const session = await auth();
        
        // Chỉ Admin mới được truy cập
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Require admin role.' }, { status: 403 });
        }

        await connectDB();

        // Lấy thống kê cơ bản
        const totalUsers = await User.countDocuments();
        const totalConversations = await Conversation.countDocuments();
        
        // Lấy danh sách users (top 50 mới nhất)
        const users = await User.find()
            .select('name email role provider subscription.plan usage createdAt')
            .sort({ createdAt: -1 })
            .limit(50);

        // Tính tổng messages đã gửi hôm nay
        const allUsers = await User.find().select('usage');
        const totalMessagesToday = allUsers.reduce((sum, u) => sum + (u.usage?.messagesUsedToday || 0), 0);

        return NextResponse.json({
            stats: {
                totalUsers,
                totalConversations,
                totalMessagesToday
            },
            users
        });

    } catch (error) {
        console.error('Admin API error:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}
