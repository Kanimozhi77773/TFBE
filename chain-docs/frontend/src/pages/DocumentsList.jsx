import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import documentApi from '../utils/documentApi';
import PageNavigation from '../components/PageNavigation';
import DocumentCard from '../components/DocumentCard';
import AuthContext from '../context/AuthContext';

const DocumentsList = () => {
  const { logout } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    docType: '',
    docNumber: '',
    issuedFrom: '',
    issuedTo: '',
    createdFrom: '',
    createdTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const filterParams = {};
      
      if (filters.docType) filterParams.docType = filters.docType;
      if (filters.docNumber) filterParams.docNumber = filters.docNumber;
      if (filters.issuedFrom) filterParams.issuedFrom = new Date(filters.issuedFrom);
      if (filters.issuedTo) filterParams.issuedTo = new Date(filters.issuedTo);
      if (filters.createdFrom) filterParams.createdFrom = new Date(filters.createdFrom);
      if (filters.createdTo) filterParams.createdTo = new Date(filters.createdTo);
      
      const data = await documentApi.getMyDocuments(filterParams);
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchDocuments();
  };

  const handleClearFilters = () => {
    setFilters({
      docType: '',
      docNumber: '',
      issuedFrom: '',
      issuedTo: '',
      createdFrom: '',
      createdTo: ''
    });
    // Re-fetch documents without filters
    fetchDocuments();
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageNavigation />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary-text">My Documents</h1>
            <p className="mt-2 text-secondary-text">
              Manage and view your uploaded documents
            </p>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-background bg-accent hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Upload Document
          </button>
        </div>

        {/* Filter Section */}
        <div className="mb-6 bg-surface rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-primary-text">Filter Documents</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-accent hover:text-accent-soft font-medium"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>
          
          {showFilters && (
            <div className="filter-content-wrapper">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Document Type */}
                <div>
                  <label htmlFor="docType" className="block text-sm font-medium text-secondary-text mb-1">
                    Document Type
                  </label>
                  <select
                    id="docType"
                    name="docType"
                    value={filters.docType}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
                  >
                    <option value="" className="text-primary-text bg-background">All Types</option>
                    <option value="LOC" className="text-primary-text bg-background">Letter of Credit</option>
                    <option value="INVOICE" className="text-primary-text bg-background">Invoice</option>
                    <option value="BILL_OF_LADING" className="text-primary-text bg-background">Bill of Lading</option>
                    <option value="PO" className="text-primary-text bg-background">Purchase Order</option>
                    <option value="COO" className="text-primary-text bg-background">Certificate of Origin</option>
                    <option value="INSURANCE_CERT" className="text-primary-text bg-background">Insurance Certificate</option>
                  </select>
                </div>

                {/* Document Number */}
                <div>
                  <label htmlFor="docNumber" className="block text-sm font-medium text-secondary-text mb-1">
                    Document Number
                  </label>
                  <input
                    type="text"
                    id="docNumber"
                    name="docNumber"
                    value={filters.docNumber}
                    onChange={handleFilterChange}
                    placeholder="Enter document number"
                    className="mt-1 block w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text placeholder-secondary-text"
                  />
                </div>

                {/* Issued From */}
                <div>
                  <label htmlFor="issuedFrom" className="block text-sm font-medium text-secondary-text mb-1">
                    Issued From
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="issuedFrom"
                      name="issuedFrom"
                      value={filters.issuedFrom}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Issued To */}
                <div>
                  <label htmlFor="issuedTo" className="block text-sm font-medium text-secondary-text mb-1">
                    Issued To
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="issuedTo"
                      name="issuedTo"
                      value={filters.issuedTo}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Created From */}
                <div>
                  <label htmlFor="createdFrom" className="block text-sm font-medium text-secondary-text mb-1">
                    Created From
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="createdFrom"
                      name="createdFrom"
                      value={filters.createdFrom}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Created To */}
                <div>
                  <label htmlFor="createdTo" className="block text-sm font-medium text-secondary-text mb-1">
                    Created To
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="createdTo"
                      name="createdTo"
                      value={filters.createdTo}
                      onChange={handleFilterChange}
                      className="mt-1 block w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleApplyFilters}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-background bg-accent hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center px-4 py-2 border border-border-subtle text-sm font-medium rounded-md shadow-sm text-primary-text bg-surface hover:bg-[#1a2435] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-200 px-4 py-3 rounded-lg mb-6">
            <p className="text-center">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && documents.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 className="mt-2 text-lg font-medium text-primary-text">No documents</h3>
            <p className="mt-1 text-secondary-text">Get started by uploading a new document.</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/upload')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-background bg-accent hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Upload Document
              </button>
            </div>
          </div>
        )}

        {/* Documents Grid */}
        {!loading && !error && documents.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsList;