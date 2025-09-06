import React from 'react';
import { LucideIcon } from 'lucide-react';
import { GripVertical } from 'lucide-react';

type SectionHeaderProps = {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly subtitle?: string;
  readonly isDraggable?: boolean;
  readonly isCustomizing?: boolean;
  readonly isFixed?: boolean;
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly dragHandleProps?: any;
};

export const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
  isDraggable = false,
  isCustomizing = false,
  isFixed = false,
  children,
  className = "",
  dragHandleProps
}: SectionHeaderProps) => {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {/* Section Icon */}
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        
        {/* Title and Subtitle */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            
            {/* Drag Handle - appears next to title when customizing */}
            {isDraggable && isCustomizing && !isFixed && (
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Drag to reorder"
              >
                <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
              </div>
            )}
            
            {/* Fixed indicator */}
            {isFixed && isCustomizing && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                Fixed
              </span>
            )}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {/* Action buttons or controls */}
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
};