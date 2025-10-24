import { Home, Users, CheckSquare, Gift, BarChart3, Settings, Menu, X, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

interface SidebarProps {
  activeSection: 'overview' | 'habits' | 'children' | 'rewards' | 'progress' | 'settings';
  onSectionChange: (section: 'overview' | 'habits' | 'children' | 'rewards' | 'progress' | 'settings') => void;
  user?: User;
}

const menuItems = [
  {
    id: 'overview' as const,
    label: 'Overview',
    icon: Home,
    description: 'Dashboard home'
  },
  {
    id: 'children' as const,
    label: 'Children',
    icon: Users,
    description: 'Manage heroes'
  },
  {
    id: 'habits' as const,
    label: 'Habits',
    icon: CheckSquare,
    description: 'Habit management'
  },
  {
    id: 'rewards' as const,
    label: 'Rewards',
    icon: Gift,
    description: 'Reward settings'
  },
  {
    id: 'progress' as const,
    label: 'Progress',
    icon: BarChart3,
    description: 'Reports & analytics'
  },
  {
    id: 'settings' as const,
    label: 'Settings',
    icon: Settings,
    description: 'Settings & controls'
  }
];

export default function ParentDashboardSidebar({ activeSection, onSectionChange, user }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleMenuItemClick = (section: typeof activeSection) => {
    onSectionChange(section);
    setIsMobileMenuOpen(false); // Close mobile menu after selection
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        data-testid="button-mobile-menu-toggle"
      >
        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar Container */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 shadow-sm
          transition-transform duration-300 ease-in-out z-40
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-70 flex flex-col
        `}
        data-testid="sidebar-parent-dashboard"
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-coral to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-fredoka text-xl">🦸</span>
            </div>
            <div>
              <h2 className="font-fredoka text-xl text-gray-800">Habit Heroes</h2>
              <p className="text-xs text-gray-500">Parent Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-coral text-white shadow-md' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  data-testid={`sidebar-item-${item.id}`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${isActive ? 'text-white' : 'text-gray-800'}`}>
                      {item.label}
                    </div>
                    <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-coral flex items-center justify-center text-white font-bold text-lg">
              {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 truncate">
                {user?.firstName || user?.email || 'Parent'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {user?.email}
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center text-gray-700 hover:text-coral hover:border-coral"
            onClick={handleLogout}
            data-testid="button-sidebar-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          data-testid="overlay-mobile-menu"
        />
      )}
    </>
  );
}
