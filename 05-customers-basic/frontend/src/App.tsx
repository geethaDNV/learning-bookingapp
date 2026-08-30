// Main App Component & Routing

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@store/store';
import { CustomerListPage } from '@pages/CustomerListPage';
import { CustomerDetailPage } from '@pages/CustomerDetailPage';
import { CustomerFormPage } from '@pages/CustomerFormPage';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100">
          <nav className="bg-white shadow">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <h1 className="text-xl font-bold text-gray-900">
                Customers Basic - Learning Module
              </h1>
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<Navigate to="/customers" replace />} />
            <Route path="/customers" element={<CustomerListPage />} />
            <Route path="/customers/create" element={<CustomerFormPage />} />
            <Route path="/customers/:publicId" element={<CustomerDetailPage />} />
            <Route path="/customers/:publicId/edit" element={<CustomerFormPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
