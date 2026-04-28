import React from 'react';
import { Link } from 'react-router-dom';
import { useOrg } from '../contexts/OrgContext';

function isRootDomain() {
  const appDomain = import.meta.env.VITE_APP_DOMAIN;
  if (!appDomain) return false;
  const hostname = window.location.hostname;
  return hostname === appDomain || hostname === `www.${appDomain}`;
}

export default function Footer() {
  const { org } = useOrg();
  const year = new Date().getFullYear();
  const isRoot = isRootDomain();

  return (
    <footer className="border-t border-gray-100 bg-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
        <span>
          © {year}{' '}
          {isRoot ? 'EnrollPack' : org.name}{' '}
          {!isRoot && <span className="text-gray-300">· Powered by EnrollPack</span>}
        </span>

        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <Link to="/terms"   className="hover:text-gray-600 transition-colors">Terms of Service</Link>
          <a href="mailto:hello@enrollpack.com" className="hover:text-gray-600 transition-colors">Contact</a>
          {isRoot && (
            <Link to="/admin" className="hover:text-gray-600 transition-colors">Admin</Link>
          )}
        </div>
      </div>
    </footer>
  );
}
