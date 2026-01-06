import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    org_name: ''
  });
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Enhanced email validation function
  const validateEmail = (email) => {
    // Rule 1: The email must contain exactly one @
    if (email.split('@').length !== 2) {
      return "Email must contain exactly one '@' symbol";
    }
    
    const [localPart, domainPart] = email.split('@');
    
    // Rule 2: Local Part Rules (before '@')
    // must not be empty
    if (!localPart) {
      return "Local part (before '@') cannot be empty";
    }
    
    // must not start or end with .
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return "Local part (before '@') cannot start or end with '.'";
    }
    
    // Local part must match: ^[A-Za-z0-9._-]+$
    if (!/^[A-Za-z0-9._-]+$/.test(localPart)) {
      return "Local part contains invalid characters. Allowed: letters, digits, '.', '_', '-'";
    }
    
    // Rule 3: Domain Name Rules (between @ and last .)
    if (!domainPart) {
      return "Domain part (after '@') cannot be empty";
    }
    
    // must contain at least one .
    if (!domainPart.includes('.')) {
      return "Domain part (after '@') must contain at least one '.'";
    }
    
    const domainParts = domainPart.split('.');
    const domainName = domainParts[0];
    const tld = domainParts[domainParts.length - 1];
    
    // Domain name must match: ^[A-Za-z0-9-]+$
    if (!/^[A-Za-z0-9-]+$/.test(domainName)) {
      if (domainName.includes('_')) {
        return "Domain cannot contain '_'";
      } else if (domainName.startsWith('-')) {
        return "Domain cannot start with '-'";
      } else if (domainName.endsWith('-')) {
        return "Domain cannot end with '-'";
      } else {
        return "Domain contains invalid characters";
      }
    }
    
    // Rule 4: TLD Rules (after last '.')
    // Must be only letters: ^[A-Za-z]+$
    if (!/^[A-Za-z]+$/.test(tld)) {
      return "Top-level domain must be at least 2 letters and contain only A–Z characters";
    }
    
    // Must be at least 2 characters
    if (tld.length < 2) {
      return "Top-level domain must be at least 2 letters and contain only A–Z characters";
    }
    
    // Rule 5: No consecutive dots
    if (email.includes('..')) {
      return "Email cannot contain consecutive dots '..'";
    }
    
    // Rule 6: No spaces
    if (email.includes(' ')) {
      return "Email cannot contain spaces";
    }
    
    // If all validations pass
    return null;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear email error when user starts typing
    if (e.target.name === 'email') {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setIsLoading(true);

    // Validate email
    const emailValidationError = validateEmail(formData.email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      setIsLoading(false);
      return;
    }

    // Validate required fields
    if (!formData.name || !formData.password || !formData.role || !formData.org_name) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length > 72) {
      setError('Password cannot be longer than 72 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post('/auth/register', formData);
      
      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.detail) {
        // Handle backend validation errors
        // Check if it's the new error format (string) or old format (array)
        if (typeof err.response.data.detail === 'string') {
          // New format - direct error message
          if (err.response.data.detail.includes('Email already registered')) {
            setEmailError('This email is already registered. Please use a different email or log in instead.');
          } else {
            setError(err.response.data.detail);
          }
        } else if (Array.isArray(err.response.data.detail)) {
          // Old format - array of errors
          const backendError = err.response.data.detail[0];
          if (backendError.field === 'email') {
            setEmailError(backendError.message);
          } else {
            setError(backendError.message || 'Registration failed. Please try again.');
          }
        } else {
          setError('Registration failed. Please try again.');
        }
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
            <h2 className="text-2xl font-bold text-primary-text mb-2">Create Account</h2>
            <p className="text-secondary-text">Join our blockchain explorer platform</p>
          </div>
          
          {success ? (
            <div className="rounded-lg bg-green-900/30 border border-green-800/50 p-4">
              <p className="text-green-300 text-center">Registration successful! Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-900/30 border border-red-800/50 p-3">
                  <p className="text-red-300 text-center">{error}</p>
                </div>
              )}
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-secondary-text mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2 text-primary-text focus:border-accent focus:outline-none focus:ring-0 focus:shadow-accent-glow transition-all"
                  placeholder="John Doe"
                />
              </div>
              
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
                {emailError && (
                  <div className="mt-2 text-sm text-red-400">
                    {emailError}
                  </div>
                )}
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
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-secondary-text mb-1">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2 text-primary-text focus:border-accent focus:outline-none focus:ring-0 focus:shadow-accent-glow transition-all"
                >
                  <option value="" className="bg-surface">Select your role</option>
                  <option value="bank" className="bg-surface">Bank</option>
                  <option value="corporate" className="bg-surface">Corporate</option>
                  <option value="auditor" className="bg-surface">Auditor</option>
                  <option value="admin" className="bg-surface">Admin</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="org_name" className="block text-sm font-medium text-secondary-text mb-1">
                  Organization Name
                </label>
                <input
                  id="org_name"
                  name="org_name"
                  type="text"
                  value={formData.org_name}
                  onChange={handleChange}
                  className="w-full bg-transparent border border-border-subtle rounded-lg px-4 py-2 text-primary-text focus:border-accent focus:outline-none focus:ring-0 focus:shadow-accent-glow transition-all"
                  placeholder="Acme Corporation"
                />
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
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}
          
          <div className="text-center pt-4">
            <Link 
              to="/login" 
              className="text-accent-soft hover:text-accent hover:underline transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;