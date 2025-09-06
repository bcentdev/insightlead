import React from 'react';
import { Card, CardBody } from '@heroui/react';
import { LucideIcon } from 'lucide-react';
import { SectionHeader } from './section-header';

type WidgetContainerProps = {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly subtitle?: string;
  readonly children: React.ReactNode;
  readonly headerActions?: React.ReactNode;
  readonly isDraggable?: boolean;
  readonly isCustomizing?: boolean;
  readonly isFixed?: boolean;
  readonly dragHandleProps?: any;
  readonly className?: string;
};

export const WidgetContainer = ({
  icon,
  title,
  subtitle,
  children,
  headerActions,
  isDraggable = false,
  isCustomizing = false,
  isFixed = false,
  dragHandleProps,
  className = ""
}: WidgetContainerProps) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <SectionHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        isDraggable={isDraggable}
        isCustomizing={isCustomizing}
        isFixed={isFixed}
        dragHandleProps={dragHandleProps}
      >
        {headerActions}
      </SectionHeader>
      
      {children}
    </div>
  );
};