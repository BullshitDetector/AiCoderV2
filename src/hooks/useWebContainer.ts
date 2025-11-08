// src/hooks/useWebContainer.ts
import { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';

declare global {
  interface Window {
    WebContainer?: typeof WebContainer;
  }
}

export function useWebContainer() {
  const [container, setContainer] = useState<WebContainer | null>(null);
  const [ready, setReady] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    let unmounted = false;

    async function boot() {
      if (!window.WebContainer) {
        setLogs(l => [...l, 'WebContainer script not loaded']);
        return;
      }

      const wc = await WebContainer.boot();
      if (unmounted) return;

      setContainer(wc);
      setLogs(l => [...l, 'WebContainer booted']);

      // Mount initial files
      const template = document.querySelector('#initial-files')?.innerHTML || '';
      await wc.mount({
        'package.json': {
          file: { contents: JSON.stringify({
            name: 'aicoderv2',
            private: true,
            type: 'module',
            scripts: { dev: 'vite', build: 'vite build' },
            dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
            devDependencies: {
              '@vitejs/plugin-react': '^4.3.2',
              vite: '^5.4.8',
              typescript: '^5.5.3'
            }
          }, null, 2) }
        },
        'vite.config.ts': {
          file: { contents: `import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({ plugins: [react()] });` }
        },
        'index.html': { file: { contents: template } },
        'src': { directory: {} }
      });

      // Install
      setLogs(l => [...l, 'npm install...']);
      const install = await wc.spawn('npm', ['install']);
      install.output.pipeTo(new WritableStream({ write: d => setLogs(l => [...l, d]) }));
      await install.exit;

      // Start dev server
      const dev = await wc.spawn('npm', ['run', 'dev']);
      dev.output.pipeTo(new WritableStream({ write: d => setLogs(l => [...l, d]) }));

      wc.on('server-ready', (port, url) => {
        setPreviewUrl(url);
        setReady(true);
        setLogs(l => [...l, `Preview: ${url}`]);
        window.dispatchEvent(new CustomEvent('webcontainer-ready', { detail: { url } }));
      });

      wc.fs.watch('/', { recursive: true }, () => {
        window.dispatchEvent(new CustomEvent('fs-change'));
      });
    }

    boot();

    return () => {
      unmounted = true;
    };
  }, []);

  return { container, ready, logs, previewUrl };
}