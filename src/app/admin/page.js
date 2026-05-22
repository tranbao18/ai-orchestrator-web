'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status === 'authenticated' && session?.user?.role !== 'admin') {
            setError('Bạn không có quyền truy cập trang này. Yêu cầu quyền Admin.');
            setLoading(false);
            return;
        }

        if (status === 'authenticated' && session?.user?.role === 'admin') {
            fetchData();
        }
    }, [status, session, router]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin');
            const data = await res.json();
            
            if (!res.ok) {
                setError(data.error || 'Failed to load admin data');
                return;
            }
            
            setStats(data.stats);
            setUsers(data.users);
        } catch (err) {
            setError('Lỗi kết nối tới máy chủ');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Đang tải dữ liệu Admin...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--error)', marginBottom: '16px' }}>Truy cập bị từ chối</h2>
                <p>{error}</p>
                <Link href="/chat" className="btn btn-primary" style={{ marginTop: '24px' }}>Quay lại Chat</Link>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Quản Trị Hệ Thống</h1>
                <Link href="/chat" className="btn btn-secondary">Quay lại Chat</Link>
            </div>

            {/* Thống kê */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Tổng số người dùng</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{stats?.totalUsers || 0}</div>
                </div>
                <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Tổng số cuộc trò chuyện</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{stats?.totalConversations || 0}</div>
                </div>
                <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Tin nhắn đã dùng hôm nay</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success)' }}>{stats?.totalMessagesToday || 0}</div>
                </div>
            </div>

            {/* Danh sách User */}
            <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Danh sách Người Dùng (Top 50)</h2>
            <div className="glass" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-tertiary)' }}>
                        <tr>
                            <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Tên</th>
                            <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Email</th>
                            <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Phương thức</th>
                            <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Vai trò</th>
                            <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Gói (Plan)</th>
                            <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Đã dùng HN</th>
                            <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>Ngày tạo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '16px' }}>{u.name}</td>
                                <td style={{ padding: '16px' }}>{u.email}</td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        background: 'var(--bg-input)', 
                                        borderRadius: '4px', 
                                        fontSize: '12px' 
                                    }}>
                                        {u.provider}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{ 
                                        color: u.role === 'admin' ? 'var(--error)' : 'var(--text-primary)',
                                        fontWeight: u.role === 'admin' ? 'bold' : 'normal'
                                    }}>
                                        {u.role}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{ 
                                        color: u.subscription?.plan === 'pro' ? 'var(--accent-secondary)' : 
                                               u.subscription?.plan === 'enterprise' ? 'var(--warning)' : 'var(--text-secondary)' 
                                    }}>
                                        {u.subscription?.plan?.toUpperCase() || 'FREE'}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>{u.usage?.messagesUsedToday || 0}</td>
                                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
