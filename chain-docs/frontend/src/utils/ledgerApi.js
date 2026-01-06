import axiosInstance from './axiosInstance';

const ledgerApi = {
  // Get ledger entries with pagination and filters
  getLedgerEntries: (params = {}) => {
    return axiosInstance.get('/ledger', { params });
  },

  // Create a new ledger entry
  createLedgerEntry: (documentId, action, metadata_json = null) => {
    const payload = {
      document_id: documentId,
      action: action,
      metadata_json: metadata_json
    };
    return axiosInstance.post('/ledger', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Update a ledger entry (only action field)
  updateLedgerEntry: (entryId, action) => {
    return axiosInstance.patch(`/ledger/${entryId}`, { action });
  },

  // Delete a ledger entry
  deleteLedgerEntry: (entryId) => {
    return axiosInstance.delete(`/ledger/${entryId}`);
  },
};

export default ledgerApi;