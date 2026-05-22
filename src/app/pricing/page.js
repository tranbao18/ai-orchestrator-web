'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function PricingPage() {
    const { data: session } = useSession();
    
    const [loadingPlan, setLoadingPlan] = useState(null);

    const handleUpgrade = async (planId) => {
        setLoadingPlan(planId);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId })
            });
            const data = await res.json();
            
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'Đã xảy ra lỗi khi tạo thanh toán.');
            }
        } catch (err) {
            alert('Lỗi kết nối tới server thanh toán.');
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '36px', marginBottom: '16px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Nâng cấp trải nghiệm AI
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '48px', fontSize: '18px' }}>
                Chọn gói phù hợp với nhu cầu của bạn. Mở khóa toàn bộ sức mạnh của GPT-4o và Claude 3.5 Sonnet.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {/* Free Plan */}
                <div className="glass" style={{ padding: '32px', borderRadius: '16px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Gói Cơ Bản</h3>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>0đ <span style={{ fontSize: '16px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/tháng</span></div>
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '32px', flex: 1 }}>
                        <li style={{ marginBottom: '12px' }}>✅ 20 tin nhắn / ngày</li>
                        <li style={{ marginBottom: '12px' }}>✅ Truy cập Gemini 2.5 Flash</li>
                        <li style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>❌ Không hỗ trợ GPT-4o</li>
                        <li style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>❌ Không hỗ trợ Claude</li>
                    </ul>

                    {session?.user?.plan === 'free' ? (
                        <button className="btn btn-secondary" disabled style={{ width: '100%' }}>Gói hiện tại</button>
                    ) : (
                        <button className="btn btn-secondary" style={{ width: '100%' }}>Chọn Gói Cơ Bản</button>
                    )}
                </div>

                {/* Pro Plan */}
                <div className="glass" style={{ padding: '32px', borderRadius: '16px', textAlign: 'left', display: 'flex', flexDirection: 'column', border: '2px solid var(--accent-primary)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-12px', right: '24px', background: 'var(--accent-gradient)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', color: 'white' }}>PHỔ BIẾN NHẤT</div>
                    <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Gói Pro</h3>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>99.000đ <span style={{ fontSize: '16px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/tháng</span></div>
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '32px', flex: 1 }}>
                        <li style={{ marginBottom: '12px' }}>✅ 500 tin nhắn / ngày</li>
                        <li style={{ marginBottom: '12px' }}>✅ Truy cập Gemini 2.5 Flash</li>
                        <li style={{ marginBottom: '12px' }}>✅ Truy cập GPT-4o</li>
                        <li style={{ marginBottom: '12px' }}>✅ Truy cập Claude 3.5 Sonnet</li>
                        <li style={{ marginBottom: '12px' }}>✅ Ưu tiên tốc độ xử lý</li>
                    </ul>

                    {session?.user?.plan === 'pro' ? (
                        <button className="btn btn-secondary" disabled style={{ width: '100%' }}>Gói hiện tại</button>
                    ) : (
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleUpgrade('pro')}>Nâng cấp Pro</button>
                    )}
                </div>

                {/* Enterprise Plan */}
                <div className="glass" style={{ padding: '32px', borderRadius: '16px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Gói Doanh Nghiệp</h3>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px' }}>299.000đ <span style={{ fontSize: '16px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/tháng</span></div>
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '32px', flex: 1 }}>
                        <li style={{ marginBottom: '12px' }}>✅ Không giới hạn tin nhắn</li>
                        <li style={{ marginBottom: '12px' }}>✅ Truy cập tất cả Models AI</li>
                        <li style={{ marginBottom: '12px' }}>✅ Hỗ trợ khách hàng 24/7</li>
                        <li style={{ marginBottom: '12px' }}>✅ Truy cập API nội bộ</li>
                    </ul>

                    {session?.user?.plan === 'enterprise' ? (
                        <button className="btn btn-secondary" disabled style={{ width: '100%' }}>Gói hiện tại</button>
                    ) : (
                        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => handleUpgrade('enterprise')}>Liên hệ nâng cấp</button>
                    )}
                </div>
            </div>
            
            <div style={{ marginTop: '40px' }}>
                <Link href="/chat" className="btn btn-ghost">← Quay lại trang Chat</Link>
            </div>
        </div>
    );
}
