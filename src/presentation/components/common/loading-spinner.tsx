import React from 'react';
import { motion } from 'framer-motion';
import { Spinner } from '@heroui/react';

type LoadingSpinnerProps = {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly text?: string;
  readonly showText?: boolean;
  readonly className?: string;
  readonly variant?: 'default' | 'dots' | 'pulse' | 'bars';
};

const DotsSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const dotSize = size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4';
  
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${dotSize} bg-blue-600 rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  );
};

const PulseSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const circleSize = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16';
  
  return (
    <div className="relative">
      <motion.div
        className={`${circleSize} border-4 border-blue-200 dark:border-blue-800 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className={`absolute inset-0 ${circleSize} border-4 border-transparent border-t-blue-600 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

const BarsSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const barHeight = size === 'sm' ? 'h-4' : size === 'md' ? 'h-6' : 'h-8';
  const barWidth = size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : 'w-2';
  
  return (
    <div className="flex space-x-1 items-end">
      {[0, 1, 2, 3, 4].map((index) => (
        <motion.div
          key={index}
          className={`${barWidth} ${barHeight} bg-blue-600 rounded-sm`}
          animate={{
            scaleY: [1, 0.3, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.1
          }}
        />
      ))}
    </div>
  );
};

export const LoadingSpinner = ({
  size = 'md',
  text = 'Loading...',
  showText = true,
  className = "",
  variant = 'default'
}: LoadingSpinnerProps) => {
  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return <DotsSpinner size={size} />;
      case 'pulse':
        return <PulseSpinner size={size} />;
      case 'bars':
        return <BarsSpinner size={size} />;
      default:
        return <Spinner size={size} color="primary" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      {renderSpinner()}
      {showText && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-600 dark:text-gray-400 font-medium"
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );
};

// Skeleton loading component
export const SkeletonLoader = ({ 
  lines = 3, 
  className = "",
  animated = true 
}: {
  readonly lines?: number;
  readonly className?: string;
  readonly animated?: boolean;
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <motion.div
        key={index}
        className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
        animate={animated ? {
          opacity: [0.5, 1, 0.5]
        } : {}}
        transition={animated ? {
          duration: 1.5,
          repeat: Infinity,
          delay: index * 0.1
        } : {}}
      />
    ))}
  </div>
);

// Card skeleton
export const CardSkeleton = ({ className = "" }: { readonly className?: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
  >
    <div className="flex items-start justify-between mb-4">
      <motion.div
        className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.div
        className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      />
    </div>
    <SkeletonLoader lines={2} />
  </motion.div>
);