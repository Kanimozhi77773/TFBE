import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl p-6 w-full max-w-md mx-4 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-primary-text">{title}</h3>
          <button 
            onClick={onClose}
            className="text-secondary-text hover:text-primary-text"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;