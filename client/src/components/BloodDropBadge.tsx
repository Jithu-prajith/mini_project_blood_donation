import React from 'react';
import { Droplet } from 'lucide-react';
import { BloodGroup } from '../types';

interface BloodDropBadgeProps {
  group: BloodGroup | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const BloodDropBadge: React.FC<BloodDropBadgeProps> = ({
  group,
  size = 'md',
  showIcon = true
}) => {
  const isUniversal = group === 'O-' || group === 'AB+';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3.5 py-1.5'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full border shadow-xs ${
        isUniversal
          ? 'bg-red-50 text-red-700 border-red-300 ring-1 ring-red-400/30'
          : 'bg-rose-50 text-rose-800 border-rose-200'
      } ${sizeClasses[size]}`}
    >
      {showIcon && <Droplet size={iconSizes[size]} className="fill-current text-red-600" />}
      <span>{group}</span>
    </span>
  );
};
