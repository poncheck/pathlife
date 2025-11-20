import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';
import { Timeline } from './pages/Timeline';
import { DailyView } from './pages/DailyView';
import { OnThisDay } from './pages/OnThisDay';
import { Clock, Menu, Settings as SettingsIcon, LogOut, User } from 'lucide-react';
import { useState } from 'react';

function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();

  // Don't show navigation on login page
  if (location.pathname === '/login') {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            PathLife
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Calendar
            </Link>
            <Link
              to="/on-this-day"
              className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-2"
            >
              <Clock size={18} />
              On This Day
            </Link>
            <Link
              to="/settings"
              className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-2"
            >
              <SettingsIcon size={18} />
              Settings
            </Link>

            {/* User menu */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-300">
              <div className="flex items-center gap-2 text-gray-700">
                <User size={18} />
                <span className="text-sm">{user?.username}</span>
              </div>
              <button
                onClick={logout}
                className="text-gray-700 hover:text-red-600 transition-colors flex items-center gap-2"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link
              to="/"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setMenuOpen(false)}
            >
              Calendar
            </Link>
            <Link
              to="/on-this-day"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setMenuOpen(false)}
            >
              On This Day
            </Link>
            <Link
              to="/settings"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>
            <button
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className="block w-full text-left py-2 text-red-600 hover:text-red-700"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Routes */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Timeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/day/:date"
          element={
            <ProtectedRoute>
              <DailyView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/on-this-day"
          element={
            <ProtectedRoute>
              <OnThisDay />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
