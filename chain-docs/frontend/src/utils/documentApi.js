import axiosInstance from './axiosInstance';

const documentApi = {
  // Upload a document with metadata
  uploadDocument: async (file, docType, docNumber, issuedAt) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);
    formData.append('doc_number', docNumber);
    formData.append('issued_at', issuedAt);
    
    try {
      const response = await axiosInstance.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Get documents uploaded by the current user with optional filtering
  getMyDocuments: async (filters = {}) => {
    try {
      const params = {};
      
      // Add filters to params if they exist
      if (filters.docType) params.doc_type = filters.docType;
      if (filters.docNumber) params.doc_number = filters.docNumber;
      if (filters.issuedFrom) params.issued_from = filters.issuedFrom.toISOString();
      if (filters.issuedTo) params.issued_to = filters.issuedTo.toISOString();
      if (filters.createdFrom) params.created_from = filters.createdFrom.toISOString();
      if (filters.createdTo) params.created_to = filters.createdTo.toISOString();
      
      const response = await axiosInstance.get('/documents/my', { params });
      return response.data;
    } catch (error) {
      console.error('Get documents error:', error);
      throw error;
    }
  },

  // Get document by ID
  getDocumentById: async (id) => {
    try {
      const response = await axiosInstance.get(`/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get document error:', error);
      throw error;
    }
  },

  // Edit document metadata
  editDocument: async (id, docData) => {
    try {
      const response = await axiosInstance.patch(`/documents/${id}`, docData);
      return response.data;
    } catch (error) {
      console.error('Edit document error:', error);
      throw error;
    }
  },

  // Delete document by ID
  deleteDocument: async (id) => {
    try {
      const response = await axiosInstance.delete(`/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  },

  // Download document by ID
  downloadDocument: async (id) => {
    try {
      const response = await axiosInstance.get(`/documents/${id}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Download document error:', error);
      throw error;
    }
  },
};

export default documentApi;