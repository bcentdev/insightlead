import { ReactNode, useState, useEffect } from 'react';
import { Button } from '@heroui/react';
import { Menu } from 'lucide-react';
import { Sidebar } from './sidebar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile/tablet breakpoints
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />
      
      {/* Mobile menu button - enhanced for tablets */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-30">
          <Button
            variant="light"
            isIconOnly
            onPress={() => setSidebarOpen(true)}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all duration-200"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      )}

      <main className="flex-1 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-950 dark:to-blue-950/20 overflow-auto transition-colors duration-200">
        <div className={`container mx-auto max-w-7xl pb-6 transition-all duration-300 ${
          isMobile ? 'pt-16 px-4' : 'pt-6 px-6'
        }`}>
          {/* Enhanced responsive container */}
          <div className="w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}