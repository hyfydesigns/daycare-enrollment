import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { org } = useOrg();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const homeHref = !user ? '/' : user.role === 'admin' || user.role === 'superadmin' ? '/admin' : '/dashboard';

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to={homeHref} className="flex items-center gap-2 min-w-0">
          {org.logo_url ? (
            <img src={org.logo_url} alt={org.name} className="h-8 w-auto object-contain" />
          ) : (
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ background: org.primary_color }}
            >
              🏠
            </div>
          )}
          <span className="font-bold text-gray-800 text-lg hidden sm:block truncate">{org.name}</span>
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[160px]">
              {user.role === 'superadmin' ? '⭐ Platform Admin' : user.role === 'admin' ? '👩‍💼 Staff' : '👨‍👩‍👧'} {user.full_name}
            </span>
            <Link to="/help" className="text-sm text-gray-500 hover:text-gray-800 hidden sm:block">Help</Link>
            <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
