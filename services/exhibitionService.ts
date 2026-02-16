import axios from 'axios';
import { Exhibition, ExhibitionFilterState } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create a configured axios instance (reuse existing logic if possible, but for isolation creating new one or using fetch wrapper)
// Assuming we can import 'authAPI' or similar to get token, or use interceptors. 
// For now, I'll use standard axios with localStorage token retrieval.

const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const exhibitionAPI = {
    // 获取列表
    getExhibitions: async (params?: ExhibitionFilterState): Promise<Exhibition[]> => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.city) queryParams.append('city', params.city);
        if (params?.keyword) queryParams.append('keyword', params.keyword);

        const response = await axios.get(`${API_BASE_URL}/exhibitions/`, {
            params: queryParams,
            headers: getAuthHeaders()
        });
        return response.data;
    },

    // 获取详情
    getExhibition: async (id: number): Promise<Exhibition> => {
        const response = await axios.get(`${API_BASE_URL}/exhibitions/${id}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    // 我的收藏
    getMyFavorites: async (): Promise<Exhibition[]> => {
        const response = await axios.get(`${API_BASE_URL}/exhibitions/my/favorites`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    // 收藏/取消收藏
    toggleFavorite: async (id: number): Promise<{ is_favorited: boolean }> => {
        const response = await axios.post(`${API_BASE_URL}/exhibitions/${id}/favorite`, {}, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    // 管理员：新增
    createExhibition: async (data: Partial<Exhibition>): Promise<Exhibition> => {
        const response = await axios.post(`${API_BASE_URL}/exhibitions/`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    // 管理员：删除
    deleteExhibition: async (id: number): Promise<void> => {
        await axios.delete(`${API_BASE_URL}/exhibitions/${id}`, {
            headers: getAuthHeaders()
        });
    },

    // 管理员：批量删除
    batchDelete: async (ids: number[]): Promise<{ deleted_count: number }> => {
        const response = await axios.post(`${API_BASE_URL}/exhibitions/batch-delete`, ids, {
            headers: getAuthHeaders()
        });
        return response.data;
    }
};
