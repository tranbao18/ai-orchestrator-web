import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
    apiVersion: '2023-10-16'
});

const PLAN_PRICES = {
    pro: process.env.STRIPE_PRICE_ID_PRO || 'price_mock_pro',
    enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || 'price_mock_enterprise'
};

export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { planId } = await request.json();

        if (!PLAN_PRICES[planId]) {
            return NextResponse.json({ error: 'Gói dịch vụ không hợp lệ' }, { status: 400 });
        }

            // Lấy URL thực tế đang chạy (localhost hoặc Vercel domain)
            const appUrl = request.nextUrl?.origin || process.env.NEXTAUTH_URL || 'http://localhost:3000';

            // Tạo checkout session
            const checkoutSession = await stripe.checkout.sessions.create({
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: PLAN_PRICES[planId],
                        quantity: 1,
                    },
                ],
                success_url: `${appUrl}/chat?upgrade=success`,
                cancel_url: `${appUrl}/pricing?upgrade=canceled`,
                client_reference_id: session.user.id,
            customer_email: session.user.email,
            metadata: {
                userId: session.user.id,
                planId: planId
            }
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: 'Lỗi tạo thanh toán. Kiểm tra Stripe config.' }, { status: 500 });
    }
}
