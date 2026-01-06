import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PageNavigation from '../components/PageNavigation';
import AuthContext from '../context/AuthContext';
import ledgerApi from '../utils/ledgerApi';
import documentApi from '../utils/documentApi';

const CreateLedgerEntry = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    document_id: '',
    action: '',
    metadata_json: ''
  });
  
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Action options for the dropdown
  const actionOptions = [
    'ISSUED', 'AMENDED', 'SHIPPED', 'RECEIVED', 'PAID', 'CANCELLED', 'VERIFIED'
  ];

  // Fetch user's documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await documentApi.getMyDocuments();
        setDocuments(response);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to fetch documents');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Parse metadata if it's provided
      let metadata = null;
      if (formData.metadata_json.trim()) {
        metadata = JSON.parse(formData.metadata_json);
      }

      await ledgerApi.createLedgerEntry(
        parseInt(formData.document_id),
        formData.action,
        metadata
      );

      setSuccess('Ledger entry created successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/ledger');
      }, 2000);
    } catch (err) {
      console.error('Error creating ledger entry:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Failed to create ledger entry. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-secondary-text">Loading documents...</p>
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
            <h1 className="text-3xl font-bold text-primary-text mb-2">Create Ledger Entry</h1>
            <p className="text-secondary-text">
              Create a new ledger entry for your document
            </p>
          </div>

          <div className="bg-surface rounded-xl shadow-md p-6 md:p-8">
            <form onSubmit={handleCreate} className="space-y-6">
              {/* Document Selection */}
              <div>
                <label htmlFor="document_id" className="block text-sm font-medium text-secondary-text mb-1">
                  Select Document
                </label>
                <select
                  id="document_id"
                  name="document_id"
                  value={formData.document_id}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
                >
                  <option value="" className="text-secondary-text bg-background">Select a document</option>
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id} className="text-primary-text bg-background">
                      {doc.doc_number} - {doc.doc_type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Selection */}
              <div>
                <label htmlFor="action" className="block text-sm font-medium text-secondary-text mb-1">
                  Action
                </label>
                <select
                  id="action"
                  name="action"
                  value={formData.action}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
                >
                  <option value="" className="text-secondary-text bg-background">Select an action</option>
                  {actionOptions.map(option => (
                    <option key={option} value={option} className="text-primary-text bg-background">
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metadata */}
              <div>
                <label htmlFor="metadata_json" className="block text-sm font-medium text-secondary-text mb-1">
                  Metadata (Optional)
                </label>
                <textarea
                  id="metadata_json"
                  name="metadata_json"
                  value={formData.metadata_json}
                  onChange={handleInputChange}
                  placeholder='Enter metadata as JSON (e.g., {"key": "value"})'
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text placeholder-secondary-text"
                />
                <p className="mt-1 text-sm text-secondary-text">
                  Optional additional data in JSON format
                </p>
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
                  disabled={submitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-background bg-accent hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Ledger Entry'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLedgerEntry;