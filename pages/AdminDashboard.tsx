import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { exhibitionAPI } from '../services/exhibitionService';
import { Exhibition, ExhibitionStatus, ExhibitionStatusLabel } from '../types';

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
    const [activeTab, setActiveTab] = useState<'users' | 'artworks' | 'exhibitions'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [filterStatus, setFilterStatus] = useState<'valid' | 'deleted' | 'all'>('valid');

    // Exhibition Creation/Edit State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingExhibition, setEditingExhibition] = useState<Exhibition | null>(null);
    const [createForm, setCreateForm] = useState<Partial<Exhibition>>({
        title: '',
        venue: '',
        start_date: '',
        end_date: '',
        city: '',
        cover_image: '',
        status: ExhibitionStatus.UPCOMING
    });

    const [isUploading, setIsUploading] = useState(false);


    // Reset page when tab changes
    useEffect(() => {
        setPage(1);
        setSelectedIds([]);
        fetchData(1); // 总是调用 fetchData，不管 page 是否为 1
    }, [activeTab, filterStatus]);

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
            } else if (activeTab === 'artworks') {
                const res = await adminService.getAnalyses(pageNum, 20, filterStatus);
                setAnalyses(res.items);
                setTotal(res.total);
            } else if (activeTab === 'exhibitions') {
                // Exhibition API usage (assuming no pagination in current simple API, or implementing logical slicing here)
                // For simplicity, fetching all and slicing locally if API doesn't support page params fully yet
                // But implementation plan said API supports skip/limit.
                // Assuming service methods:
                const allExhibitions = await exhibitionAPI.getExhibitions();
                setExhibitions(allExhibitions);
                setTotal(allExhibitions.length); // Client side pagination for now if API not returning total
            }
        } catch (error) {
            console.error("Failed to fetch admin data", error);
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
            fetchData(page);
        } catch (error) {
            alert("删除失败");
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!window.confirm("警告：确定要删除该会员吗？\n\n删除后：\n1. 该会员将无法登录\n2. 该会员上传的所有分析报告也将被同步删除")) return;
        try {
            await adminService.deleteUser(id);
            alert("会员及其数据已删除");
            fetchData(page);
        } catch (error) {
            alert("删除失败");
        }
    };

    const handleBatchDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`确定要批量删除选中的 ${selectedIds.length} 个项目吗？`)) return;

        try {
            if (activeTab === 'artworks') {
                await adminService.batchDeleteAnalyses(selectedIds);
            } else if (activeTab === 'exhibitions') {
                await exhibitionAPI.batchDelete(selectedIds);
            }
            alert("批量删除成功");
            fetchData(page);
            setSelectedIds([]);
        } catch (error) {
            alert("批量删除失败");
        }
    };

    // Exhibition Handlers
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { analysisAPI } = await import('../services/apiService');
            const result = await analysisAPI.uploadImage(file);
            setCreateForm(prev => ({ ...prev, cover_image: result.url }));
        } catch (error) {
            console.error("Upload failed", error);
            alert("图片上传失败");
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreateExhibition = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.cover_image) {
            alert("请上传封面图");
            return;
        }
        try {
            // Ensure dates are valid ISO strings to prevent 422 errors
            const payload = {
                ...createForm,
                start_date: createForm.start_date ? new Date(createForm.start_date).toISOString() : undefined,
                end_date: createForm.end_date ? new Date(createForm.end_date).toISOString() : undefined
            };

            if (editingExhibition) {
                // 编辑模式
                await exhibitionAPI.updateExhibition(editingExhibition.id, payload);
                alert("展览更新成功");
            } else {
                // 创建模式
                await exhibitionAPI.createExhibition(payload);
                alert("展览创建成功");
            }

            setShowCreateModal(false);
            setEditingExhibition(null);
            setCreateForm({ title: '', venue: '', start_date: '', end_date: '', city: '', cover_image: '', status: ExhibitionStatus.UPCOMING });
            fetchData(page);
        } catch (error: any) {
            console.error(error);
            alert(`${editingExhibition ? '更新' : '创建'}失败: ${error.response?.statusText || error.message}`);
        }
    };

    const handleEditExhibition = (exhibition: Exhibition) => {
        setEditingExhibition(exhibition);
        setCreateForm({
            title: exhibition.title,
            venue: exhibition.venue,
            start_date: exhibition.start_date.split('T')[0], // Convert ISO to date input format
            end_date: exhibition.end_date.split('T')[0],
            city: exhibition.city,
            cover_image: exhibition.cover_image,
            address: exhibition.address,
            country: exhibition.country,
            continent: exhibition.continent,
            ticket_info: exhibition.ticket_info,
            description: exhibition.description,
            official_link: exhibition.official_link
        });
        setShowCreateModal(true);
    };

    const toggleSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        const currentIds = activeTab === 'artworks' ? analyses.map(a => a.id) : activeTab === 'exhibitions' ? exhibitions.map(e => e.id) : [];

        if (selectedIds.length === currentIds.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(currentIds);
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
                    <button onClick={() => setActiveTab('users')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'users' ? 'bg-white shadow-sm text-fuhung-blue' : 'text-slate-500 hover:text-slate-700'}`}>会员管理</button>
                    <button onClick={() => setActiveTab('artworks')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'artworks' ? 'bg-white shadow-sm text-fuhung-blue' : 'text-slate-500 hover:text-slate-700'}`}>艺术品管理</button>
                    <button onClick={() => setActiveTab('exhibitions')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'exhibitions' ? 'bg-white shadow-sm text-fuhung-blue' : 'text-slate-500 hover:text-slate-700'}`}>展览管理</button>
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
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-400">会员</span>
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="text-red-400 hover:text-red-600 text-xs border border-red-100 px-2 py-1 rounded hover:bg-red-50"
                                                        >
                                                            删除
                                                        </button>
                                                    </div>
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
                        <div className="flex justify-end gap-2 mb-2">
                            {/* Status Filter Dropdown */}
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                                <button onClick={() => setFilterStatus('valid')} className={`px-3 py-1.5 text-xs font-medium rounded ${filterStatus === 'valid' ? 'bg-fuhung-blue text-white' : 'text-slate-500 hover:bg-slate-100'}`}>正常</button>
                                <button onClick={() => setFilterStatus('deleted')} className={`px-3 py-1.5 text-xs font-medium rounded ${filterStatus === 'deleted' ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>回收站</button>
                                <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 text-xs font-medium rounded ${filterStatus === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>全部</button>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            {/* Batch Action Toolbar */}
                            {selectedIds.length > 0 && (
                                <div className="px-6 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                                    <span className="text-sm text-red-700 font-medium">已选择 {selectedIds.length} 个项目</span>
                                    <button onClick={handleBatchDelete} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 transition-colors">批量删除</button>
                                </div>
                            )}

                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 w-10">
                                            <input type="checkbox" className="rounded border-slate-300" checked={analyses.length > 0 && selectedIds.length === analyses.length} onChange={toggleAll} />
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
                                                <input type="checkbox" className="rounded border-slate-300" checked={selectedIds.includes(item.id)} onChange={() => toggleSelection(item.id)} />
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">#{item.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="size-12 rounded bg-slate-100 overflow-hidden border border-slate-200">
                                                    <img src={item.image_url} className="w-full h-full object-cover" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 relative group" onMouseEnter={() => setHoveredId(item.id)} onMouseLeave={() => setHoveredId(null)}>
                                                <div className="font-medium text-slate-900 line-clamp-1 cursor-help">{item.title}</div>
                                                <div className="text-slate-500 text-xs">{item.artist}</div>
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
                                                    <button onClick={() => handleDeleteAnalysis(item.id)} className="text-red-500 hover:text-red-700 text-xs font-medium border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded transition-colors">删除</button>
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

                {activeTab === 'exhibitions' && (
                    <div className="space-y-4">
                        <div className="flex justify-end gap-2 mb-2">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow hover:bg-blue-600 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">add</span>
                                新增展览
                            </button>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            {/* Batch Action Toolbar */}
                            {selectedIds.length > 0 && (
                                <div className="px-6 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                                    <span className="text-sm text-red-700 font-medium">已选择 {selectedIds.length} 个展览</span>
                                    <button onClick={handleBatchDelete} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 transition-colors">批量删除</button>
                                </div>
                            )}

                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 w-10">
                                            <input type="checkbox" className="rounded border-slate-300" checked={exhibitions.length > 0 && selectedIds.length === exhibitions.length} onChange={toggleAll} />
                                        </th>
                                        <th className="px-6 py-3">ID</th>
                                        <th className="px-6 py-3">封面</th>
                                        <th className="px-6 py-3">标题</th>
                                        <th className="px-6 py-3">展馆/城市</th>
                                        <th className="px-6 py-3">时间</th>
                                        <th className="px-6 py-3">状态</th>
                                        <th className="px-6 py-3 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {exhibitions.map((item) => (
                                        <tr key={item.id} className={`hover:bg-slate-50 ${selectedIds.includes(item.id) ? 'bg-blue-50/30' : ''}`}>
                                            <td className="px-6 py-4">
                                                <input type="checkbox" className="rounded border-slate-300" checked={selectedIds.includes(item.id)} onChange={() => toggleSelection(item.id)} />
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">#{item.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="size-16 rounded bg-slate-100 overflow-hidden border border-slate-200">
                                                    <img src={item.cover_image} className="w-full h-full object-cover" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold max-w-xs truncate" title={item.title}>{item.title}</td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <div>{item.venue}</div>
                                                <div className="text-xs text-slate-400">{item.city}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">
                                                {new Date(item.start_date).toLocaleDateString()}
                                                <br />
                                                {new Date(item.end_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${item.status === ExhibitionStatus.ONGOING ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    item.status === ExhibitionStatus.UPCOMING ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-slate-50 text-slate-500 border-slate-100'
                                                    }`}>
                                                    {ExhibitionStatusLabel[item.status] || item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditExhibition(item)}
                                                        className="text-blue-500 hover:text-blue-700 text-xs font-medium border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        编辑
                                                    </button>
                                                    <button
                                                        onClick={() => exhibitionAPI.deleteExhibition(item.id).then(() => fetchData(page))}
                                                        className="text-red-500 hover:text-red-700 text-xs font-medium border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                                                    >
                                                        删除
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {exhibitions.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-10 text-center text-slate-400">暂无展览数据</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                        </div>
                    </div>
                )}

                {/* Shared Pagination - can be improved to handle per-tab state if needed */}
                <div className="flex justify-center mt-6 gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">上一页</button>
                    <span className="px-3 py-1 text-slate-500">第 {page} 页</span>
                    <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">下一页</button>
                </div>
            </main>

            {/* Create Exhibition Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">{editingExhibition ? '编辑展览' : '新增展览'}</h3>
                            <button onClick={() => setShowCreateModal(false)} className="material-symbols-outlined text-slate-400 hover:text-slate-600">close</button>
                        </div>
                        <form onSubmit={handleCreateExhibition} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">展览名称</label>
                                    <input required className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                                        value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">展馆</label>
                                    <input required className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                                        value={createForm.venue} onChange={e => setCreateForm({ ...createForm, venue: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">城市</label>
                                    <input required className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                                        value={createForm.city} onChange={e => setCreateForm({ ...createForm, city: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">开始时间</label>
                                    <input type="datetime-local" required className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                                        value={createForm.start_date} onChange={e => setCreateForm({ ...createForm, start_date: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">结束时间</label>
                                    <input type="datetime-local" required className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                                        value={createForm.end_date} onChange={e => setCreateForm({ ...createForm, end_date: e.target.value })} />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">封面图</label>
                                    {createForm.cover_image && (
                                        <div className="relative w-full h-40 rounded-xl overflow-hidden mb-2 border border-slate-200">
                                            <img src={createForm.cover_image} alt="Cover Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setCreateForm({ ...createForm, cover_image: '' })}
                                                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <label className={`flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:bg-slate-50 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <div className="flex flex-col items-center gap-1 text-slate-400">
                                                <span className="material-symbols-outlined">add_photo_alternate</span>
                                                <span className="text-xs font-bold">{isUploading ? '上传中...' : '上传封面图'}</span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">详细地址</label>
                                    <input className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                                        value={createForm.address || ''} onChange={e => setCreateForm({ ...createForm, address: e.target.value })} />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">门票信息</label>
                                    <textarea className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                                        value={createForm.ticket_info || ''} onChange={e => setCreateForm({ ...createForm, ticket_info: e.target.value })}></textarea>
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">详细介绍</label>
                                    <textarea className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px]"
                                        value={createForm.description || ''} onChange={e => setCreateForm({ ...createForm, description: e.target.value })}></textarea>
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">官方链接</label>
                                    <input className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary/20"
                                        value={createForm.official_link || ''} onChange={e => setCreateForm({ ...createForm, official_link: e.target.value })} placeholder="https://..." />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">取消</button>
                                <button type="submit" className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all">确认创建</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
