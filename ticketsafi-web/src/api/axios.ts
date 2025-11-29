import axios from 'axios';


const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: baseURL, 
    
    withCredentials: true, 
    
    headers: {
        'Content-Type': 'application/json',
    }
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // If the user isn't logged in, we might want to redirect them
            // window.location.href = '/login'; 
            console.log("User is not logged in or session expired");
        }
        return Promise.reject(error);
    }
);

export default api;