import React from 'react';
import Menu from './Menu';
import FileTree from './FileTree';
import MonacoEditor from './MonacoEditor';
import Preview from './Preview';
import ChatInterface from './ChatInterface';
import { Home, ShoppingCart, Wrench, Info, Mail } from 'lucide-react';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const menuItems: MenuItem[] = [
    { label: 'Home', href: '/', icon: Home },
    {
      label: 'Products',
      href: '/products',
      icon: ShoppingCart,
      children: [
        { label: 'Item1', href: '/products/item1' },
        { label: 'Item2', href: '/products/item2' },
      ],
    },
    {
      label: 'Services',
      href: '/services',
      icon: Wrench,
      children: [
        { label: 'Consult', href: '/services/consult' },
        { label: 'Support', href: '/services/support' },
      ],
    },
    { label: 'About', href: '/about', icon: Info },
    { label: 'Contact', href: '/contact', icon: Mail },
  ];

  const userItems: MenuItem[] = [
    { label: 'Profile', href: '/profile' },
    { label: 'Settings', href: '/settings' },
    { label: 'Logout', href: '/logout' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans antialiased">
      <header className="bg-gray-800 shadow-md">
        <Menu items={menuItems} userItems={userItems} />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <ChatInterface className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto p-4 rounded-tr-lg" />
        <div className="flex flex-col flex-1">
          <div className="flex flex-1 overflow-hidden">
            <FileTree className="w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto p-4" />
            <div className="flex flex-1">
              <MonacoEditor className="flex-1 bg-gray-900 overflow-hidden" />
              <Preview className="flex-1 bg-gray-800 overflow-hidden border-l border-gray-700" />
            </div>
          </div>
          <footer className="bg-gray-800 h-32 border-t border-gray-700 p-4 overflow-y-auto">
            {/* Terminal stub - to be implemented */}
            <div className="text-gray-400">Terminal (Stub - Integrate WebContainer console here)</div>
          </footer>
        </div>
      </div>
      {children}
    </div>
  );
};

export default Layout;