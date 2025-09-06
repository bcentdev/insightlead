import React from 'react';
import { Button, ButtonProps } from '@heroui/react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type EnhancedButtonProps = ButtonProps & {
  readonly loading?: boolean;
  readonly animation?: 'bounce' | 'pulse' | 'shake' | 'glow' | 'ripple';
  readonly success?: boolean;
  readonly error?: boolean;
};

const animations = {
  bounce: {
    whileTap: { scale: 0.95 },
    whileHover: { scale: 1.05 },
    transition: { type: "spring", stiffness: 400, damping: 17 }
  },
  pulse: {
    animate: { scale: [1, 1.05, 1] },
    transition: { duration: 2, repeat: Infinity }
  },
  shake: {
    animate: { x: [-5, 5, -5, 5, 0] },
    transition: { duration: 0.5 }
  },
  glow: {
    animate: { 
      boxShadow: [
        "0 0 0 0 rgba(59, 130, 246, 0.3)",
        "0 0 20px 5px rgba(59, 130, 246, 0.1)",
        "0 0 0 0 rgba(59, 130, 246, 0.3)"
      ]
    },
    transition: { duration: 2, repeat: Infinity }
  },
  ripple: {
    whileTap: { scale: 0.95 },
    whileHover: { scale: 1.02 }
  }
};

export const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(({
  children,
  loading = false,
  animation = 'bounce',
  success = false,
  error = false,
  disabled,
  startContent,
  className = "",
  color,
  ...props
}, ref) => {
  const getColor = () => {
    if (success) return 'success';
    if (error) return 'danger';
    return color || 'primary';
  };

  const getAnimationProps = () => {
    if (loading) return {};
    if (error) return animations.shake;
    return animations[animation] || animations.bounce;
  };

  const content = loading ? (
    <>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="mr-2"
      >
        <Loader2 className="w-4 h-4" />
      </motion.div>
      Loading...
    </>
  ) : (
    <>
      {startContent}
      {children}
    </>
  );

  return (
    <motion.div
      {...getAnimationProps()}
      className={className}
    >
      <Button
        ref={ref}
        color={getColor()}
        disabled={disabled || loading}
        startContent={!loading ? startContent : undefined}
        className={`relative overflow-hidden ${loading ? 'cursor-wait' : ''}`}
        {...props}
      >
        {content}
        
        {/* Success/Error overlay */}
        {(success || error) && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`absolute inset-0 flex items-center justify-center ${
              success ? 'bg-green-500' : 'bg-red-500'
            } bg-opacity-90 text-white`}
          >
            {success ? '✓' : '✕'}
          </motion.div>
        )}
      </Button>
    </motion.div>
  );
});

EnhancedButton.displayName = 'EnhancedButton';