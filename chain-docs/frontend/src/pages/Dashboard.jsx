import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import AuthContext from '../context/AuthContext';
import PageNavigation from '../components/PageNavigation';
import documentApi from '../utils/documentApi';

const Dashboard = () => {
  console.log('Dashboard component rendering...');
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documentCount, setDocumentCount] = useState(0);
  const [allDocumentsWithUsers, setAllDocumentsWithUsers] = useState([]);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showAdminView, setShowAdminView] = useState(false);
  const [accessibleDocumentCount, setAccessibleDocumentCount] = useState(0);
  const [filters, setFilters] = useState({
    docType: '',
    docNumber: '',
    issuedFrom: '',
    createdFrom: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        console.log('Fetching user info...');
        const response = await axiosInstance.get('/auth/me');
        console.log('User info response:', response);
        
        if (response.status === 200) {
          setUserInfo(response.data);
          // Check if user is admin or auditor
          if (response.data.role === 'admin' || response.data.role === 'auditor') {
            console.log('User is admin or auditor, showing admin view');
            setShowAdminView(true);
            fetchAllDocuments();
            fetchAccessibleDocumentCount();
          } else {
            console.log('User is not admin or auditor, hiding admin view');
            setShowAdminView(false);
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        // If we get a 401, the token might be invalid, so logout
        if (error.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchDocumentCount = async () => {
      try {
        const documents = await documentApi.getMyDocuments();
        setDocumentCount(documents.length);
      } catch (error) {
        console.error('Error fetching document count:', error);
      }
    };

    const fetchAccessibleDocumentCount = async () => {
      try {
        // For admin/auditor, we need to get count of all accessible documents
        const response = await axiosInstance.get('/documents/all-with-users');
        setAccessibleDocumentCount(response.data.length);
      } catch (error) {
        console.error('Error fetching accessible document count:', error);
      }
    };

    const fetchAllDocuments = async () => {
      try {
        console.log('Fetching all documents...');
        // For admin/auditor, we need a special endpoint to get all documents with user info
        const response = await axiosInstance.get('/documents/all-with-users');
        console.log('All documents response:', response);
        setAllDocumentsWithUsers(response.data);
      } catch (error) {
        console.error('Error fetching all documents:', error);
      }
    };

    if (user) {
      console.log('User found in context:', user);
      setUserInfo(user);
      setLoading(false);
      // Check if user is admin or auditor
      if (user.role === 'admin' || user.role === 'auditor') {
        console.log('Context user is admin or auditor, showing admin view');
        setShowAdminView(true);
        fetchAllDocuments();
        fetchAccessibleDocumentCount();
      } else {
        console.log('Context user is not admin or auditor, hiding admin view');
        setShowAdminView(false);
      }
    } else {
      fetchUserInfo();
    }

    fetchDocumentCount();
  }, [user, navigate, logout]);

  const getDocTypeLabel = (docType) => {
    const labels = {
      'LOC': 'Letter of Credit',
      'INVOICE': 'Invoice',
      'BILL_OF_LADING': 'Bill of Lading',
      'PO': 'Purchase Order',
      'COO': 'Certificate of Origin',
      'INSURANCE_CERT': 'Insurance Certificate'
    };
    return labels[docType] || docType;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleDeleteClick = (documentId) => {
    setDocumentToDelete(documentId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await documentApi.deleteDocument(documentToDelete);
      // Update the state to remove the deleted document
      setAllDocumentsWithUsers(allDocumentsWithUsers.filter(doc => doc.id !== documentToDelete));
      setShowDeleteModal(false);
      setDocumentToDelete(null);
      // Update the accessible document count
      setAccessibleDocumentCount(prevCount => prevCount - 1);
      // Show success message
      setSuccessMessage("Document deleted successfully");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error('Error deleting document:', error);
      setShowDeleteModal(false);
      setDocumentToDelete(null);
      // Show error message to user
      let errorMessage = "Failed to delete document. Please try again.";
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setErrorMessage(errorMessage);
      // Clear error message after 5 seconds
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDocumentToDelete(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = async () => {
    try {
      const params = {};
      
      // Add filters to params if they exist
      if (filters.docType) params.doc_type = filters.docType;
      if (filters.docNumber) params.doc_number = filters.docNumber;
      if (filters.issuedFrom) params.issued_from = filters.issuedFrom;
      if (filters.createdFrom) params.created_from = filters.createdFrom;
      
      // Fetch filtered documents
      const response = await axiosInstance.get('/documents/all-with-users', { params });
      setAllDocumentsWithUsers(response.data);
    } catch (error) {
      console.error('Error applying filters:', error);
    }
  };

  const handleClearFilters = async () => {
    setFilters({
      docType: '',
      docNumber: '',
      issuedFrom: '',
      createdFrom: ''
    });
    
    // Re-fetch all documents without filters
    try {
      const response = await axiosInstance.get('/documents/all-with-users');
      setAllDocumentsWithUsers(response.data);
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  };

  if (loading) {
    console.log('Dashboard is loading...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-secondary-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering dashboard main content...');
  return (
    <div className="min-h-screen bg-background">
      <PageNavigation />
      
      {/* Success and Error Messages */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-900/30 border border-green-800/50 text-green-200 px-4 py-3 rounded-lg">
            <p className="text-center">{successMessage}</p>
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-900/30 border border-red-800/50 text-red-200 px-4 py-3 rounded-lg">
            <p className="text-center">{errorMessage}</p>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="px-6 lg:px-10 py-6">
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
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary-text">Dashboard</h1>
          <p className="text-secondary-text mt-2">Welcome to your blockchain explorer dashboard</p>
        </header>
        
        <main>
          {/* Document Management Section */}
          <div className="bg-surface rounded-2xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-primary-text">Document Management</h2>
                <p className="text-secondary-text mt-1">Upload, manage, and verify your documents</p>
              </div>
              <div className="flex space-x-2">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {documentCount} {documentCount === 1 ? 'Document' : 'Documents'}
                </div>
                {(userInfo?.role === 'admin' || userInfo?.role === 'auditor') && (
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {accessibleDocumentCount} Accessible
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Show Upload Document card only for bank and corporate users */}
              {userInfo && userInfo.role !== 'admin' && userInfo.role !== 'auditor' && (
                <Link 
                  to="/upload" 
                  className="flex items-center p-4 bg-[#1a2435] rounded-lg hover:bg-[#1f2a3d] transition-colors duration-200 border border-border-subtle"
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                    <svg className="h-6 w-6 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-primary-text">Upload Document</h3>
                    <p className="text-sm text-secondary-text">Securely upload PDF, JPG, or PNG files</p>
                  </div>
                </Link>
              )}
              
              <Link 
                to="/documents" 
                className="flex items-center p-4 bg-[#1a2435] rounded-lg hover:bg-[#1f2a3d] transition-colors duration-200 border border-border-subtle"
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                  <svg className="h-6 w-6 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-primary-text">My Documents</h3>
                  <p className="text-sm text-secondary-text">View and manage your uploaded documents</p>
                </div>
              </Link>
              
              <Link 
                to="/ledger" 
                className="flex items-center p-4 bg-[#1a2435] rounded-lg hover:bg-[#1f2a3d] transition-colors duration-200 border border-border-subtle"
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                  <svg className="h-6 w-6 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-primary-text">Ledger Explorer</h3>
                  <p className="text-sm text-secondary-text">View and explore ledger entries</p>
                </div>
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {/* User Info Card */}
            <div className="bg-surface rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-[#1a2435] rounded-lg p-3">
                  <svg className="h-6 w-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-secondary-text">Full Name</h4>
                  <p className="text-lg font-semibold text-primary-text">{userInfo?.name || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            {/* Email Card */}
            <div className="bg-surface rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-[#1a2435] rounded-lg p-3">
                  <svg className="h-6 w-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-secondary-text">Email</h4>
                  <p className="text-lg font-semibold text-primary-text">{userInfo?.email || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            {/* Role Card */}
            <div className="bg-surface rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-[#1a2435] rounded-lg p-3">
                  <svg className="h-6 w-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-secondary-text">Role</h4>
                  <p className="text-lg font-semibold text-primary-text capitalize">{userInfo?.role || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Organization Card */}
          <div className="bg-surface rounded-2xl shadow-md p-6 mb-8 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-[#1a2435] rounded-lg p-3">
                <svg className="h-6 w-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-secondary-text">Organization</h4>
                <p className="text-lg font-semibold text-primary-text">{userInfo?.org_name || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          {/* Admin View - All Documents */}
          {showAdminView && (
            <div className="bg-surface rounded-2xl shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-primary-text">All Documents</h2>
                  <p className="text-secondary-text mt-1">Manage all documents in the system</p>
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {allDocumentsWithUsers.length} {allDocumentsWithUsers.length === 1 ? 'Document' : 'Documents'}
                </div>
              </div>
              
              <div className="mb-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 border border-border-subtle text-primary-text rounded-md hover:bg-[#1a2435]"
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
              </div>
              
              {showFilters && (
                <div className="mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="docType" className="block text-sm font-medium text-secondary-text">Document Type</label>
                      <select
                        id="docType"
                        name="docType"
                        value={filters.docType}
                        onChange={handleFilterChange}
                        className="mt-1 block w-full py-2 px-3 border border-border-subtle bg-surface text-primary-text rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                      >
                        <option value="" className="text-primary-text bg-surface">All</option>
                        <option value="LOC" className="text-primary-text bg-surface">Letter of Credit</option>
                        <option value="INVOICE" className="text-primary-text bg-surface">Invoice</option>
                        <option value="BILL_OF_LADING" className="text-primary-text bg-surface">Bill of Lading</option>
                        <option value="PO" className="text-primary-text bg-surface">Purchase Order</option>
                        <option value="COO" className="text-primary-text bg-surface">Certificate of Origin</option>
                        <option value="INSURANCE_CERT" className="text-primary-text bg-surface">Insurance Certificate</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="docNumber" className="block text-sm font-medium text-secondary-text">Document Number</label>
                      <input
                        type="text"
                        id="docNumber"
                        name="docNumber"
                        value={filters.docNumber}
                        onChange={handleFilterChange}
                        className="mt-1 block w-full py-2 px-3 border border-border-subtle bg-surface text-primary-text rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                        placeholder="Enter document number"
                      />
                    </div>
                    <div className="relative">
                      <label htmlFor="issuedFrom" className="block text-sm font-medium text-secondary-text">Issued At</label>
                      <input
                        type="date"
                        id="issuedFrom"
                        name="issuedFrom"
                        value={filters.issuedFrom}
                        onChange={handleFilterChange}
                        className="mt-1 block w-full py-2 px-3 border border-border-subtle bg-surface text-primary-text rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm appearance-none"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-secondary-text mt-6">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="relative">
                      <label htmlFor="createdFrom" className="block text-sm font-medium text-secondary-text">Created At</label>
                      <input
                        type="date"
                        id="createdFrom"
                        name="createdFrom"
                        value={filters.createdFrom}
                        onChange={handleFilterChange}
                        className="mt-1 block w-full py-2 px-3 border border-border-subtle bg-surface text-primary-text rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm appearance-none"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-secondary-text mt-6">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={handleApplyFilters}
                      className="px-4 py-2 bg-accent text-background rounded-md hover:bg-[#c4a330]"
                    >
                      Apply Filters
                    </button>
                    <button
                      onClick={handleClearFilters}
                      className="px-4 py-2 border border-border-subtle text-primary-text rounded-md hover:bg-[#1a2435]"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
              
              {allDocumentsWithUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border-subtle">
                    <thead className="bg-[#1a2435]">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Document</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Owner</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Issued</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Created</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-border-subtle">
                      {allDocumentsWithUsers.map((document) => (
                        <tr key={document.id} className="hover:bg-[#1a2435]">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-primary-text">{document.doc_number}</div>
                            <div className="text-sm text-secondary-text">#{document.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-primary-text">{document.owner?.name || 'Unknown User'}</div>
                            <div className="text-sm text-secondary-text">{document.owner?.email || 'unknown@example.com'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {getDocTypeLabel(document.doc_type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">
                            {formatDate(document.issued_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">
                            {formatDate(document.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link to={`/documents/${document.id}?mode=view`} className="text-accent hover:text-[#c4a330] mr-3">
                              View
                            </Link>
                            <Link to={`/documents/${document.id}?mode=edit`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                              Edit
                            </Link>
                            <button 
                              onClick={() => handleDeleteClick(document.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-primary-text">No documents found</h3>
                  <p className="mt-1 text-secondary-text">There are no documents in the system yet.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-surface rounded-lg p-6 w-96 max-w-md border border-border-subtle">
                <h3 className="text-lg font-medium text-primary-text mb-4">Confirm Deletion</h3>
                <p className="text-secondary-text mb-6">Are you sure you want to delete this document? This action cannot be undone.</p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 border border-border-subtle text-primary-text rounded-md hover:bg-[#1a2435]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;