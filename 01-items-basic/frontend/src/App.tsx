import { Provider } from 'react-redux';
import { store } from './store/store';
import { ItemListPage } from './features/items/pages/ItemListPage';

export default function App() {
  return (
    <Provider store={store}>
      <ItemListPage />
    </Provider>
  );
}
