
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="md:hidden">
          {/* Mobile logo, shown only on small screens */}
          <span className="text-xl font-bold text-luneblue">LuneStock</span>
        </div>
        
        <div className="ml-auto flex items-center space-x-2">
          <div className="hidden md:flex items-center space-x-1">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">
              {user?.username || 'Admin'}
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="text-gray-600"
          >
            <LogOut className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">Cerrar Sesión</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
