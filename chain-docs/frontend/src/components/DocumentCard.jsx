import React from 'react';
import { useNavigate } from 'react-router-dom';

const DocumentCard = ({ document }) => {
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

  const getFileIcon = (fileUrl) => {
    // Extract extension from file URL
    const extension = fileUrl?.split('.').pop()?.toLowerCase() || '';
    
    if (extension === 'pdf') {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      );
    } else if (['jpg', 'jpeg', 'png'].includes(extension)) {
      return (
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
    );
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-surface rounded-lg shadow-md overflow-hidden border border-border-subtle hover:shadow-lg transition-shadow">
      <div className="p-5">
        <div className="flex items-start space-x-4">
          {getFileIcon(document.file_url)}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-primary-text truncate">
              {getDocTypeLabel(document.doc_type)}
            </h3>
            <p className="text-sm text-secondary-text mt-1">
              #{document.doc_number}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-200 border border-blue-800/50">
                {getDocTypeLabel(document.doc_type)}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-200 border border-green-800/50">
                Issued: {formatDate(document.issued_at)}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-200 border border-purple-800/50">
                Created: {formatDate(document.created_at)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => navigate(`/documents/${document.id}`)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-background bg-accent hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;