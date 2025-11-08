import React, { useState, useRef, useEffect } from 'react';
import Menu from './Menu';
import FileTree from './FileTree';
import MonacoEditor from './MonacoEditor';
import Preview from './Preview';
import ChatInterface from './ChatInterface';
import DatabasePanel from './DatabasePanel';
import Resizer from './Resizer';
import { Home, ShoppingCart, Wrench, Info, Mail } from 'lucide-react';
import { useWebContainer } from '../hooks/useWebContainer';
import { WebContainerProvider } from '../context/WebContainerContext';

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

  const [chatWidth, setChatWidth] = useState(320);
  const [fileWidth, setFileWidth] = useState(256);
  const [editorWidth, setEditorWidth] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'code' | 'preview' | 'database'>('code');
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  const { wc, files, url } = useWebContainer();

  useEffect(() => {
    const updateWidths = () => {
      if (mainRef.current) {
        const totalMain = mainRef.current.clientWidth;
        setEditorWidth((totalMain - fileWidth) / 2);
      }
    };

    updateWidths();
    window.addEventListener('resize', updateWidths);
    return () => window.removeEventListener('resize', updateWidths);
  }, [fileWidth]);

  const contextValue = { wc, files, url, currentFile, setCurrentFile };

  return (
    <WebContainerProvider value={contextValue}>
      <div className="flex flex-col h-screen bg-gray-900 text-white font-sans antialiased">
        <header className="bg-gray-800 shadow-md">
          <Menu items={menuItems} userItems={userItems} mode={mode} onModeChange={setMode} />
        </header>
        <div className="flex flex-1 overflow-hidden">
          <ChatInterface className="bg-gray-800 border-r border-gray-700 overflow-y-auto p-4 rounded-tr-lg" style={{ width: `${chatWidth}px` }} />
          <Resizer onResize={(delta) => setChatWidth(Math.max(200, chatWidth + delta))} />
          <div ref={mainRef} className="flex flex-col flex-1">
            <div className="flex flex-1 overflow-hidden">
              {mode === 'code' && (
                <>
                  <FileTree className="bg-gray-800 border-r border-gray-700 overflow-y-auto p-4" style={{ width: `${fileWidth}px` }} />
                  <Resizer
                    onResize={(delta) => {
                      setFileWidth(Math.max(200, fileWidth + delta));
                      setEditorWidth(Math.max(200, editorWidth - delta));
                    }}
                  />
                  <MonacoEditor className="bg-gray-900 overflow-hidden" style={{ width: `${editorWidth}px` }} />
                  <Resizer onResize={(delta) => setEditorWidth(Math.max(200, editorWidth + delta))} />
                  <Preview className="flex-1 bg-gray-800 overflow-hidden border-l border-gray-700" />
                </>
              )}
              {mode === 'preview' && <Preview className="flex-1 bg-gray-800 overflow-hidden" />}
              {mode === 'database' && <DatabasePanel className="flex-1 bg-gray-800 overflow-hidden" />}
            </div>
            <footer className="bg-gray-800 h-32 border-t border-gray-700 p-4 overflow-y-auto">
              <div className="text-gray-400">Terminal (Stub - Integrate WebContainer console here)</div>
            </footer>
          </div>
        </div>
        {children}
      </div>
    </WebContainerProvider>
  );
};

export default Layout;