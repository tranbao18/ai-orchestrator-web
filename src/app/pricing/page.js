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

    const currentPlan = session?.user?.plan || 'free';

    return (
        <div className="pricing-container">
            <div style={{ marginBottom: '8px', fontSize: '32px', filter: 'drop-shadow(0 0 15px rgba(232, 160, 191, 0.3))' }}>✦</div>
            <h1 className="pricing-title">
                Nâng cấp trải nghiệm AI
            </h1>
            <p className="pricing-subtitle">
                Chọn gói phù hợp với nhu cầu của bạn. Mở khóa toàn bộ sức mạnh điều phối đa AI.
            </p>

            <div className="pricing-grid">
                {/* Free Plan */}
                <div className="glass pricing-card">
                    <div className="pricing-plan-name">Gói Cơ Bản</div>
                    <div className="pricing-price">
                        0đ <span>/tháng</span>
                    </div>
                    
                    <ul className="pricing-features">
                        <li><span className="check">✓</span> 20 tin nhắn / ngày</li>
                        <li><span className="check">✓</span> Truy cập Gemini 2.5 Flash</li>
                        <li><span className="cross">✕</span> <span style={{ color: 'var(--text-muted)' }}>Không hỗ trợ GPT-4o</span></li>
                        <li><span className="cross">✕</span> <span style={{ color: 'var(--text-muted)' }}>Không hỗ trợ Claude</span></li>
                    </ul>

                    {currentPlan === 'free' ? (
                        <button className="btn btn-secondary" disabled style={{ width: '100%' }}>Gói hiện tại</button>
                    ) : (
                        <button className="btn btn-secondary" style={{ width: '100%' }}>Chọn Gói Cơ Bản</button>
                    )}
                </div>

                {/* Pro Plan */}
                <div className="glass pricing-card featured">
                    <div className="pricing-badge">PHỔ BIẾN NHẤT</div>
                    <div className="pricing-plan-name">Gói Pro</div>
                    <div className="pricing-price">
                        99.000đ <span>/tháng</span>
                    </div>
                    
                    <ul className="pricing-features">
                        <li><span className="check">✓</span> 500 tin nhắn / ngày</li>
                        <li><span className="check">✓</span> Truy cập Gemini 2.5 Flash</li>
                        <li><span className="check">✓</span> Truy cập GPT-4o</li>
                        <li><span className="check">✓</span> Truy cập Claude 3.5 Sonnet</li>
                        <li><span className="check">✓</span> Ưu tiên tốc độ xử lý</li>
                    </ul>

                    {currentPlan === 'pro' ? (
                        <button className="btn btn-secondary" disabled style={{ width: '100%' }}>Gói hiện tại</button>
                    ) : (
                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%' }} 
                            onClick={() => handleUpgrade('pro')}
                            disabled={loadingPlan === 'pro'}
                        >
                            {loadingPlan === 'pro' ? '✦ Đang xử lý...' : '✦ Nâng cấp Pro'}
                        </button>
                    )}
                </div>

                {/* Enterprise Plan */}
                <div className="glass pricing-card">
                    <div className="pricing-plan-name">Gói Doanh Nghiệp</div>
                    <div className="pricing-price">
                        299.000đ <span>/tháng</span>
                    </div>
                    
                    <ul className="pricing-features">
                        <li><span className="check">✓</span> Không giới hạn tin nhắn</li>
                        <li><span className="check">✓</span> Truy cập tất cả Models AI</li>
                        <li><span className="check">✓</span> Hỗ trợ khách hàng 24/7</li>
                        <li><span className="check">✓</span> Truy cập API nội bộ</li>
                    </ul>

                    {currentPlan === 'enterprise' ? (
                        <button className="btn btn-secondary" disabled style={{ width: '100%' }}>Gói hiện tại</button>
                    ) : (
                        <button 
                            className="btn btn-secondary" 
                            style={{ width: '100%' }} 
                            onClick={() => handleUpgrade('enterprise')}
                            disabled={loadingPlan === 'enterprise'}
                        >
                            {loadingPlan === 'enterprise' ? '✦ Đang xử lý...' : 'Liên hệ nâng cấp'}
                        </button>
                    )}
                </div>
            </div>
            
            <div style={{ marginTop: '48px' }}>
                <Link href="/chat" className="btn btn-ghost" style={{ fontSize: '14px' }}>← Quay lại trang Chat</Link>
            </div>
        </div>
    );
}
