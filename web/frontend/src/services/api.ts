// Configuração do axios
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://api.helderporto.com/',
    headers: {
        'Content-Type': 'application/json',
    }
})

// Adiciona função para setar token dinamicamente
export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

// Função para obter novo access token usando refresh token
export const refreshAccessToken = async (refreshToken: string) => {
    try {
        const response = await api.post('/auth/refresh', { refreshToken });
        return response.data.token;
    } catch (err) {
        return null;
    }
};

export default api;