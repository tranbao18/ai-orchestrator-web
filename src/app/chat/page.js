'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

export default function ChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [modelName, setModelName] = useState('gemini');
    const [usage, setUsage] = useState({ used: 0, limit: 20 });
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const [input, setInput] = useState('');

    const activeConversationIdRef = useRef(activeConversationId);
    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    const modelNameRef = useRef(modelName);
    useEffect(() => {
        modelNameRef.current = modelName;
    }, [modelName]);

    // AI SDK v6: useChat dùng transport thay vì api/body trực tiếp
    // Dùng useMemo và custom fetch để lấy được activeConversationId mới nhất và xử lý response header
    const transport = useMemo(() => new DefaultChatTransport({
        api: '/api/chat',
        fetch: async (input, init) => {
            // Thêm data vào body (vì transport khởi tạo 1 lần nên cần lấy từ ref)
            if (init && init.body) {
                const parsedBody = JSON.parse(init.body);
                parsedBody.conversationId = activeConversationIdRef.current;
                parsedBody.modelName = modelNameRef.current;
                init.body = JSON.stringify(parsedBody);
            }

            const res = await fetch(input, init);
            
            // Xử lý header trả về để cập nhật conversationId mới nếu vừa tạo mới
            const convId = res.headers.get('x-conversation-id');
            const used = res.headers.get('x-usage-used');
            const limit = res.headers.get('x-usage-limit');

            if (convId && !activeConversationIdRef.current) {
                setActiveConversationId(convId);
            }
            if (used && limit) {
                setUsage({ used: parseInt(used), limit: limit === 'Infinity' ? 'Unlimited' : parseInt(limit) });
            }

            return res;
        }
    }), []);

    const chat = useChat({
        transport,
        onError: (err) => {
            console.error('Chat error:', err);
        },
        onFinish: ({ message }) => {
            // Reload conversations khi có response mới (để cập nhật sidebar)
            loadConversations();
        }
    });

    const { messages, sendMessage, status: chatStatus, setMessages, error } = chat;
    const isLoading = chatStatus === 'submitted' || chatStatus === 'streaming';

    // Helper: Trích xuất text từ UIMessage (AI SDK v6 format dùng parts)
    function getMessageText(msg) {
        // AI SDK v6: messages có parts array
        if (Array.isArray(msg.parts)) {
            return msg.parts
                .filter(p => p.type === 'text')
                .map(p => p.text)
                .join('');
        }
        // Fallback: content dạng cũ
        if (typeof msg.content === 'string') {
            return msg.content;
        }
        return '';
    }

    // Redirect nếu chưa đăng nhập
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Tải danh sách conversations
    const loadConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/conversations');
            const data = await res.json();
            if (data.conversations) {
                setConversations(data.conversations);
            }
        } catch (err) {
            console.error('Load conversations error:', err);
        }
    }, []);

    useEffect(() => {
        if (session) loadConversations();
    }, [session, loadConversations]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-resize textarea
    const onTextareaChange = (e) => {
        setInput(e.target.value);
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
        }
    };

    const submitForm = (e) => {
        e?.preventDefault();
        if (!(input || '').trim() || isLoading) return;
        
        // AI SDK v6: gửi tin nhắn bằng sendMessage với { text: '...' }
        sendMessage({
            text: input || ' '
        });
        
        setInput(''); // Xóa input sau khi gửi
        
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    // Xử lý Enter
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitForm(e);
        }
    };

    // Tạo cuộc trò chuyện mới
    const newConversation = () => {
        setActiveConversationId(null);
        setMessages([]); // Clear chat window
        setSidebarOpen(false);
    };

    // Chọn conversation từ sidebar
    const selectConversation = async (conv) => {
        setActiveConversationId(conv._id);
        setModelName(conv.model || 'gemini');
        setSidebarOpen(false);

        // Tải messages của conversation
        try {
            const res = await fetch(`/api/chat?conversationId=${conv._id}`);
            if (res.ok) {
                const data = await res.json();
                
                // Chuyển đổi định dạng messages từ DB sang UIMessage format (AI SDK v6)
                const formattedMessages = (data.messages || []).map(m => ({
                    id: m._id || Math.random().toString(),
                    role: m.role,
                    parts: [{ type: 'text', text: m.content }]
                }));
                
                setMessages(formattedMessages);
            }
        } catch (err) {
            console.error('Load messages error:', err);
        }
    };

    // Xóa conversation
    const deleteConversation = async (e, convId) => {
        e.stopPropagation();
        try {
            await fetch('/api/conversations', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: convId }),
            });

            if (activeConversationId === convId) {
                newConversation();
            }
            loadConversations();
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    if (status === 'loading') {
        return (
            <div className="auth-container">
                <div className="loading-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        );
    }

    if (!session) return null;

    const userInitial = session.user?.name?.charAt(0).toUpperCase() || '?';

    return (
        <div className="chat-layout">
            {/* Sidebar Overlay (mobile) */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">AI Orchestrator</div>
                    <button
                        className="btn btn-secondary"
                        onClick={newConversation}
                        style={{ width: '100%' }}
                    >
                        ➕ Cuộc trò chuyện mới
                    </button>
                </div>

                <div className="sidebar-conversations">
                    {conversations.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '24px',
                            color: 'var(--text-muted)',
                            fontSize: '13px'
                        }}>
                            Chưa có cuộc trò chuyện nào
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv._id}
                                className={`conversation-item ${activeConversationId === conv._id ? 'active' : ''}`}
                                onClick={() => selectConversation(conv)}
                            >
                                <span style={{ fontSize: '14px' }}>💬</span>
                                <span className="conversation-title">{conv.title}</span>
                                <button
                                    className="conversation-delete"
                                    onClick={(e) => deleteConversation(e, conv._id)}
                                    title="Xóa"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="sidebar-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="user-avatar">{userInitial}</div>
                        <div className="user-info">
                            <div className="user-name">{session.user?.name}</div>
                            <div className="user-plan">{session.user?.plan || 'free'} plan</div>
                        </div>
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => signOut({ callbackUrl: '/' })}
                            title="Đăng xuất"
                        >
                            🚪
                        </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href="/pricing" className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '12px' }}>
                            ⭐ Nâng cấp
                        </Link>
                        {session.user?.role === 'admin' && (
                            <Link href="/admin" className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '12px' }}>
                                ⚙️ Quản trị
                            </Link>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="chat-main">
                {/* Header */}
                <div className="chat-header">
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{ display: 'none' }}
                        id="sidebar-toggle"
                    >
                        ☰
                    </button>

                    <div className="model-selector">
                        {['gemini', 'gpt', 'claude'].map((m) => {
                            const userPlan = session?.user?.plan || 'free';
                            const isPremium = m === 'gpt' || m === 'claude';
                            const isDisabled = isPremium && userPlan === 'free';
                            
                            return (
                                <button
                                    key={m}
                                    className={`model-btn ${modelName === m ? 'active' : ''}`}
                                    data-model={m}
                                    onClick={() => {
                                        if (isDisabled) {
                                            alert(`Mô hình ${m === 'gpt' ? 'GPT-4o' : 'Claude'} yêu cầu nâng cấp gói Pro hoặc Business.`);
                                            return;
                                        }
                                        setModelName(m);
                                    }}
                                    disabled={isDisabled}
                                    title={isDisabled ? "Yêu cầu gói Pro/Business" : ""}
                                    style={{ 
                                        opacity: isDisabled ? 0.5 : 1, 
                                        cursor: isDisabled ? 'not-allowed' : 'pointer' 
                                    }}
                                >
                                    {m === 'gemini' ? '🟦 Gemini' : m === 'gpt' ? '🟩 GPT-4o' + (isDisabled ? ' 🔒' : ' 👑') : '🟧 Claude' + (isDisabled ? ' 🔒' : ' 👑')}
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {usage.used}/{usage.limit} tin nhắn
                    </div>
                </div>

                {/* Messages / Welcome */}
                {messages.length === 0 ? (
                    <div className="welcome-screen">
                        <div className="welcome-title">Xin chào! 👋</div>
                        <p className="welcome-subtitle">
                            Tôi là AI Orchestrator. Hãy bắt đầu cuộc trò chuyện với{' '}
                            {modelName === 'gemini' ? 'Gemini' : modelName === 'gpt' ? 'GPT-4o' : 'Claude'}.
                        </p>

                        <div className="welcome-cards">
                            <div className="welcome-card" onClick={() => { setInput('Giải thích machine learning cho người mới bắt đầu'); }}>
                                <div className="welcome-card-icon">🧠</div>
                                <div className="welcome-card-title">Học AI</div>
                                <div className="welcome-card-desc">Giải thích machine learning cho người mới bắt đầu</div>
                            </div>
                            <div className="welcome-card" onClick={() => { setInput('Viết code JavaScript tạo REST API cơ bản'); }}>
                                <div className="welcome-card-icon">💻</div>
                                <div className="welcome-card-title">Viết code</div>
                                <div className="welcome-card-desc">Viết code JavaScript tạo REST API cơ bản</div>
                            </div>
                            <div className="welcome-card" onClick={() => { setInput('Phân tích xu hướng công nghệ 2026'); }}>
                                <div className="welcome-card-icon">📊</div>
                                <div className="welcome-card-title">Phân tích</div>
                                <div className="welcome-card-desc">Phân tích xu hướng công nghệ 2026</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="messages-container">
                        {messages.map((msg) => (
                            <div key={msg.id} className="message">
                                <div className={`message-avatar ${msg.role}`}>
                                    {msg.role === 'user' ? userInitial : '🤖'}
                                </div>
                                <div className="message-content">
                                    <div className="message-role">
                                        {msg.role === 'user' ? session.user?.name : (
                                            modelName === 'gemini' ? 'Gemini' : modelName === 'gpt' ? 'GPT-4o' : 'Claude'
                                        )}
                                    </div>
                                    <div className="message-text">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {getMessageText(msg)}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {chatStatus === 'submitted' && (
                            <div className="message">
                                <div className="message-avatar assistant">🤖</div>
                                <div className="message-content">
                                    <div className="message-role">
                                        {modelName === 'gemini' ? 'Gemini' : modelName === 'gpt' ? 'GPT-4o' : 'Claude'}
                                    </div>
                                    <div className="message-text">
                                        <div className="loading-dots" style={{ margin: '8px 0', justifyContent: 'flex-start' }}>
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="message">
                                <div className="message-avatar assistant">🤖</div>
                                <div className="message-content">
                                    <div className="message-text" style={{ color: 'var(--error)' }}>
                                        ⚠️ Lỗi: {error.message === 'Failed to fetch' ? 'Bạn đã hết quota hoặc server bị lỗi. Kiểm tra lại plan!' : error.message}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Chat Input */}
                <div className="chat-input-container">
                    <form className="chat-input-wrapper" onSubmit={submitForm}>
                        <textarea
                            ref={textareaRef}
                            className="chat-textarea"
                            value={input}
                            onChange={onTextareaChange}
                            onKeyDown={handleKeyDown}
                            placeholder={`Nhắn tin cho ${modelName === 'gemini' ? 'Gemini' : modelName === 'gpt' ? 'GPT-4o' : 'Claude'}... (Enter gửi)`}
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className="send-btn"
                            disabled={isLoading || !(input || '').trim()}
                        >
                            {isLoading ? '⏳' : '➤'}
                        </button>
                    </form>
                    <div className="usage-info">
                        Đang dùng plan <strong>{session.user?.plan || 'free'}</strong> — {usage.used}/{usage.limit} tin nhắn hôm nay
                    </div>
                </div>
            </main>

            <style jsx>{`
                @media (max-width: 768px) {
                    #sidebar-toggle {
                        display: flex !important;
                    }
                }
            `}</style>
        </div>
    );
}
