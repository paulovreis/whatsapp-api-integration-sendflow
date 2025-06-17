// Configuração do axios
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://api.helderporto.com/',
    headers: {
        'Content-Type': 'application/json',
    }
})

export default api;