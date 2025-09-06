import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

// Enhanced icon wrapper with animations and variants
type EnhancedIconProps = {
  readonly icon: LucideIcon;
  readonly size?: 'sm' | 'md' | 'lg' | 'xl';
  readonly variant?: 'default' | 'outlined' | 'filled' | 'gradient';
  readonly color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';
  readonly animation?: 'none' | 'pulse' | 'bounce' | 'spin' | 'wiggle';
  readonly className?: string;
  readonly onClick?: () => void;
};

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

const colorMap = {
  primary: 'text-blue-600 dark:text-blue-400',
  secondary: 'text-purple-600 dark:text-purple-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-orange-600 dark:text-orange-400',
  danger: 'text-red-600 dark:text-red-400',
  default: 'text-gray-600 dark:text-gray-400'
};

const variantStyles = {
  default: '',
  outlined: 'stroke-2',
  filled: 'fill-current',
  gradient: 'bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent'
};

const animations = {
  none: {},
  pulse: {
    animate: { scale: [1, 1.1, 1] },
    transition: { duration: 2, repeat: Infinity }
  },
  bounce: {
    animate: { y: [0, -5, 0] },
    transition: { duration: 1, repeat: Infinity }
  },
  spin: {
    animate: { rotate: 360 },
    transition: { duration: 2, repeat: Infinity, ease: "linear" }
  },
  wiggle: {
    animate: { rotate: [-5, 5, -5, 5, 0] },
    transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2 }
  }
};

export const EnhancedIcon = ({
  icon: Icon,
  size = 'md',
  variant = 'default',
  color = 'default',
  animation = 'none',
  className = '',
  onClick
}: EnhancedIconProps) => {
  const baseClasses = `${sizeMap[size]} ${colorMap[color]} ${variantStyles[variant]} ${className}`;
  
  const animationProps = animations[animation];
  
  return (
    <motion.div
      {...animationProps}
      className={onClick ? 'cursor-pointer' : ''}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.1 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
    >
      <Icon className={baseClasses} />
    </motion.div>
  );
};

// Predefined icon components for common use cases
export const StatusIcon = ({ 
  status,
  size = 'md'
}: {
  readonly status: 'success' | 'warning' | 'error' | 'info';
  readonly size?: 'sm' | 'md' | 'lg';
}) => {
  const statusConfig = {
    success: { icon: '✓', color: 'text-green-600 dark:text-green-400' },
    warning: { icon: '⚠', color: 'text-orange-600 dark:text-orange-400' },
    error: { icon: '✕', color: 'text-red-600 dark:text-red-400' },
    info: { icon: 'ℹ', color: 'text-blue-600 dark:text-blue-400' }
  };

  const config = statusConfig[status];
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${sizeMap[size]} ${config.color} flex items-center justify-center font-bold`}
    >
      {config.icon}
    </motion.div>
  );
};

// Icon with notification badge
export const NotificationIcon = ({
  icon: Icon,
  count,
  size = 'md',
  color = 'default'
}: {
  readonly icon: LucideIcon;
  readonly count?: number;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';
}) => {
  return (
    <div className="relative">
      <EnhancedIcon
        icon={Icon}
        size={size}
        color={color}
        animation={count && count > 0 ? 'pulse' : 'none'}
      />
      {count && count > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
        >
          {count > 99 ? '99+' : count}
        </motion.div>
      )}
    </div>
  );
};

// Animated loading icon
export const LoadingIcon = ({ size = 'md' }: { readonly size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizeMap[size]} border-2 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full`}
    />
  );
};

// Interactive icon button
export const IconButton = ({
  icon: Icon,
  size = 'md',
  variant = 'ghost',
  onClick,
  tooltip,
  disabled = false,
  className = ''
}: {
  readonly icon: LucideIcon;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly variant?: 'ghost' | 'filled' | 'outlined';
  readonly onClick?: () => void;
  readonly tooltip?: string;
  readonly disabled?: boolean;
  readonly className?: string;
}) => {
  const variantClasses = {
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    filled: 'bg-blue-500 hover:bg-blue-600 text-white',
    outlined: 'border-2 border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        p-2 rounded-lg transition-all duration-200 
        ${variantClasses[variant]} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      title={tooltip}
    >
      <Icon className={`${sizeMap[size]} ${disabled ? 'text-gray-400' : ''}`} />
    </motion.button>
  );
};