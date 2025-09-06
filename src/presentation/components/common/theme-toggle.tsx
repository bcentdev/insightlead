import React from 'react';
import { Button, Tooltip } from '@heroui/react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/theme-context';

type ThemeToggleProps = {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly variant?: 'light' | 'solid' | 'bordered' | 'flat' | 'faded' | 'shadow' | 'ghost';
  readonly showLabel?: boolean;
  readonly className?: string;
};

export const ThemeToggle = ({ 
  size = 'md', 
  variant = 'ghost', 
  showLabel = false,
  className = "" 
}: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();

  const toggleButton = (
    <Button
      variant={variant}
      size={size}
      isIconOnly={!showLabel}
      onPress={toggleTheme}
      className={`transition-all duration-200 ${className}`}
      startContent={
        theme === 'light' ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )
      }
    >
      {showLabel && (theme === 'light' ? 'Dark Mode' : 'Light Mode')}
    </Button>
  );

  if (showLabel) {
    return toggleButton;
  }

  return (
    <Tooltip content={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
      {toggleButton}
    </Tooltip>
  );
};