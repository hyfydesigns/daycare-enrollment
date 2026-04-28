import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null); // enrollment id pending confirm
  const [deleting, setDeleting]     = useState(null); // enrollment id currently being deleted

  useEffect(() => {
    api.get('/enrollments').then((r) => setEnrollments(r.data)).finally(() => setLoading(false));
  }, []);

  const startNew = () => navigate('/enrollment/new');

  const canEdit   = (status) => status === 'draft' || status === 'needs_correction';
  const canView   = (status) => ['submitted', 'printed', 'signed', 'approved'].includes(status);
  const canDelete = (status) => status === 'draft' || status === 'needs_correction';

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/enrollments/${id}`);
      setEnrollments(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete. Please try again.');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome, {user?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500">Manage your child's enrollment forms here.</p>
        </div>

        {/* Quick Action */}
        <div className="card bg-gradient-to-br from-primary-50 to-orange-50 border-primary-100 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-800 text-lg mb-1">Enroll a Child</h2>
              <p className="text-sm text-gray-500">Complete the Texas state daycare enrollment form (Form 2935) online.</p>
            </div>
            <button onClick={startNew} className="btn-primary w-full sm:w-auto whitespace-nowrap">
              + New Enrollment
            </button>
          </div>
        </div>

        {/* Enrollments List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Enrollments</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>
          ) : enrollments.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-semibold text-gray-700 mb-1">No enrollments yet</h3>
              <p className="text-sm text-gray-400 mb-4">Start a new enrollment to begin the process.</p>
              <button onClick={startNew} className="btn-primary mx-auto">
                Start Enrollment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((e) => (
                <div key={e.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-800">
                          {e.child_name || <span className="text-gray-400 italic">Child name not entered</span>}
                        </h3>
                        <StatusBadge status={e.status} />
                      </div>
                      <div className="text-xs text-gray-400 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>Created {fmt(e.created_at)}</span>
                        {e.submitted_at && <span>Submitted {fmt(e.submitted_at)}</span>}
                        <span>Updated {fmt(e.updated_at)}</span>
                      </div>
                      {e.status === 'needs_correction' && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                          ⚠️ The daycare has requested corrections. Please edit and resubmit.
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canEdit(e.status) && (
                        <Link to={`/enrollment/${e.id}/edit`} className="btn-primary text-sm py-2 px-4 flex-1 sm:flex-none text-center">
                          {e.status === 'needs_correction' ? 'Edit & Resubmit' : 'Continue'}
                        </Link>
                      )}
                      {canView(e.status) && (
                        <Link to={`/enrollment/${e.id}/review`} className="btn-secondary text-sm py-2 px-4 flex-1 sm:flex-none text-center">
                          View
                        </Link>
                      )}
                      {e.status === 'draft' && (
                        <Link to={`/enrollment/${e.id}/review`} className="btn-secondary text-sm py-2 px-4 flex-1 sm:flex-none text-center">
                          Preview
                        </Link>
                      )}
                      {canDelete(e.status) && (
                        confirmDelete === e.id ? (
                          <div className="flex items-center gap-2 flex-1 sm:flex-none">
                            <span className="text-xs text-red-600 font-medium">Delete this form?</span>
                            <button
                              onClick={() => handleDelete(e.id)}
                              disabled={deleting === e.id}
                              className="text-xs py-2 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors disabled:opacity-50"
                            >
                              {deleting === e.id ? 'Deleting…' : 'Yes, delete'}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(e.id)}
                            className="text-xs py-2 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-8 card bg-blue-50 border-blue-100">
          <h3 className="font-semibold text-blue-800 mb-2 text-sm">How the process works</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Fill out the enrollment form and submit it online</li>
            <li>Daycare staff will review your submission</li>
            <li>Staff will print the completed form</li>
            <li>You'll visit the daycare and physically sign the printed form</li>
            <li>Your enrollment will be marked as approved</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
