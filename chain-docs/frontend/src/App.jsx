import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadDocument from './pages/UploadDocument';
import DocumentsList from './pages/DocumentsList';
import DocumentDetails from './pages/DocumentDetails';
import DocumentVerify from './pages/DocumentVerify';
import LedgerList from './pages/LedgerList';
import CreateLedgerEntry from './pages/CreateLedgerEntry';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute>
              <UploadDocument />
            </ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute>
              <DocumentsList />
            </ProtectedRoute>
          } />
          <Route path="/documents/:id" element={
            <ProtectedRoute>
              <DocumentDetails />
            </ProtectedRoute>
          } />
          <Route path="/verify" element={
            <ProtectedRoute>
              <DocumentVerify />
            </ProtectedRoute>
          } />
          <Route path="/ledger" element={
            <ProtectedRoute>
              <LedgerList />
            </ProtectedRoute>
          } />
          <Route path="/ledger/create" element={
            <ProtectedRoute>
              <CreateLedgerEntry />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;