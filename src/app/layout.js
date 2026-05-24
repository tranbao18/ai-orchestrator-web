import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
    title: 'AI Orchestrator — Chỉ huy dàn AI',
    description: 'Nền tảng AI Orchestrator — điều phối Gemini, GPT-4o và Claude trong một giao diện duy nhất. Trải nghiệm sức mạnh đa AI ngay hôm nay.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="vi">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
