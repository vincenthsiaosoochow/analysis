import axios from 'axios';
import { Exhibition, ExhibitionFilterState } from '../types';

const API_BASE_URL = ''; // Rely on relative path / proxy

// Create a configured axios instance
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

        const response = await axios.get(`${API_BASE_URL}/api/exhibitions/`, {
            params: queryParams,
            headers: getAuthHeaders()
        });
        return response.data;
    },

    // 获取有展览的城市列表
    getCities: async (): Promise<string[]> => {
        const response = await axios.get(`${API_BASE_URL}/api/exhibitions/cities`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },


    // 获取详情
    getExhibition: async (id: number): Promise<Exhibition> => {
        const response = await axios.get(`${API_BASE_URL}/api/exhibitions/${id}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    // 我的收藏
    getMyFavorites: async (): Promise<Exhibition[]> => {
        const response = await axios.get(`${API_BASE_URL}/api/users/me/exhibitions`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    // 收藏/取消收藏
    toggleFavorite: async (id: number): Promise<{ is_favorited: boolean }> => {
        const response = await axios.post(`${API_BASE_URL}/api/exhibitions/${id}/favorite`, {}, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    // 管理员：新增
    createExhibition: async (data: Partial<Exhibition>): Promise<Exhibition> => {
        const response = await axios.post(`${API_BASE_URL}/api/exhibitions/`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    // 管理员：更新
    updateExhibition: async (id: number, data: Partial<Exhibition>): Promise<Exhibition> => {
        const response = await axios.put(`${API_BASE_URL}/api/exhibitions/${id}`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    },


    // 管理员：删除
    deleteExhibition: async (id: number): Promise<void> => {
        await axios.delete(`${API_BASE_URL}/api/exhibitions/${id}`, {
            headers: getAuthHeaders()
        });
    },

    // 管理员：批量删除
    batchDelete: async (ids: number[]): Promise<{ deleted_count: number }> => {
        const response = await axios.post(`${API_BASE_URL}/api/exhibitions/batch-delete`, ids, {
            headers: getAuthHeaders()
        });
        return response.data;
    }
};
