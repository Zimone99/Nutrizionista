import axios from 'axios'

const api = axios.create({
    baseURL: 'https://nutrizionista-back.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})

export default api