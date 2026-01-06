import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const PageNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  
  // Define navigation items based on user role
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'documents', label: 'My Documents', path: '/documents' },
    { id: 'ledger', label: 'Ledger', path: '/ledger' },
    // Show upload option only for bank and corporate users
    ...(user && user.role !== 'admin' && user.role !== 'auditor' ? [{ id: 'upload', label: 'Upload Document', path: '/upload' }] : [])
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-surface border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === item.path
                      ? 'bg-accent text-background'
                      : 'text-secondary-text hover:text-primary-text hover:bg-[#1a2435]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-background text-sm font-medium">
                    {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-primary-text">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-secondary-text capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-md text-sm font-medium text-secondary-text hover:text-primary-text hover:bg-[#1a2435]"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageNavigation;