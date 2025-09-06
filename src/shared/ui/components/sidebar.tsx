import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/react';
import { Users, Target, BarChart3, Settings, UsersRound, Github, Kanban, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { ThemeToggle } from './theme-toggle';

type SidebarProps = {
  readonly mobileOpen?: boolean;
  readonly setMobileOpen?: (open: boolean) => void;
};

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Update expanded state when mobile prop changes
  useEffect(() => {
    if (isMobile && mobileOpen !== undefined) {
      setIsExpanded(mobileOpen);
    }
  }, [mobileOpen, isMobile]);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsExpanded(false);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3 },
    { href: '/peers', label: 'Team Members', icon: Users },
    { href: '/objectives', label: 'Objectives', icon: Target },
    { href: '/github', label: 'GitHub', icon: Github },
    { href: '/jira', label: 'Jira', icon: Kanban },
    { href: '/teams', label: 'Teams', icon: UsersRound },
  ];

  const toggleSidebar = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    // Update mobile state if on mobile
    if (isMobile && setMobileOpen) {
      setMobileOpen(newExpanded);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => {
            setIsExpanded(false);
            setMobileOpen?.(false);
          }}
        />
      )}

      <div className={`relative bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 ${
        isMobile ? 'fixed left-0 top-0 h-full z-50' : 'relative'
      } ${
        isExpanded ? 'w-64' : 'w-16'
      } ${
        isMobile && !isExpanded ? '-translate-x-full' : 'translate-x-0'
      }`}>
        
        {/* Collapsed state indicator */}
        {!isExpanded && !isMobile && (
          <div className="absolute top-1/2 -right-1 w-2 h-8 bg-blue-600 rounded-r-full opacity-20"></div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {isExpanded ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                InsightLead
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full relative group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center cursor-pointer" onClick={toggleSidebar}>
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              
              {/* Logo tooltip for collapsed state */}
              {!isMobile && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-gray-800 text-white px-3 py-2 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-lg">
                  InsightLead
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
                </div>
              )}
            </div>
          )}
          
          {!isMobile && (
            <div className="flex items-center gap-2">
              {isExpanded && <ThemeToggle size="sm" />}
              <Button
                variant="light"
                isIconOnly
                onPress={toggleSidebar}
                className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 min-w-8 w-8 h-8"
              >
                {isExpanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </Button>
            </div>
          )}
        </div>

      {/* Navigation */}
      <nav className={`p-4 space-y-2 ${!isExpanded ? 'px-2' : ''}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <div key={item.href} className="relative group">
              <Link
                to={item.href}
                onClick={() => {
                  if (isMobile) {
                    setIsExpanded(false);
                    setMobileOpen?.(false);
                  }
                }}
                className={`flex items-center rounded-lg transition-all duration-200 ${
                  isExpanded 
                    ? 'gap-3 px-3 py-2' 
                    : 'justify-center px-2 py-3'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-700 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className={`flex-shrink-0 ${isExpanded ? 'w-5 h-5' : 'w-6 h-6'}`} />
                {isExpanded && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
              </Link>
              
              {/* Enhanced tooltip for collapsed state */}
              {!isExpanded && !isMobile && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-gray-800 text-white px-3 py-2 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-lg">
                  {item.label}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Settings at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 ${!isExpanded ? 'px-2' : ''}`}>
        <div className="relative group">
          <Link
            to="/settings"
            onClick={() => {
              if (isMobile) {
                setIsExpanded(false);
                setMobileOpen?.(false);
              }
            }}
            className={`flex items-center rounded-lg transition-all duration-200 ${
              isExpanded 
                ? 'gap-3 px-3 py-2' 
                : 'justify-center px-2 py-3'
            } ${
              location.pathname === '/settings'
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800'
            }`}
          >
            <Settings className={`flex-shrink-0 ${isExpanded ? 'w-5 h-5' : 'w-6 h-6'}`} />
            {isExpanded && (
              <span className="font-medium truncate">Settings</span>
            )}
          </Link>
          
          {/* Enhanced tooltip for collapsed state */}
          {!isExpanded && !isMobile && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 dark:bg-gray-800 text-white px-3 py-2 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-lg">
              Settings
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
            </div>
          )}
        </div>
        
        {/* Theme toggle for collapsed state */}
        {!isExpanded && !isMobile && (
          <div className="mt-2 flex justify-center">
            <ThemeToggle size="sm" />
          </div>
        )}
      </div>
    </div>
    </>
  );
}