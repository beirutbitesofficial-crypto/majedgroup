import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { MG, t } from './lib/index.js';
import { useDb, ModalHost, ToastHost, PrintHost, Page, Empty, closeAllModals } from './components/ui.jsx';
import { Sidebar, BottomNav } from './components/Shell.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import Project from './pages/Project.jsx';
import Calculator from './pages/Calculator.jsx';
import Sketch from './pages/Sketch.jsx';
import Reports from './pages/Reports.jsx';
import Expenses from './pages/Expenses.jsx';
import { Customers, Customer } from './pages/Customers.jsx';
import { Suppliers, Supplier } from './pages/Suppliers.jsx';
import { Workers, Worker } from './pages/Workers.jsx';
import Accounting from './pages/Accounting.jsx';
import Users from './pages/Users.jsx';
import Settings from './pages/Settings.jsx';
import More from './pages/More.jsx';

MG.setLang(MG.lang);
MG.restoreSession();

/* Route guard: shows a friendly message when the role lacks the permission */
function Guard({ perm, children }) {
  if (perm && !MG.can(perm)) return <Page title={t('noAccess')}><Empty icon="shield" text={t('noAccessHint')} /></Page>;
  return children;
}

export default function App() {
  useDb();
  const loc = useLocation();
  useEffect(() => { closeAllModals(); window.scrollTo(0, 0); }, [loc.pathname]);

  if (!MG.user) return <><Auth /><ToastHost /></>;

  return <>
    <div className="app">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/project/:id/:tab?" element={<Project />} />
          <Route path="/calc/:section?" element={<Guard perm="view.prices"><Calculator /></Guard>} />
          <Route path="/sketch/:projectId?" element={<Sketch />} />
          <Route path="/customers" element={<Guard perm="customers"><Customers /></Guard>} />
          <Route path="/customer/:id" element={<Guard perm="customers"><Customer /></Guard>} />
          <Route path="/suppliers" element={<Guard perm="suppliers"><Suppliers /></Guard>} />
          <Route path="/supplier/:id" element={<Guard perm="suppliers"><Supplier /></Guard>} />
          <Route path="/workers" element={<Guard perm="workers"><Workers /></Guard>} />
          <Route path="/worker/:id" element={<Guard perm="workers"><Worker /></Guard>} />
          <Route path="/expenses" element={<Guard perm="expenses"><Expenses /></Guard>} />
          <Route path="/accounting/:tab?" element={<Guard perm="accounting"><Accounting /></Guard>} />
          <Route path="/reports" element={<Guard perm="reports"><Reports /></Guard>} />
          <Route path="/users" element={<Guard perm="users"><Users /></Guard>} />
          <Route path="/settings" element={<Guard perm="settings"><Settings /></Guard>} />
          <Route path="/more" element={<More />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
    <BottomNav />
    <ModalHost />
    <ToastHost />
    <PrintHost />
  </>;
}
