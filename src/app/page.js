import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HomePage() {
    const session = await auth();

    if (session) {
        redirect('/chat');
    }

    return (
        <div className="auth-container" style={{ flexDirection: 'column', gap: '48px' }}>
            {/* Hero Section */}
            <div style={{ textAlign: 'center', maxWidth: '640px', position: 'relative', zIndex: 2 }}>
                {/* Conductor Icon */}
                <div style={{
                    fontSize: '48px',
                    marginBottom: '20px',
                    filter: 'drop-shadow(0 0 20px rgba(232, 160, 191, 0.4))',
                    animation: 'pulse-glow 3s ease-in-out infinite'
                }}>
                    ✦
                </div>

                <div style={{
                    fontSize: '52px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '16px',
                    lineHeight: 1.15,
                    letterSpacing: '-1px',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 4s ease-in-out infinite'
                }}>
                    AI Orchestrator
                </div>

                <p style={{
                    fontSize: '18px',
                    color: 'var(--text-secondary)',
                    marginBottom: '12px',
                    lineHeight: 1.7,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 300
                }}>
                    Chỉ huy dàn AI. Một nền tảng duy nhất.
                </p>

                <p style={{
                    fontSize: '15px',
                    color: 'var(--text-muted)',
                    marginBottom: '36px',
                    lineHeight: 1.7
                }}>
                    Điều phối{' '}
                    <strong style={{ color: 'var(--color-gemini)', fontWeight: 600 }}>Gemini</strong>,{' '}
                    <strong style={{ color: 'var(--color-gpt)', fontWeight: 600 }}>GPT-4o</strong> và{' '}
                    <strong style={{ color: 'var(--color-claude)', fontWeight: 600 }}>Claude</strong>{' '}
                    — như một nhạc trưởng chỉ huy dàn nhạc AI.
                </p>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/login" className="btn btn-primary" style={{ padding: '15px 36px', fontSize: '16px' }}>
                        ✦ Bắt đầu chỉ huy
                    </Link>
                    <Link href="/register" className="btn btn-secondary" style={{ padding: '15px 36px', fontSize: '16px' }}>
                        Tạo tài khoản
                    </Link>
                </div>
            </div>

            {/* AI Model Cards */}
            <div className="welcome-cards" style={{ maxWidth: '720px', position: 'relative', zIndex: 2 }}>
                <div className="welcome-card">
                    <div className="welcome-card-icon" style={{ filter: 'drop-shadow(0 0 8px rgba(110, 168, 244, 0.5))' }}>◆</div>
                    <div className="welcome-card-title" style={{ color: 'var(--color-gemini)' }}>Gemini 2.5 Flash</div>
                    <div className="welcome-card-desc">AI mạnh mẽ từ Google, xử lý nhanh và chính xác</div>
                </div>
                <div className="welcome-card">
                    <div className="welcome-card-icon" style={{ filter: 'drop-shadow(0 0 8px rgba(94, 201, 160, 0.5))' }}>◆</div>
                    <div className="welcome-card-title" style={{ color: 'var(--color-gpt)' }}>GPT-4o</div>
                    <div className="welcome-card-desc">Model hàng đầu từ OpenAI, đa năng và sáng tạo</div>
                </div>
                <div className="welcome-card">
                    <div className="welcome-card-icon" style={{ filter: 'drop-shadow(0 0 8px rgba(224, 149, 106, 0.5))' }}>◆</div>
                    <div className="welcome-card-title" style={{ color: 'var(--color-claude)' }}>Claude 3.5 Sonnet</div>
                    <div className="welcome-card-desc">AI từ Anthropic, chuyên phân tích và viết chi tiết</div>
                </div>
            </div>
        </div>
    );
}
