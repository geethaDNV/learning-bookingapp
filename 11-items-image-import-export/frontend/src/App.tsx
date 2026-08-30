/**
 * Main App Component
 * 
 * Sets up React Router and Redux Provider.
 * Defines all routes for the application.
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/index';
import { ItemListPage } from './features/items/pages/ItemListPage';
import { ItemCreatePage } from './features/items/pages/ItemCreatePage';
import { ItemEditPage } from './features/items/pages/ItemEditPage';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/items" element={<ItemListPage />} />
          <Route path="/items/create" element={<ItemCreatePage />} />
          <Route path="/items/:id/edit" element={<ItemEditPage />} />
          <Route path="/" element={<Navigate to="/items" replace />} />
          <Route path="*" element={<Navigate to="/items" replace />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
