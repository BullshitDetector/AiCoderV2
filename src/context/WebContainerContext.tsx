// src/context/WebContainerContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { WebContainer } from '@webcontainer/api';

interface ContextType {
  container: WebContainer | null;
  ready: boolean;
  logs: string[];
  previewUrl: string;
}

const Context = createContext<ContextType | undefined>(undefined);

export const useWebContainerContext = () => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useWebContainerContext must be used within provider');
  return ctx;
};

export const WebContainerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [container, setContainer] = useState<WebContainer | null>(null);
  const [ready, setReady] = useState(false);
  const [logs, setLogs] = useState<string[]>(['Booting WebContainer...']);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    let unmounted = false;

    async function boot() {
      // Wait for official script to expose WebContainer
      if (!('WebContainer' in window)) {
        setLogs(l => [...l, 'Waiting for webcontainer.js...']);
        return;
      }

      const wc = await (window as any).WebContainer.boot();
      if (unmounted) return;

      setContainer(wc);
      setLogs(l => [...l, 'WebContainer booted ✓']);

      // Mount initial files
      const tmpl = document.querySelector('#initial-files')?.innerHTML || '';
      await wc.mount({
        'package.json': { file: { contents: JSON.stringify({
          name: 'aicoderv2', private: true, type: 'module',
          scripts: { dev: 'vite', build: 'vite build' },
          dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
          devDependencies: { '@vitejs/plugin-react': '^4.3.2', vite: '^5.4.8' }
        }, null, 2) }},
        'vite.config.ts': { file: { contents: `import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({ plugins: [react()] });` }},
        'index.html': { file: { contents: tmpl }},
        'src': { directory: {} }
      });

      // Install + dev server
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
    <Context.Provider value={{ container, ready, logs, previewUrl }}>
      {children}
    </Context.Provider>
  );
};