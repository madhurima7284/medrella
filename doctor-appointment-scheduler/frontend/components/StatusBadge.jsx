import React from 'react';

export default function StatusBadge({ status, size = 'md' }) {
  const styles = {
    CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/10',
    COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/10',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/10',
  };

  const dots = {
    CONFIRMED: 'bg-emerald-500',
    APPROVED: 'bg-emerald-500',
    PENDING: 'bg-amber-500 animate-pulse',
    COMPLETED: 'bg-blue-500',
    CANCELLED: 'bg-slate-400',
    REJECTED: 'bg-rose-500',
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${styles[status] || 'bg-gray-100 text-gray-700'} ${pad}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status] || 'bg-gray-400'}`} />
      {status}
    </span>
  );
}
