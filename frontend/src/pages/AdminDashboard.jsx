import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'printed', label: 'Printed' },
  { value: 'signed', label: 'Signed' },
  { value: 'approved', label: 'Approved' },
  { value: 'needs_correction', label: 'Needs Correction' },
  { value: 'draft', label: 'Draft' },
];

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('updated_at');
  const [order, setOrder] = useState('desc');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/enrollments', { params: { search, status: statusFilter, sort, order } }),
      api.get('/admin/stats'),
    ]).then(([e, s]) => {
      setEnrollments(e.data);
      setStats(s.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusFilter, sort, order]);

  const statCards = [
    { label: 'Total', value: stats.total, color: 'bg-gray-100 text-gray-700' },
    { label: 'Submitted', value: stats.submitted, color: 'bg-blue-100 text-blue-700' },
    { label: 'Printed', value: stats.printed, color: 'bg-purple-100 text-purple-700' },
    { label: 'Signed', value: stats.signed, color: 'bg-teal-100 text-teal-700' },
    { label: 'Approved', value: stats.approved, color: 'bg-green-100 text-green-700' },
    { label: 'Needs Correction', value: stats.needs_correction, color: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Enrollment Dashboard</h1>
            <p className="text-gray-500 text-sm">Review and manage all parent submissions.</p>
          </div>
          <button onClick={() => navigate('/admin/settings')} className="btn-secondary text-sm py-2 px-4">
            ⚙️ Settings
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className={`rounded-2xl px-3 py-4 text-center ${s.color}`}>
              <div className="text-2xl font-bold">{s.value ?? 0}</div>
              <div className="text-xs font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                className="form-input"
                placeholder="Search by child name, parent name, or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="form-input sm:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select className="form-input sm:w-48" value={`${sort}_${order}`} onChange={(e) => {
              const [s, o] = e.target.value.split('_');
              setSort(s); setOrder(o);
            }}>
              <option value="updated_at_desc">Last Updated ↓</option>
              <option value="updated_at_asc">Last Updated ↑</option>
              <option value="submitted_at_desc">Submitted ↓</option>
              <option value="child_name_asc">Child Name A–Z</option>
              <option value="child_name_desc">Child Name Z–A</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : enrollments.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500">No enrollments found.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Child</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Parent</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Submitted</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Updated</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {enrollments.map((e) => (
                    <tr key={e.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">
                          {e.child_name || <span className="text-gray-400 italic">Not entered</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700">{e.parent_name}</div>
                        <div className="text-xs text-gray-400">{e.parent_email}</div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                      <td className="px-4 py-3 text-gray-500">{fmt(e.submitted_at)}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt(e.updated_at)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/enrollment/${e.id}`} className="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap">
                          Review →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
