import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = (val: string) => {
    switch (val.toUpperCase()) {
      case 'PENDING':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'VERIFIED':
      case 'PATIENT_VERIFIED':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'PARTIALLY_DISPENSED':
        return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30';
      case 'MEDICINE_VERIFIED':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'DISPENSED':
      case 'COMPLETED':
      case 'VERIFIED_GENUINE':
      case 'ACTIVE':
      case 'IN_STOCK':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'LOW_STOCK':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'OUT_OF_STOCK':
      case 'REJECTED':
      case 'SUSPICIOUS':
      case 'RECALLED':
      case 'QUARANTINED':
      case 'FLAGGED':
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'NEAR_EXPIRY':
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
      case 'INFO':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
      case 'EXPIRED':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/40 font-bold';
      case 'CANCELLED':
      default:
        return 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30';
    }
  };

  const formatText = (val: string) => {
    return val.replace(/_/g, ' ');
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${getBadgeStyle(
        status
      )} tracking-wide transition-colors`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {formatText(status)}
    </span>
  );
};
