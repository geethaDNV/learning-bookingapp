import { Provider } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ItemCreatePage } from './features/items/pages/ItemCreatePage';
import { ItemDetailPage } from './features/items/pages/ItemDetailPage';
import { ItemEditPage } from './features/items/pages/ItemEditPage';
import { ItemListPage } from './features/items/pages/ItemListPage';
import { store } from './store/store';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/items" replace />} />
          <Route path="/items" element={<ItemListPage />} />
          <Route path="/items/new" element={<ItemCreatePage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/items/:id/edit" element={<ItemEditPage />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}