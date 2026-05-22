import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/db';
import User from '@/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
    apiVersion: '2023-10-16'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event;

    try {
        if (!webhookSecret) {
            // Nếu chưa có webhook secret, skip verify signature (CHỈ DÙNG CHO DEV/MOCK)
            event = JSON.parse(body);
        } else {
            event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
        }
    } catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 });
    }

    // Xử lý event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        const customerId = session.customer;

        if (userId && planId) {
            try {
                await connectDB();
                
                // Tính ngày hết hạn (giả sử 30 ngày)
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30);

                await User.findByIdAndUpdate(userId, {
                    role: 'premium',
                    'subscription.plan': planId,
                    'subscription.stripeCustomerId': customerId,
                    'subscription.expiresAt': expiresAt
                });

                console.log(`✅ Đã cấp gói ${planId} cho user ${userId}`);
            } catch (err) {
                console.error('Lỗi khi cập nhật User sau thanh toán:', err);
            }
        }
    }

    return NextResponse.json({ received: true });
}
