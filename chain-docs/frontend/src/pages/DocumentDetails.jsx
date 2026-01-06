import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import documentApi from '../utils/documentApi';
import PageNavigation from '../components/PageNavigation';
import AuthContext from '../context/AuthContext';

const DocumentDetails = () => {
  const { logout } = useContext(AuthContext);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(mode === 'edit'); // Start in edit mode if mode=edit
  const [editForm, setEditForm] = useState({
    doc_type: '',
    doc_number: '',
    issued_at: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const data = await documentApi.getDocumentById(id);
        setDocument(data);
        // Initialize edit form with current document data
        setEditForm({
          doc_type: data.doc_type,
          doc_number: data.doc_number,
          issued_at: data.issued_at ? new Date(data.issued_at).toISOString().slice(0, 16) : ''
        });
        
        // Check if user can edit this document
        // Users can edit their own documents EXCEPT bank and corporate users
        // Admins can edit any document
        // Auditors can edit any document
        const userInfo = JSON.parse(localStorage.getItem('user'));
        if (userInfo) {
          // Bank and corporate users cannot edit any documents (even their own)
          if (userInfo.role === 'bank' || userInfo.role === 'corporate') {
            setCanEdit(false);
          } else if (data.owner_id === userInfo.id) {
            // Other users can edit their own documents
            setCanEdit(true);
          } else if (userInfo.role === 'admin' || userInfo.role === 'auditor') {
            // Admins and auditors can edit any document
            setCanEdit(true);
          } else {
            setCanEdit(false);
          }
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        if (err.response?.status === 403) {
          setError('Access denied. You do not have permission to view this document.');
        } else if (err.response?.status === 404) {
          setError('Document not found.');
        } else {
          setError('Failed to load document details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    setError(''); // Clear any previous errors
    setSuccess(''); // Clear any previous success messages
    try {
      console.log('Starting download for document ID:', id);
      const blob = await documentApi.downloadDocument(id);
      console.log('Received blob:', blob);
      console.log('Blob type:', blob.type);
      console.log('Blob size:', blob.size);
      
      // Use window.document instead of document (which is the prop)
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.doc_number}_${document.doc_type}.pdf` || 'document.pdf';
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      console.log('Download completed successfully');
      setSuccess('Document downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      // More detailed error handling
      if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to download this document.');
      } else if (err.response?.status === 404) {
        setError('Document not found.');
      } else if (err.response) {
        // Handle other HTTP errors
        setError(`Download failed with status ${err.response.status}: ${err.response.statusText}`);
      } else if (err.request) {
        // Handle network errors
        setError('Network error. Please check your connection and try again.');
      } else {
        // Handle other errors
        setError('Failed to download document. Please try again later.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async () => {
    try {
      const editData = {
        doc_type: editForm.doc_type,
        doc_number: editForm.doc_number,
        issued_at: new Date(editForm.issued_at).toISOString()
      };
      
      const updatedDocument = await documentApi.editDocument(id, editData);
      setDocument(updatedDocument);
      setEditing(false);
      setSuccess('Document updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Edit error:', err);
      if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to edit this document.');
      } else {
        setError('Failed to update document. Please try again.');
      }
    }
  };

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

  const getFileExtension = (fileUrl) => {
    if (!fileUrl) return '';
    return fileUrl.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const formatDate = (dateString) => {
    try {
      // Handle ISO date strings
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      // Format with explicit timezone handling
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, // Use 12-hour format
        timeZoneName: 'short'
      };
      
      // Use UTC to avoid local timezone conversion issues
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown Date';
    }
  };

  const getFileIcon = (fileUrl) => {
    // Extract extension from file URL
    const extension = fileUrl?.split('.').pop()?.toLowerCase() || '';
    
    if (extension === 'pdf') {
      return (
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      );
    } else if (['jpg', 'jpeg', 'png'].includes(extension)) {
      return (
        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      );
    }
    return (
      <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-secondary-text">Loading document details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageNavigation />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/documents')}
            className="inline-flex items-center text-accent hover:text-accent-soft"
          >
            <svg className="mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Documents
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800/50 text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-800/50 text-green-200 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-surface rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-border-subtle">
            <div className="flex items-start space-x-4">
              {getFileIcon(document.file_url)}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-primary-text truncate">
                  {editing ? (
                    <input
                      type="text"
                      name="doc_number"
                      value={editForm.doc_number}
                      onChange={handleEditChange}
                      className="text-2xl font-bold text-primary-text border-b border-border-subtle focus:outline-none focus:border-accent bg-background"
                    />
                  ) : (
                    `${getDocTypeLabel(document.doc_type)} #${document.doc_number}`
                  )}
                </h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-200 border border-blue-800/50">
                    {getFileExtension(document.file_url)}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-200 border border-green-800/50">
                    Issued: {editing ? (
                      <input
                        type="datetime-local"
                        name="issued_at"
                        value={editForm.issued_at}
                        onChange={handleEditChange}
                        className="text-xs bg-transparent border-b border-border-subtle focus:outline-none focus:border-accent"
                      />
                    ) : (
                      formatDate(document.issued_at)
                    )}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-200 border border-purple-800/50">
                    Created: {formatDate(document.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {editing ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-secondary-text mb-1">
                  Document Type
                </label>
                <select
                  name="doc_type"
                  value={editForm.doc_type}
                  onChange={handleEditChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
                >
                  <option value="LOC" className="text-primary-text bg-background">Letter of Credit (LOC)</option>
                  <option value="INVOICE" className="text-primary-text bg-background">Invoice</option>
                  <option value="BILL_OF_LADING" className="text-primary-text bg-background">Bill of Lading</option>
                  <option value="PO" className="text-primary-text bg-background">Purchase Order (PO)</option>
                  <option value="COO" className="text-primary-text bg-background">Certificate of Origin (COO)</option>
                  <option value="INSURANCE_CERT" className="text-primary-text bg-background">Insurance Certificate</option>
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-background/30 rounded-lg p-4 border border-border-subtle">
                  <h3 className="text-sm font-medium text-secondary-text uppercase tracking-wide">Document Details</h3>
                  <dl className="mt-2 space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-secondary-text">Document Type</dt>
                      <dd className="text-sm text-primary-text">{getDocTypeLabel(document.doc_type)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-secondary-text">Document Number</dt>
                      <dd className="text-sm text-primary-text">#{document.doc_number}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-secondary-text">Issued At</dt>
                      <dd className="text-sm text-primary-text">{formatDate(document.issued_at)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-background bg-accent hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Download Document
                  </>
                )}
              </button>

              {canEdit && mode !== 'view' && (
                <>
                  {editing ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-background bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          // Update URL to reflect view mode
                          const newUrl = new URL(window.location);
                          newUrl.searchParams.set('mode', 'view');
                          window.history.replaceState({}, '', newUrl);
                        }}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-border-subtle shadow-sm text-sm font-medium rounded-md text-primary-text bg-surface hover:bg-[#1a2435] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setEditing(true);
                        // Update URL to reflect edit mode
                        const newUrl = new URL(window.location);
                        newUrl.searchParams.set('mode', 'edit');
                        window.history.replaceState({}, '', newUrl);
                      }}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-border-subtle shadow-sm text-sm font-medium rounded-md text-primary-text bg-surface hover:bg-[#1a2435] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Edit Document
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetails;