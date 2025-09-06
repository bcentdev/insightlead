import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Chip
} from '@heroui/react';
import { Users, Target, BarChart3, Settings, UsersRound, Github, Kanban, LogOut, User } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth/ui/hooks/use-auth';

export function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3 },
    { href: '/peers', label: 'Team Members', icon: Users },
    { href: '/objectives', label: 'Objectives', icon: Target },
    { href: '/github', label: 'GitHub', icon: Github },
    { href: '/jira', label: 'Jira', icon: Kanban },
    {  href: '/teams', label: 'Teams', icon: UsersRound },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
        
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <div className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <Avatar
                  size="sm"
                  src={user?.avatar}
                  name={user?.name}
                  className="w-8 h-8"
                  fallback={<User className="w-4 h-4" />}
                />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-600">{user?.email}</p>
                    <Chip 
                      size="sm" 
                      color={user?.subscriptionTier === 'enterprise' ? 'secondary' : user?.subscriptionTier === 'pro' ? 'primary' : 'default'}
                      variant="flat"
                      className="text-xs capitalize"
                    >
                      {user?.subscriptionTier}
                    </Chip>
                  </div>
                </div>
              </div>
            </DropdownTrigger>
            
            <DropdownMenu 
              aria-label="User menu"
              disabledKeys={[]}
            >
              <DropdownItem
                key="profile"
                startContent={<User className="w-4 h-4" />}
                description={user?.email}
              >
                {user?.name}
              </DropdownItem>
              
              <DropdownItem
                key="subscription"
                startContent={
                  <div className={`w-2 h-2 rounded-full ${
                    user?.subscriptionTier === 'enterprise' ? 'bg-purple-500' :
                    user?.subscriptionTier === 'pro' ? 'bg-blue-500' : 'bg-gray-500'
                  }`} />
                }
                description={`${user?.subscriptionTier === 'free' ? 'Upgrade for more features' : 'Active subscription'}`}
              >
                {user?.subscriptionTier?.charAt(0).toUpperCase() + user?.subscriptionTier?.slice(1)} Plan
              </DropdownItem>
              
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<LogOut className="w-4 h-4" />}
                onPress={handleLogout}
              >
                Sign Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </HeroNavbar>
  );
}