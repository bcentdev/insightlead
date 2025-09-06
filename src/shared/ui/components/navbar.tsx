import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button
} from '@heroui/react';
import { Users, Target, BarChart3, Settings, UsersRound, Github, Kanban } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

export function Navbar() {
  const location = useLocation();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3 },
    { href: '/peers', label: 'Team Members', icon: Users },
    { href: '/objectives', label: 'Objectives', icon: Target },
    { href: '/github', label: 'GitHub', icon: Github },
    { href: '/jira', label: 'Jira', icon: Kanban },
    {  href: '/teams', label: 'Teams', icon: UsersRound },
  ];

  return (
    <HeroNavbar className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <NavbarBrand>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            InsightLead
          </span>
        </div>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <NavbarItem key={item.href} isActive={isActive}>
              <Link
                to={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            </NavbarItem>
          );
        })}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Button
            as={Link}
            to="/settings"
            variant="light"
            isIconOnly
            className="text-gray-600 hover:text-blue-600"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </NavbarItem>
      </NavbarContent>
    </HeroNavbar>
  );
}