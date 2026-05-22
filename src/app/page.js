import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HomePage() {
    const session = await auth();

    if (session) {
        redirect('/chat');
    }

    return (
        <div className="auth-container" style={{ flexDirection: 'column', gap: '40px' }}>
            <div style={{ textAlign: 'center', maxWidth: '600px' }}>
                <div style={{
                    fontSize: '48px',
                    fontWeight: 800,
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '16px',
                    lineHeight: 1.2
                }}>
                    AI Orchestrator
                </div>
                <p style={{
                    fontSize: '18px',
                    color: 'var(--text-secondary)',
                    marginBottom: '32px',
                    lineHeight: 1.6
                }}>
                    Trò chuyện với <strong style={{ color: 'var(--color-gemini)' }}>Gemini</strong>,{' '}
                    <strong style={{ color: 'var(--color-gpt)' }}>GPT-4o</strong> và{' '}
                    <strong style={{ color: 'var(--color-claude)' }}>Claude</strong> — tất cả trong một nền tảng duy nhất.
                </p>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/login" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
                        🚀 Bắt đầu ngay
                    </Link>
                    <Link href="/register" className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '16px' }}>
                        Tạo tài khoản
                    </Link>
                </div>
            </div>

            <div className="welcome-cards" style={{ maxWidth: '700px' }}>
                <div className="welcome-card">
                    <div className="welcome-card-icon">🟦</div>
                    <div className="welcome-card-title">Gemini 2.5 Flash</div>
                    <div className="welcome-card-desc">AI mạnh mẽ từ Google, xử lý nhanh và chính xác</div>
                </div>
                <div className="welcome-card">
                    <div className="welcome-card-icon">🟩</div>
                    <div className="welcome-card-title">GPT-4o</div>
                    <div className="welcome-card-desc">Model hàng đầu từ OpenAI, đa năng và sáng tạo</div>
                </div>
                <div className="welcome-card">
                    <div className="welcome-card-icon">🟧</div>
                    <div className="welcome-card-title">Claude 3.5 Sonnet</div>
                    <div className="welcome-card-desc">AI từ Anthropic, chuyên phân tích và viết chi tiết</div>
                </div>
            </div>
        </div>
    );
}
