import axios from 'axios';

const API_BASE_URL = '';

// 创建带拦截器的 axios 实例
const adminApi = axios.create({
    baseURL: API_BASE_URL,
});

adminApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const adminService = {
    // 获取用户列表
    getUsers: async (page = 1, pageSize = 20, search = '') => {
        const params: any = { page, page_size: pageSize };
        if (search) params.search = search;
        const response = await adminApi.get('/api/admin/users', { params });
        return response.data;
    },

    // 导出用户
    exportUsers: async () => {
        const response = await adminApi.get('/api/admin/users/export', {
            responseType: 'blob', // Important for file download
        });
        return response.data;
    },

    // 获取艺术品列表
    getAnalyses: async (page = 1, pageSize = 20, status = 'all') => {
        const response = await adminApi.get('/api/admin/analyses', {
            params: { page, page_size: pageSize, status },
        });
        return response.data;
    },

    // 删除艺术品
    deleteAnalysis: async (id: number) => {
        const response = await adminApi.delete(`/api/admin/analyses/${id}`);
        return response.data;
    },

    // 批量删除艺术品
    batchDeleteAnalyses: async (ids: number[]) => {
        const response = await adminApi.post('/api/admin/analyses/batch-delete', { ids });
        return response.data;
    },
};
