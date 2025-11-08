// src/hooks/useWebContainer.ts
import { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';

declare global {
  interface Window {
    WebContainer?: typeof WebContainer;
  }
}

interface UseWebContainerReturn {
  container: WebContainer | null;
  ready: boolean;
  error: string | null;
  logs: string[];
}

export function useWebContainer(): UseWebContainerReturn {
  const [container, setContainer] = useState<WebContainer | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const containerRef = useRef<WebContainer | null>(null);

  useEffect(() => {
    let unmounted = false;

    async function boot() {
      try {
        // 1. Wait for WebContainer to be available on window
        if (!window.WebContainer) {
          setError('WebContainer script not loaded');
          return;
        }

        const wc = await WebContainer.boot();
        if (unmounted) return;

        containerRef.current = wc;
        setContainer(wc);
        setLogs((l) => [...l, 'WebContainer booted']);

        // 2. Mount the current project files (optional – you can also write files manually)
        await wc.mount({
          // You can leave this empty or pre-populate with your starter files
          'package.json': {
            file: {
              contents: JSON.stringify(
                {
                  name: 'aicoderv2',
                  private: true,
                  type: 'module',
                  scripts: {
                    dev: 'vite',
                    build: 'vite build',
                    preview: 'vite preview',
                  },
                  dependencies: {
                    react: '^18.3.1',
                    'react-dom': '^18.3.1',
                  },
                  devDependencies: {
                    '@vitejs/plugin-react': '^4.3.2',
                    vite: '^5.4.8',
                    typescript: '^5.5.3',
                  },
                },
                null,
                2,
              ),
            },
          },
          'vite.config.ts': {
            file: {
              contents: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});`,
            },
          },
          'index.html': {
            file: { contents: document.querySelector('template#initial-files')?.innerHTML || '' },
          },
          // Add more starter files here if you want
        });

        // 3. Install dependencies
        setLogs((l) => [...l, 'Installing npm dependencies...']);
        const installProcess = await wc.spawn('npm', ['install']);
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              setLogs((l) => [...l, data]);
            },
          }),
        );
        const installExit = await installProcess.exit;
        if (installExit !== 0) throw new Error('npm install failed');

        setLogs((l) => [...l, 'Dependencies installed']);

        // 4. Start dev server
        const devProcess = await wc.spawn('npm', ['run', 'dev']);
        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              setLogs((l) => [...l, data]);
            },
          }),
        );

        // 5. Wait for the server to expose a URL
        wc.on('server-ready', (port, url) => {
          if (port === 5173) {
            setLogs((l) => [...l, `Preview ready at ${url}`]);
            setReady(true);
          }
        });

        // Optional: listen to file changes (correct API)
        wc.fs.watch('/', { recursive: true }, (event, filename) => {
          setLogs((l) => [...l, `File ${event}: ${filename}`]);
        });
      } catch (err: any) {
        if (!unmounted) {
          setError(err?.message || 'Failed to start WebContainer');
          console.error(err);
        }
      }
    }

    boot();

    return () => {
      unmounted = true;
      containerRef.current?.teardown?.();
    };
  }, []);

  return { container, ready, error, logs };
}