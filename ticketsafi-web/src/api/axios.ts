import axios from 'axios';

// Create a dedicated instance of axios
const api = axios.create({
    // Point to your Django backend
    //baseURL: 'http://localhost:8000', 
    baseURL: 'http://162.243.104.205/',
    
    // CRITICAL: This allows cookies to be sent/received
    withCredentials: true, 
    
    headers: {
        'Content-Type': 'application/json',
    }
});

// Optional: Add an interceptor to handle 401 (Unauthorized) errors
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