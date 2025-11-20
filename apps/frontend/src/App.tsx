import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Timeline } from './pages/Timeline';
import { DailyView } from './pages/DailyView';
import { OnThisDay } from './pages/OnThisDay';
import { Clock, Menu } from 'lucide-react';
import { useState } from 'react';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
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
                  Kalendarz
                </Link>
                <Link
                  to="/on-this-day"
                  className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-2"
                >
                  <Clock size={18} />
                  W tym dniu
                </Link>
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
                  Kalendarz
                </Link>
                <Link
                  to="/on-this-day"
                  className="block py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setMenuOpen(false)}
                >
                  W tym dniu
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Timeline />} />
          <Route path="/day/:date" element={<DailyView />} />
          <Route path="/on-this-day" element={<OnThisDay />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
