import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { InvoiceListPage } from "./pages/InvoiceListPage.js";
import { InvoiceFormPage } from "./pages/InvoiceFormPage.js";
import { InvoiceDetailPage } from "./pages/InvoiceDetailPage.js";

/**
 * App: Main application component with routing
 */
export function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/invoices" element={<InvoiceListPage />} />
          <Route path="/invoices/create" element={<InvoiceFormPage />} />
          <Route path="/invoices/:publicId" element={<InvoiceDetailPage />} />
          <Route path="/invoices/:publicId/edit" element={<InvoiceFormPage />} />
          <Route path="/" element={<Navigate to="/invoices" replace />} />
        </Routes>
      </div>
    </Router>
  );
}
