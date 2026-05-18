import axios from 'axios';

const instance = axios.create({
    // Use Vite dev proxy (same origin) so Sanctum cookies work reliably
    baseURL: import.meta.env.DEV ? '' : 'http://localhost:8000',
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    },
    // This is CRITICAL for Laravel Sanctum to work
    withCredentials: true, 
});

export default instance;