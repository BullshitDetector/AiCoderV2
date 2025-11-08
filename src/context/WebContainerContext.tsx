// src/context/WebContainerContext.tsx
import React, { createContext, useContext } from 'react';
import { WebContainer } from '@webcontainer/api';

interface WebContainerContextType {
  container: WebContainer | null;
  ready: boolean;
  logs: string[];
  previewUrl: string;
}

const WebContainerContext = createContext<WebContainerContextType | undefined>(undefined);

export const useWebContainerContext = () => {
  const context = useContext(WebContainerContext);
  if (!context) {
    throw new Error('useWebContainerContext must be used within a WebContainerProvider');
  }
  return context;
};

export const WebContainerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [container, setContainer] = React.useState<WebContainer | null>(null);
  const [ready, setReady] = React.useState(false);
  const [logs, setLogs] = React.useState<string[]>(['Booting WebContainer...']);
  const [previewUrl, setPreviewUrl] = React.useState('');

  React.useEffect(() => {
    let unmounted = false;

    async function boot() {
      if (!window.WebContainer) {
        setLogs(l => [...l, 'WebContainer failed to load']);
        return;
      }

      const wc = await window.WebContainer.boot();
      if (unmounted) return;

      setContainer(wc);
      setLogs(l => [...l, 'WebContainer booted']);

      const template = document.querySelector('#initial-files')?.innerHTML || '';
      await wc.mount({
        'package.json': { file: { contents: JSON.stringify({
          name: 'aicoderv2', private: true, type: 'module',
          scripts: { dev: 'vite', build: 'vite build' },
          dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
          devDependencies: { '@vitejs/plugin-react': '^4.3.2', vite: '^5.4.8' }
        }, null, 2) }},
        'vite.config.ts': { file: { contents: `import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({ plugins: [react()] });` }},
        'index.html': { file: { contents: template }},
        'src': { directory: {} }
      });

      const install = await wc.spawn('npm', ['install']);
      install.output.pipeTo(new WritableStream({ write: d => setLogs(l => [...l, d]) }));
      await install.exit;

      const dev = await wc.spawn('npm', ['run', 'dev']);
      dev.output.pipeTo(new WritableStream({ write: d => setLogs(l => [...l, d]) }));

      wc.on('server-ready', (port, url) => {
        setPreviewUrl(url);
        setReady(true);
        setLogs(l => [...l, `Preview ready: ${url}`]);
        window.dispatchEvent(new CustomEvent('wc-ready', { detail: { url } }));
      });
    }

    boot();
    return () => { unmounted = true; };
  }, []);

  return (
    <WebContainerContext.Provider value={{ container, ready, logs, previewUrl }}>
      {children}
    </WebContainerContext.Provider>
  );
};