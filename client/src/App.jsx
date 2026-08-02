import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Profile from './pages/Profile';

function Splash() {
  return (
    <div className="splash-page">
      <div className="splash-card" aria-busy="true">
        <div className="skeleton skeleton-line" style={{ width: '40%', height: '1.25rem', marginBottom: '1.25rem' }} />
        <div className="skeleton skeleton-line" style={{ width: '100%', height: '2.75rem', marginBottom: '0.75rem' }} />
        <div className="skeleton skeleton-line" style={{ width: '100%', height: '2.75rem' }} />
      </div>
    </div>
  );
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/perfil" element={<Protected><Profile /></Protected>} />
      <Route path="/" element={<Protected><Chat /></Protected>} />
      <Route path="/c/:conversationId" element={<Protected><Chat /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
