import axios from 'axios';

const API_BASE_URL = '/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    
    // Set up axios interceptor for authentication
    axios.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Set up response interceptor for handling auth errors
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password
      });

      const { token, user } = response.data;
      this.token = token;
      this.user = user;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  }

  async register(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, {
        email,
        password
      });

      const { token, user } = response.data;
      this.token = token;
      this.user = user;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }
}

export default new AuthService(); 