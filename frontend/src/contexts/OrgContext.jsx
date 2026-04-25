import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const OrgContext = createContext(null);

const DEFAULTS = {
  name: 'Little Stars Daycare',
  slug: 'default',
  logo_url: null,
  primary_color: '#f97316',
  accent_color: '#1f2937',
  tagline: null,
  plan: 'trial',
};

function applyBranding(org) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', org.primary_color || DEFAULTS.primary_color);
  root.style.setProperty('--color-accent',  org.accent_color  || DEFAULTS.accent_color);
  if (org.name) document.title = `${org.name} — Enrollment`;
}

function getOrgSlug() {
  const appDomain = import.meta.env.VITE_APP_DOMAIN; // e.g. "myapp.com"
  const hostname = window.location.hostname;
  if (appDomain && hostname.endsWith('.' + appDomain)) {
    const prefix = hostname.slice(0, hostname.length - appDomain.length - 1);
    if (prefix && !prefix.includes('.')) return prefix;
  }
  return 'default';
}

export function OrgProvider({ children }) {
  const [org, setOrg] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slug = getOrgSlug();
    axios.get('/api/org', { headers: { 'X-Org-Slug': slug } })
      .then(r => {
        const data = { ...DEFAULTS, ...r.data };
        setOrg(data);
        applyBranding(data);
      })
      .catch(() => {
        // Org not found or server error — apply defaults silently
        applyBranding(DEFAULTS);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <OrgContext.Provider value={{ org, setOrg, loading }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}
