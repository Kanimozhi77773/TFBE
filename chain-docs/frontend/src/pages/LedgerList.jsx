import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PageNavigation from '../components/PageNavigation';
import AuthContext from '../context/AuthContext';
import ledgerApi from '../utils/ledgerApi';
import Modal from '../components/Modal';

const LedgerList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10); // items per page
  
  // Filter state
  const [filters, setFilters] = useState({
    document_number: '',
    action: '',
    actor_name: '',
    issued_from: '',
    issued_to: '',
    created_from: '',
    created_to: ''
  });

  // Fetch ledger entries
  const fetchLedgerEntries = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        ...filters,
        limit: limit,
        offset: (currentPage - 1) * limit
      };
      
      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const response = await ledgerApi.getLedgerEntries(params);
      setLedgerEntries(response.data);
    } catch (err) {
      console.error('Error fetching ledger entries:', err);
      setError('Failed to fetch ledger entries');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters, page, or user changes
  useEffect(() => {
    fetchLedgerEntries();
  }, [currentPage, filters, user]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      document_number: '',
      action: '',
      actor_name: '',
      issued_from: '',
      issued_to: '',
      created_from: '',
      created_to: ''
    });
    setCurrentPage(1);
  };

  // Format date for display
  // State for modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [newAction, setNewAction] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState(null);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };



  // Handle edit action
  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setNewAction(entry.action);
    setShowEditModal(true);
  };

  // Handle delete action
  const handleDeleteClick = (entry) => {
    setDeletingEntry(entry);
    setShowDeleteModal(true);
  };

  // Update ledger entry
  const updateLedgerEntry = async () => {
    try {
      await ledgerApi.updateLedgerEntry(editingEntry.id, newAction);
      // Refresh the list after successful update
      fetchLedgerEntries();
      setShowEditModal(false);
      setEditingEntry(null);
      setNewAction('');
      alert('Ledger entry updated successfully!');
    } catch (error) {
      console.error('Error updating ledger entry:', error);
      alert('Failed to update ledger entry');
    }
  };

  // Delete ledger entry
  const deleteLedgerEntry = async () => {
    try {
      await ledgerApi.deleteLedgerEntry(deletingEntry.id);
      // Refresh the list after successful deletion
      fetchLedgerEntries();
      setShowDeleteModal(false);
      setDeletingEntry(null);
      alert('Ledger entry deleted successfully!');
    } catch (error) {
      console.error('Error deleting ledger entry:', error);
      alert('Failed to delete ledger entry');
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setShowEditModal(false);
    setEditingEntry(null);
    setNewAction('');
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingEntry(null);
  };



  // Action options for the dropdown
  const actionOptions = [
    'ISSUED', 'AMENDED', 'SHIPPED', 'RECEIVED', 'PAID', 'CANCELLED', 'VERIFIED'
  ];

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
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-text mb-2">Ledger Explorer</h1>
          <p className="text-secondary-text">
            {user?.role === 'admin' || user?.role === 'auditor' 
              ? 'View all ledger entries in the system' 
              : 'View your ledger entries'}
          </p>
          
          {/* Show Create Ledger Entry button for bank and corporate users only */}
          {(user?.role === 'bank' || user?.role === 'corporate') && (
            <button
              onClick={() => navigate('/ledger/create')}
              className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-background bg-accent hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            >
              Create Ledger Entry
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="document_number" className="block text-sm font-medium text-secondary-text mb-1">
                Document Number
              </label>
              <input
                type="text"
                id="document_number"
                name="document_number"
                value={filters.document_number}
                onChange={handleFilterChange}
                placeholder="Filter by document number"
                className="w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text placeholder-secondary-text"
              />
            </div>
            
            <div>
              <label htmlFor="action" className="block text-sm font-medium text-secondary-text mb-1">
                Action
              </label>
              <select
                id="action"
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
              >
                <option value="">All Actions</option>
                {actionOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="actor_name" className="block text-sm font-medium text-secondary-text mb-1">
                Actor Name
              </label>
              <input
                type="text"
                id="actor_name"
                name="actor_name"
                value={filters.actor_name}
                onChange={handleFilterChange}
                placeholder="Filter by actor name"
                className="w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text placeholder-secondary-text"
              />
            </div>
            
            <div>
              <label htmlFor="created_from" className="block text-sm font-medium text-secondary-text mb-1">
                Created From
              </label>
              <input
                type="datetime-local"
                id="created_from"
                name="created_from"
                value={filters.created_from}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
              />
            </div>
            
            <div>
              <label htmlFor="created_to" className="block text-sm font-medium text-secondary-text mb-1">
                Created To
              </label>
              <input
                type="datetime-local"
                id="created_to"
                name="created_to"
                value={filters.created_to}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
              />
            </div>
            
            <div>
              <label htmlFor="issued_from" className="block text-sm font-medium text-secondary-text mb-1">
                Issued From
              </label>
              <input
                type="datetime-local"
                id="issued_from"
                name="issued_from"
                value={filters.issued_from}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
              />
            </div>
            
            <div>
              <label htmlFor="issued_to" className="block text-sm font-medium text-secondary-text mb-1">
                Issued To
              </label>
              <input
                type="datetime-local"
                id="issued_to"
                name="issued_to"
                value={filters.issued_to}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 text-base border border-border-subtle focus:outline-none focus:ring-accent focus:border-accent sm:text-sm rounded-md bg-background text-primary-text"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-border-subtle text-sm font-medium text-secondary-text hover:text-primary-text hover:bg-[#1a2435] rounded-md"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-200 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
          </div>
        )}

        {/* Ledger entries table */}
        {!loading && !error && (
          <div className="bg-surface rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-subtle">
                <thead className="bg-[#1a2435]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Document Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Action
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Actor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Created At
                    </th>
                    {(user?.role === 'admin' || user?.role === 'auditor') && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border-subtle">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-secondary-text">
                        No ledger entries found
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#1a2435] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-text">
                          {entry.document_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            entry.action === 'ISSUED' ? 'bg-green-900/30 text-green-300' :
                            entry.action === 'AMENDED' ? 'bg-yellow-900/30 text-yellow-300' :
                            entry.action === 'SHIPPED' ? 'bg-blue-900/30 text-blue-300' :
                            entry.action === 'RECEIVED' ? 'bg-purple-900/30 text-purple-300' :
                            entry.action === 'PAID' ? 'bg-teal-900/30 text-teal-300' :
                            entry.action === 'CANCELLED' ? 'bg-red-900/30 text-red-300' :
                            'bg-gray-900/30 text-gray-300'
                          }`}>
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-text">
                          {entry.actor_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">
                          {formatDate(entry.created_at)}
                        </td>
                        {/* Action buttons for admin/auditor */}
                        {(user?.role === 'admin' || user?.role === 'auditor') && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => handleEdit(entry)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(entry)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {!loading && ledgerEntries.length > 0 && (
              <div className="bg-surface px-4 py-3 flex items-center justify-between border-t border-border-subtle">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-border-subtle text-sm font-medium rounded-md text-secondary-text bg-surface hover:bg-[#1a2435] disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-border-subtle text-sm font-medium rounded-md text-secondary-text bg-surface hover:bg-[#1a2435] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-secondary-text">
                      Showing <span className="font-medium text-primary-text">{(currentPage - 1) * limit + 1}</span> to{' '}
                      <span className="font-medium text-primary-text">
                        {Math.min(currentPage * limit, ledgerEntries.length + (currentPage - 1) * limit)}
                      </span> of{' '}
                      <span className="font-medium text-primary-text">??</span> entries
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border-subtle text-sm font-medium text-secondary-text bg-surface hover:bg-[#1a2435] disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-accent text-background border-accent'
                                : 'border-border-subtle text-secondary-text bg-surface hover:bg-[#1a2435]'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border-subtle text-sm font-medium text-secondary-text bg-surface hover:bg-[#1a2435] disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-primary-text">Edit Ledger Entry</h3>
              <button 
                onClick={cancelEdit}
                className="text-secondary-text hover:text-primary-text"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-text mb-1">
                Document Number
              </label>
              <p className="text-primary-text">{editingEntry?.document_number}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-text mb-1">
                Current Action
              </label>
              <p className="text-primary-text">{editingEntry?.action}</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-secondary-text mb-1">
                New Action
              </label>
              <select
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                className="w-full px-3 py-2 border border-border-subtle rounded-md bg-input text-primary-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                style={{ color: 'inherit', backgroundColor: 'inherit' }}
              >
                <option value="ISSUED">ISSUED</option>
                <option value="AMENDED">AMENDED</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="VERIFIED">VERIFIED</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-border-subtle rounded-md text-primary-text hover:bg-[#1a2435] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateLedgerEntry}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-background bg-accent hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-primary-text">Confirm Delete</h3>
              <button 
                onClick={cancelDelete}
                className="text-secondary-text hover:text-primary-text"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-secondary-text mb-4">
              Are you sure you want to delete the ledger entry for document <strong>{deletingEntry?.document_number}</strong>?
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 border border-border-subtle rounded-md text-primary-text hover:bg-[#1a2435] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteLedgerEntry}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-background bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerList;