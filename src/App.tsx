import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ItemsList from './pages/ItemsList';
import ItemDetail from './pages/ItemDetail';
import AddItem from './pages/AddItem';
import Notifications from './pages/Notifications';
import InsuranceList from './pages/InsuranceList';
import InsuranceDetail from './pages/InsuranceDetail';
import InsuranceForm from './pages/InsuranceForm';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/items" element={<ItemsList />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/add" element={<AddItem />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/insurance" element={<InsuranceList />} />
            <Route path="/insurance/add" element={<InsuranceForm />} />
            <Route path="/insurance/:id" element={<InsuranceDetail />} />
            <Route path="/insurance/:id/edit" element={<InsuranceForm />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
