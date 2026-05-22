import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Conversation from '@/models/Conversation';

// GET: Lấy danh sách conversations
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const conversations = await Conversation.find({ userId: session.user.id })
            .select('title model isPinned updatedAt createdAt')
            .sort({ isPinned: -1, updatedAt: -1 })
            .limit(50);

        return NextResponse.json({ conversations });
    } catch (error) {
        console.error('Conversations GET error:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}

// DELETE: Xóa conversation
export async function DELETE(request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { conversationId } = await request.json();

        await connectDB();

        const result = await Conversation.deleteOne({
            _id: conversationId,
            userId: session.user.id
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Đã xóa' });
    } catch (error) {
        console.error('Conversations DELETE error:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}
