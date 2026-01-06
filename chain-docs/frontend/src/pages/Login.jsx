import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate required fields
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post('/auth/login', formData);

      if (response.status === 200) {
        // Login successful
        const { user, access_token, refresh_token } = response.data;
        login(user, access_token, refresh_token);
        navigate('/dashboard');
      } else {
        setError(response.data.detail || 'Invalid email or password');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Full-screen background with gradient
    <div className="min-h-screen flex items-center justify-center bg-background bg-gradient-to-br from-background to-surface p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-accent mb-2">TradeFinEx</h1>
          <p className="text-secondary-text">Enterprise Blockchain Solutions</p>
        </div>
        
        {/* Card with rounded corners and shadow */}
        <div className="bg-surface rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-primary-text mb-2">Sign In</h2>
            <p className="text-secondary-text">Access your account</p>
          </div>
          
          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800/50 p-3">
              <p className="text-red-300 text-center">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-text mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2 text-primary-text focus:border-accent focus:outline-none focus:ring-0 focus:shadow-accent-glow transition-all"
                placeholder="john@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-text mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2 text-primary-text focus:border-accent focus:outline-none focus:ring-0 focus:shadow-accent-glow transition-all"
                placeholder="••••••••"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-accent focus:ring-accent border-border-subtle rounded bg-transparent"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary-text">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <a href="#" className="font-medium text-accent-soft hover:text-accent hover:underline transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent text-background font-medium rounded-lg px-4 py-2.5 hover:bg-[#c4a330] hover:scale-[1.02] transition-transform duration-200 ease-in-out focus:outline-none focus:ring-0 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
          
          <div className="text-center pt-4">
            <Link 
              to="/register" 
              className="text-accent-soft hover:text-accent hover:underline transition-colors"
            >
              Don't have an account? Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;