
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  PackageOpen, 
  ListChecks, 
  Settings 
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Productos',
    href: '/products',
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    title: 'Ventas',
    href: '/sales',
    icon: <ListChecks className="h-5 w-5" />,
  },
  {
    title: 'Inventario',
    href: '/inventory',
    icon: <PackageOpen className="h-5 w-5" />,
  },
  {
    title: 'Configuración',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-luneblue">LuneStock</h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                  location.pathname === item.href
                    ? "bg-luneblue-light text-white font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          LuneStock v1.0.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
