import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
    title: 'AI Orchestrator - Chat với Đa AI Model',
    description: 'Nền tảng chat AI thông minh hỗ trợ Gemini, GPT-4o và Claude 3.5 Sonnet. Đăng ký miễn phí!',
};

export default function RootLayout({ children }) {
    return (
        <html lang="vi">
            <body>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
