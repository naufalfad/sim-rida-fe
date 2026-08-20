import React from 'react';
import { cn } from '@/lib/utils/cn';
import { WorkflowStatus, STATUS_LABELS, STATUS_COLORS } from '@/constants/status';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: WorkflowStatus;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  className,
  status,
  showDot = true,
  ...props
}) => {
  const color = STATUS_COLORS[status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200',
  };
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors',
        color.bg,
        color.text,
        color.border,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full bg-current',
            // optional pulse effect for active stages
            (status === 'OPD_IMPLEMENTING' || status === 'SUBSTANTIVE_REVIEW' || status === 'ADMINISTRATIVE_REVIEW') && 'animate-pulse'
          )}
        />
      )}
      <span>{label}</span>
    </span>
  );
};
