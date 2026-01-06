import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import documentApi from '../utils/documentApi';
import PageNavigation from '../components/PageNavigation';
import AuthContext from '../context/AuthContext';
import FileUploadBox from '../components/FileUploadBox';

const UploadDocument = () => {
  const { user, logout } = useContext(AuthContext);
  
  // Check if user has permission to upload documents
  if (user && (user.role === 'admin' || user.role === 'auditor')) {
    return (
      <div className="min-h-screen bg-background">
        <PageNavigation />
        
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-accent hover:text-accent-soft"
            >
              <svg className="mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back
            </button>
          </div>
          
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-surface rounded-xl shadow-md p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-primary-text mb-2">Access Denied</h1>
                <p className="text-secondary-text">
                  Document upload functionality is not available for your role.
                </p>
              </div>
              <div className="text-secondary-text mb-6">
                <p>Only bank and corporate users can upload documents.</p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-background bg-accent hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const [formData, setFormData] = useState({
    doc_type: '',
    doc_number: '',
    issued_at: '',
    file: null
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileSelect = (file) => {
    setFormData({ ...formData, file });
    setErrors({ ...errors, file: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.file) newErrors.file = 'Please select a file to upload';
    if (!formData.doc_type) newErrors.doc_type = 'Please select a document type';
    if (!formData.doc_number) newErrors.doc_number = 'Please enter a document number';
    if (!formData.issued_at) newErrors.issued_at = 'Please enter the issue date';
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await documentApi.uploadDocument(formData.file, formData.doc_type, formData.doc_number, formData.issued_at);
      setSuccess('Document uploaded successfully! Redirecting to document details...');
      setTimeout(() => {
        navigate(`/documents/${result.id}`);
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to upload document. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageNavigation />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-accent hover:text-accent-soft"
          >
            <svg className="mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back
          </button>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-text mb-2">Upload Document</h1>
            <p className="text-secondary-text">
              Upload your PDF, JPG, or PNG documents for secure storage and verification
            </p>
          </div>

          <div className="bg-surface rounded-xl shadow-md p-6 md:p-8">
            <div className="space-y-6">
              {/* Document Type */}
              <div>
                <label htmlFor="docType" className="block text-sm font-medium text-secondary-text mb-1">
                  Document Type
                </label>
                <select
                  id="docType"
                  name="doc_type"
                  value={formData.doc_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
                >
                  <option value="" className="text-secondary-text bg-background">Select a document type</option>
                  <option value="LOC" className="text-primary-text bg-background">Letter of Credit (LOC)</option>
                  <option value="INVOICE" className="text-primary-text bg-background">Invoice</option>
                  <option value="BILL_OF_LADING" className="text-primary-text bg-background">Bill of Lading</option>
                  <option value="PO" className="text-primary-text bg-background">Purchase Order (PO)</option>
                  <option value="COO" className="text-primary-text bg-background">Certificate of Origin (COO)</option>
                  <option value="INSURANCE_CERT" className="text-primary-text bg-background">Insurance Certificate</option>
                </select>
                {errors.doc_type && <p className="mt-1 text-sm text-red-400">{errors.doc_type}</p>}
              </div>

              {/* Document Number */}
              <div>
                <label htmlFor="docNumber" className="block text-sm font-medium text-secondary-text mb-1">
                  Document Number
                </label>
                <input
                  type="text"
                  id="docNumber"
                  name="doc_number"
                  value={formData.doc_number}
                  onChange={handleInputChange}
                  placeholder="Enter document number"
                  className="mt-1 block w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text placeholder-secondary-text"
                />
                {errors.doc_number && <p className="mt-1 text-sm text-red-400">{errors.doc_number}</p>}
              </div>

              {/* Issued At */}
              <div>
                <label htmlFor="issuedAt" className="block text-sm font-medium text-secondary-text mb-1">
                  Issued At
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    id="issuedAt"
                    name="issued_at"
                    value={formData.issued_at}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                </div>
                {errors.issued_at && <p className="mt-1 text-sm text-red-400">{errors.issued_at}</p>}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-1">
                  Document File
                </label>
                <FileUploadBox 
                  onFileSelect={handleFileSelect} 
                  currentFile={formData.file}
                />
                {errors.file && <p className="mt-1 text-sm text-red-400">{errors.file}</p>}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-900/30 border border-red-800/50 text-red-200 px-4 py-3 rounded-lg">
                  <p>{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-900/30 border border-green-800/50 text-green-200 px-4 py-3 rounded-lg">
                  <p>{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-background bg-accent hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Upload Document'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadDocument;