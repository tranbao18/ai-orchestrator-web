import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import { streamText, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

const SYSTEM_PROMPT = `Bạn là AI Orchestrator, một trợ lý AI thông minh. Trả lời ngắn gọn, chính xác, thân thiện. Hỗ trợ Markdown formatting.`;

// Giới hạn tin nhắn theo plan
const PLAN_LIMITS = {
    free: 20,
    pro: 500,
    enterprise: Infinity
};

// Tùy chọn để Vercel AI SDK có thể chạy stream liên tục không bị timeout trên Vercel Edge/Serverless (Next.js config)
export const maxDuration = 60;

// Helper: Trích xuất text thuần túy từ UIMessage (AI SDK v6 format)
function getTextFromUIMessage(msg) {
    // Format cũ: content là string
    if (typeof msg.content === 'string') {
        return msg.content;
    }
    // Format cũ: content là array of parts
    if (Array.isArray(msg.content)) {
        const textPart = msg.content.find(p => p.type === 'text');
        return textPart?.text || '';
    }
    // Format mới AI SDK v6: parts là array
    if (Array.isArray(msg.parts)) {
        const textPart = msg.parts.find(p => p.type === 'text');
        return textPart?.text || '';
    }
    return '';
}

// GET: Tải messages của một conversation
export async function GET(request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        if (!conversationId) {
            return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
        }

        await connectDB();

        const conversation = await Conversation.findOne({
            _id: conversationId,
            userId: session.user.id
        });

        if (!conversation) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ messages: conversation.messages });
    } catch (error) {
        console.error('Chat GET error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        // Xác thực user
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // AI SDK v6: useChat gửi `messages` (UIMessage format với parts) + body extras
        const body = await request.json();
        const { messages, conversationId, modelName = 'gemini', attachment } = body;

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'Tin nhắn không được để trống' }, { status: 400 });
        }

        // Tin nhắn mới nhất của user
        const lastMessage = messages[messages.length - 1];
        const lastMessageText = getTextFromUIMessage(lastMessage);

        // Chuyển đổi UIMessage (parts format) → ModelMessage (content format) cho streamText
        // convertToModelMessages là hàm chính thức từ AI SDK v6
        const modelMessages = await convertToModelMessages(messages);

        await connectDB();

        // Kiểm tra quota
        const user = await User.findById(session.user.id);
        if (!user) {
            return NextResponse.json({ error: 'User không tồn tại' }, { status: 404 });
        }

        // Reset usage hàng ngày
        const today = new Date().toDateString();
        const lastReset = new Date(user.usage.lastResetDate).toDateString();
        if (today !== lastReset) {
            user.usage.messagesUsedToday = 0;
            user.usage.lastResetDate = new Date();
        }

        const limit = PLAN_LIMITS[user.subscription?.plan || 'free'];
        if (user.usage.messagesUsedToday >= limit) {
            return NextResponse.json(
                { error: `Bạn đã hết quota hôm nay (${limit} tin nhắn). Nâng cấp plan để tiếp tục!` },
                { status: 429 }
            );
        }

        // Lấy hoặc tạo conversation
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findOne({
                _id: conversationId,
                userId: session.user.id
            });
            if (!conversation) {
                return NextResponse.json({ error: 'Cuộc trò chuyện không tồn tại' }, { status: 404 });
            }
        } else {
            const titleText = lastMessageText || 'Cuộc trò chuyện mới';
                
            conversation = await Conversation.create({
                userId: session.user.id,
                title: titleText.substring(0, 50) + (titleText.length > 50 ? '...' : ''),
                model: modelName
            });
        }

        // Thêm tin nhắn user vào DB
        const hasImage = attachment && attachment.startsWith('data:image');
        const dbContent = lastMessageText + (hasImage ? '\n*(Đã đính kèm ảnh)*' : '');
            
        conversation.messages.push({ role: 'user', content: dbContent || '(empty)' });
        await conversation.save();

        // Chuẩn bị model cho Vercel AI SDK
        const userPlan = user.subscription?.plan || 'free';
        
        let aiModel;
        if (modelName === 'gpt') {
            if (userPlan === 'free') {
                return NextResponse.json({ error: 'Gói Free không hỗ trợ GPT-4o. Vui lòng nâng cấp gói Pro/Business.' }, { status: 403 });
            }
            aiModel = openai('gpt-4o');
        } else if (modelName === 'claude') {
            if (userPlan === 'free') {
                return NextResponse.json({ error: 'Gói Free không hỗ trợ Claude. Vui lòng nâng cấp gói Pro/Business.' }, { status: 403 });
            }
            aiModel = anthropic('claude-3-5-sonnet-20240620');
        } else {
            // Đảm bảo GOOGLE_GENERATIVE_AI_API_KEY được kế thừa từ GEMINI_API_KEY nếu bị thiếu
            if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
                process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
            }
            aiModel = google('gemini-2.5-flash');
        }

        // Cập nhật usage ngay trước khi gọi model (chỉ tính tin nhắn của user gửi đi)
        user.usage.messagesUsedToday += 1;
        await user.save();

        // AI SDK v6: streamText trả về synchronous result (không await)
        const result = streamText({
            model: aiModel,
            system: SYSTEM_PROMPT,
            messages: modelMessages,
            onFinish: async ({ text }) => {
                // Lưu phản hồi của AI vào DB sau khi stream kết thúc
                try {
                    await connectDB();
                    const conv = await Conversation.findById(conversation._id);
                    if (conv) {
                        conv.messages.push({ role: 'assistant', content: text || '(no response)' });
                        conv.model = modelName;
                        conv.updatedAt = new Date();
                        await conv.save();
                    }
                } catch (err) {
                    console.error('Error saving assistant message:', err);
                }
            }
        });

        // AI SDK v6: dùng toUIMessageStreamResponse() — tương thích với useChat client
        return result.toUIMessageStreamResponse({
            headers: {
                'x-conversation-id': conversation._id.toString(),
                'x-usage-used': user.usage.messagesUsedToday.toString(),
                'x-usage-limit': limit.toString(),
            }
        });

    } catch (error) {
        console.error('Chat API error:', error);
        const errorMessage = error?.message || 'Unknown error';
        console.error('Chat API error details:', errorMessage);
        return NextResponse.json(
            { error: `Lỗi xử lý tin nhắn: ${errorMessage}` },
            { status: 500 }
        );
    }
}
