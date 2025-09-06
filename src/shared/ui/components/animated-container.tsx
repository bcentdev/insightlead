import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type AnimationType = 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'rotate';

type AnimatedContainerProps = {
  readonly children: React.ReactNode;
  readonly animation?: AnimationType;
  readonly duration?: number;
  readonly delay?: number;
  readonly className?: string;
  readonly show?: boolean;
  readonly staggerChildren?: number;
  readonly exitAnimation?: AnimationType;
};

const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 }
  },
  slideDown: {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 30 }
  },
  slideLeft: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 }
  },
  slideRight: {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 30 }
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  },
  rotate: {
    initial: { opacity: 0, rotate: -10, scale: 0.9 },
    animate: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 10, scale: 0.9 }
  }
};

export const AnimatedContainer = ({
  children,
  animation = 'fadeIn',
  duration = 0.3,
  delay = 0,
  className = "",
  show = true,
  staggerChildren,
  exitAnimation
}: AnimatedContainerProps) => {
  const variants = animationVariants[animation];
  const exitVariants = exitAnimation ? animationVariants[exitAnimation] : variants;

  const containerVariants = staggerChildren ? {
    initial: variants.initial,
    animate: {
      ...variants.animate,
      transition: {
        staggerChildren,
        delayChildren: delay
      }
    },
    exit: exitVariants.exit
  } : {
    initial: variants.initial,
    animate: variants.animate,
    exit: exitVariants.exit
  };

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={className}
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ 
            duration, 
            delay: staggerChildren ? 0 : delay,
            ease: "easeOut"
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Specialized animated components
export const FadeIn = ({ children, delay = 0, className = "" }: {
  readonly children: React.ReactNode;
  readonly delay?: number;
  readonly className?: string;
}) => (
  <AnimatedContainer animation="fadeIn" delay={delay} className={className}>
    {children}
  </AnimatedContainer>
);

export const SlideUp = ({ children, delay = 0, className = "" }: {
  readonly children: React.ReactNode;
  readonly delay?: number;
  readonly className?: string;
}) => (
  <AnimatedContainer animation="slideUp" delay={delay} className={className}>
    {children}
  </AnimatedContainer>
);

export const ScaleIn = ({ children, delay = 0, className = "" }: {
  readonly children: React.ReactNode;
  readonly delay?: number;
  readonly className?: string;
}) => (
  <AnimatedContainer animation="scale" delay={delay} className={className}>
    {children}
  </AnimatedContainer>
);

// Staggered animation for lists
export const StaggeredList = ({ children, staggerDelay = 0.1, className = "" }: {
  readonly children: React.ReactNode;
  readonly staggerDelay?: number;
  readonly className?: string;
}) => (
  <AnimatedContainer 
    animation="slideUp" 
    staggerChildren={staggerDelay} 
    className={className}
  >
    {React.Children.map(children, (child, index) => (
      <motion.div
        key={index}
        variants={animationVariants.slideUp}
      >
        {child}
      </motion.div>
    ))}
  </AnimatedContainer>
);