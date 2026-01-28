import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

interface User {
    id: number;
    name: string;
    phone: string;
    created_at: string;
    is_admin: boolean;
}

interface Analysis {
    id: number;
    title: string;
    artist: string;
    image_url: string;
    user_name: string;
    user_phone?: string;
    created_at: string;
    status: '正常' | '已删除' | '分析失败';
    preview_info?: {
        style: string;
        rating: string;
        summary: string;
    };
}

const AdminDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'users' | 'artworks'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Reset page when tab changes
    useEffect(() => {
        setPage(1);
        setSelectedIds([]);
        // fetchData will be triggered by the page change effect below
        // or we can call it explicitly if page is already 1
        if (page === 1) fetchData(1);
    }, [activeTab]);

    // Fetch data when page changes
    useEffect(() => {
        fetchData(page);
        setSelectedIds([]);
    }, [page]);

    const fetchData = async (pageNum: number) => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const res = await adminService.getUsers(pageNum, 20, searchTerm);
                setUsers(res.items);
                setTotal(res.total);
            } else {
                const res = await adminService.getAnalyses(pageNum, 20, 'all');
                setAnalyses(res.items);
                setTotal(res.total);
            }
        } catch (error) {
            console.error("Failed to fetch admin data", error);
            // alert("加载数据失败，请确认您有管理员权限"); 
        } finally {
            setLoading(false);
        }
    };

    const handleExportUsers = async () => {
        try {
            const blob = await adminService.exportUsers();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert("导出失败");
        }
    };

    const handleDeleteAnalysis = async (id: number) => {
        if (!window.confirm("确定要下架该报告吗？下架后将在前端隐藏。")) return;
        try {
            await adminService.deleteAnalysis(id);
            // Refresh list
            fetchData(page);
        } catch (error) {
            alert("删除失败");
        }
    };

    const handleBatchDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`确定要批量删除选中的 ${selectedIds.length} 个分析报告吗？`)) return;

        try {
            await adminService.batchDeleteAnalyses(selectedIds);
            alert("批量删除成功");
            fetchData(page);
            setSelectedIds([]);
        } catch (error) {
            alert("批量删除失败");
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === analyses.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(analyses.map(a => a.id));
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-800">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-fuhung-blue">admin_panel_settings</span>
                        <h1 className="text-lg font-bold">管理员后台</h1>
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'users' ? 'bg-white shadow-sm text-fuhung-blue' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        会员管理
                    </button>
                    <button
                        onClick={() => setActiveTab('artworks')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'artworks' ? 'bg-white shadow-sm text-fuhung-blue' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        艺术品管理
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6">
                {activeTab === 'users' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="搜索手机号或姓名"
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchData(1)}
                                />
                                <button onClick={() => fetchData(1)} className="px-3 py-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200">
                                    搜索
                                </button>
                            </div>
                            <button
                                onClick={handleExportUsers}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg hover:bg-emerald-100 text-sm font-medium"
                            >
                                <span className="material-symbols-outlined text-lg">download</span>
                                导出 CSV
                            </button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">ID</th>
                                        <th className="px-6 py-3">姓名</th>
                                        <th className="px-6 py-3">手机号</th>
                                        <th className="px-6 py-3">注册时间</th>
                                        <th className="px-6 py-3">权限</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 text-slate-400">#{user.id}</td>
                                            <td className="px-6 py-4 font-medium">{user.name || '-'}</td>
                                            <td className="px-6 py-4">{user.phone}</td>
                                            <td className="px-6 py-4 text-slate-500">{new Date(user.created_at).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                {user.is_admin ? (
                                                    <span className="px-2 py-0.5 bg-fuhung-blue/10 text-fuhung-blue rounded text-xs font-bold">管理员</span>
                                                ) : (
                                                    <span className="text-slate-400">会员</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-10 text-center text-slate-400">暂无数据</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'artworks' && (
                    <div className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            {/* Batch Action Toolbar */}
                            {selectedIds.length > 0 && (
                                <div className="px-6 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                                    <span className="text-sm text-red-700 font-medium">已选择 {selectedIds.length} 个项目</span>
                                    <button
                                        onClick={handleBatchDelete}
                                        className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 transition-colors"
                                    >
                                        批量删除
                                    </button>
                                </div>
                            )}

                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300"
                                                checked={analyses.length > 0 && selectedIds.length === analyses.length}
                                                onChange={toggleAll}
                                            />
                                        </th>
                                        <th className="px-6 py-3">ID</th>
                                        <th className="px-6 py-3">预览</th>
                                        <th className="px-6 py-3">标题/艺术家</th>
                                        <th className="px-6 py-3">上传用户</th>
                                        <th className="px-6 py-3">上传时间</th>
                                        <th className="px-6 py-3">状态</th>
                                        <th className="px-6 py-3 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {analyses.map((item) => (
                                        <tr key={item.id} className={`hover:bg-slate-50 ${selectedIds.includes(item.id) ? 'bg-blue-50/30' : ''}`}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => toggleSelection(item.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">#{item.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="size-12 rounded bg-slate-100 overflow-hidden border border-slate-200">
                                                    <img src={item.image_url} className="w-full h-full object-cover" />
                                                </div>
                                            </td>
                                            <td
                                                className="px-6 py-4 relative group"
                                                onMouseEnter={() => setHoveredId(item.id)}
                                                onMouseLeave={() => setHoveredId(null)}
                                            >
                                                <div className="font-medium text-slate-900 line-clamp-1 cursor-help">{item.title}</div>
                                                <div className="text-slate-500 text-xs">{item.artist}</div>

                                                {/* Hover Preview Tooltip */}
                                                {hoveredId === item.id && (
                                                    <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-slate-100 rounded-xl shadow-xl z-20 p-4 animate-fade-in">
                                                        <h4 className="text-xs font-bold text-slate-900 mb-2 border-b border-slate-100 pb-2">分析预览</h4>
                                                        {item.preview_info ? (
                                                            <div className="space-y-2 text-xs">
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-400">评分</span>
                                                                    <span className="font-bold text-fuhung-blue">{item.preview_info.rating}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-slate-400">风格</span>
                                                                    <span className="text-slate-700">{item.preview_info.style}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-400 block mb-1">内容摘要</span>
                                                                    <p className="text-slate-600 leading-relaxed text-[10px] bg-slate-50 p-2 rounded">
                                                                        {item.preview_info.summary}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center text-slate-400 text-xs py-4">
                                                                暂无分析数据
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium">{item.user_name}</div>
                                                <div className="text-xs text-slate-400">{item.user_phone}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{new Date(item.created_at).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.status === '正常' ? 'bg-emerald-50 text-emerald-600' :
                                                    item.status === '分析失败' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-red-50 text-red-500'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {(item.status === '正常' || item.status === '分析失败') && (
                                                    <button
                                                        onClick={() => handleDeleteAnalysis(item.id)}
                                                        className="text-red-500 hover:text-red-700 text-xs font-medium border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        删除
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {analyses.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-10 text-center text-slate-400">暂无数据</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination Simple */}
                <div className="flex justify-center mt-6 gap-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        上一页
                    </button>
                    <span className="px-3 py-1 text-slate-500">第 {page} 页</span>
                    <button
                        disabled={page * 20 >= total}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                    >
                        下一页
                    </button>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
