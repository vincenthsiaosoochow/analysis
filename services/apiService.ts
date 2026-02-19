/**
 * API 客户端配置
 * 用于与后端服务通信
 */

// API 基础 URL
// 简化架构：直接通过相对路径访问后端（由后端托管前端时自动处理）
// 简化架构：由于各 API 方法中已经包含 '/api' 前缀，此处设为空字符串
const API_BASE_URL = '';

/**
 * 通用请求函数
 */
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // 获取 token
    const token = localStorage.getItem('auth_token');

    const headers: HeadersInit = {
        ...options.headers,
    };

    // 如果有 token，添加到请求头
    if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 如果 body 是 JSON 对象，添加 Content-Type
    if (options.body && typeof options.body === 'string') {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: '请求失败' }));
        throw new Error(error.detail || '请求失败');
    }

    return response.json();
}

/**
 * 认证相关 API
 */
export const authAPI = {
    /**
     * 用户注册
     */
    register: async (data: { phone: string; password: string; name?: string }) => {
        return request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * 用户登录
     */
    login: async (data: { phone: string; password: string }) => {
        const result = await request<{
            success: boolean;
            token: string;
            user: { id: number; name: string; phone: string; avatar: string; is_admin?: boolean };
        }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // 保存 token
        if (result.token) {
            localStorage.setItem('auth_token', result.token);
        }

        return result;
    },

    /**
     * 重置密码
     */
    resetPassword: async (data: { phone: string; new_password: string }) => {
        return request('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * 获取当前用户信息
     */
    getMe: async () => {
        return request<{
            id: number;
            name: string;
            phone: string;
            avatar: string;
            is_admin?: boolean;
        }>('/api/auth/me');
    },

    /**
     * 登出
     */
    logout: () => {
        localStorage.removeItem('auth_token');
    },

    /**
     * 申请成为管理员 (紧急修复)
     */
    claimAdmin: async () => {
        return request('/api/auth/claim-admin', { method: 'POST' });
    },
};

/**
 * 艺术品分析相关 API
 */
export const analysisAPI = {
    /**
     * 上传并分析艺术品图片
     * @param imageFile 艺术品图片文件
     * @param title 用户提供的艺术品名称（可选，作为 AI 分析参考）
     * @param artist 用户提供的艺术家姓名（可选，作为 AI 分析参考）
     */
    analyze: async (imageFile: File, title?: string, artist?: string) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        if (title?.trim()) formData.append('title', title.trim());
        if (artist?.trim()) formData.append('artist', artist.trim());

        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/api/analysis/analyze`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: '分析失败' }));
            throw new Error(error.detail || '分析失败');
        }

        return response.json();
    },

    /**
     * 获取我的分析记录
     */
    getMyAnalyses: async () => {
        const result = await request<{ success: boolean; analyses: any[] }>(
            '/api/analysis/my-analyses'
        );
        return result.analyses;
    },

    /**
     * 获取公开分析列表
     */
    /**
     * 获取公开分析列表
     */
    discover: async (search?: string, limit: number = 20, sort: 'latest' | 'popular' | 'featured' | 'random' = 'latest') => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('limit', limit.toString());
        params.append('sort', sort);

        const endpoint = `/api/analysis/discover?${params.toString()}`;
        const result = await request<{ success: boolean; analyses: any[] }>(endpoint);
        return result.analyses;
    },

    toggleFavorite: async (analysisId: number) => {
        return request<{ success: boolean; isSaved: boolean }>(
            `/api/analysis/${analysisId}/favorite`,
            { method: 'POST' }
        );
    },

    /**
     * 获取单个分析详情
     */
    getAnalysisById: async (analysisId: number) => {
        return request<any>(`/api/analysis/${analysisId}`);
    },

    /**
     * 上传图片 (通用)
     */
    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: '上传失败' }));
            throw new Error(error.detail || '上传失败');
        }

        return response.json();
    },
};

export default { authAPI, analysisAPI };
