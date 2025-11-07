import { createContext, useContext, ReactNode } from 'react';
import { WebContainer } from '@webcontainer/api';

interface WebContainerContextType {
  wc: WebContainer | null;
  files: Record<string, string>;
  url: string | null;
  currentFile: string | null;
  setCurrentFile: (file: string | null) => void;
}

const WebContainerContext = createContext<WebContainerContextType | undefined>(undefined);

export const WebContainerProvider: React.FC<{
  children: ReactNode;
  value: WebContainerContextType;
}> = ({ children, value }) => {
  return <WebContainerContext.Provider value={value}>{children}</WebContainerContext.Provider>;
};

export const useWebContainerContext = () => {
  const context = useContext(WebContainerContext);
  if (context === undefined) {
    throw new Error('useWebContainerContext must be used within a WebContainerProvider');
  }
  return context;
};