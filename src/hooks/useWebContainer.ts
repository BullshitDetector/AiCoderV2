// src/hooks/useWebContainer.ts
import { useState, useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';

export const useWebContainer = () => {
  const [wc, setWc] = useState<WebContainer | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let process: any = null;

    (async () => {
      try {
        console.log('Booting WebContainer...');
        const instance = await WebContainer.boot();

        console.log('Mounting sample project...');
        await instance.mount({
          'package.json': { file: { contents: JSON.stringify({
            name: 'demo',
            type: 'module',
            scripts: { dev: 'vite --port 3111' },
            dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
            devDependencies: { vite: '^5.4.1', '@vitejs/plugin-react': '^4.3.1' }
          }, null, 2) }},
          'vite.config.js': { file: { contents: `
            import { defineConfig } from 'vite'
            import react from '@vitejs/plugin-react'
            export default defineConfig({ plugins: [react()], server: { port: 3111 } })
          `}},
          'index.html': { file: { contents: `
            <!DOCTYPE html><html><body><div id="root"></div>
            <script type="module" src="/src/main.tsx"></script></body></html>
          `}},
          'src': { directory: {
            'main.tsx': { file: { contents: `
              import React from 'react'
              import ReactDOM from 'react-dom/client'
              ReactDOM.createRoot(document.getElementById('root')!).render(
                <h1 className="text-4xl text-blue-600 p-10">Hello WebContainer!</h1>
              )
            `}}
          }}
        });

        // READ FILES IMMEDIATELY
        const readFiles = async () => {
          const result: Record<string, string> = {};
          const walk = async (path: string) => {
            const entries = await instance.fs.readdir(path, { withFileTypes: true });
            for (const e of entries) {
              const full = path === '/' ? `/${e.name}` : `${path}/${e.name}`;
              if (e.isDirectory()) await walk(full);
              else result[full] = await instance.fs.readFile(full, 'utf-8');
            }
          };
          await walk('/');
          return result;
        };

        const allFiles = await readFiles();
        console.log('FILES LOADED:', Object.keys(allFiles));
        if (mounted) setFiles(allFiles);

        // npm install
        const install = await instance.spawn('npm', ['install']);
        await install.exit;

        // dev server
        process = await instance.spawn('npm', ['run', 'dev']);
        instance.on('server-ready', (_, url) => {
          console.log('Preview URL:', url);
          if (mounted) setUrl(url);
        });

        if (mounted) setWc(instance);
      } catch (err) {
        console.error('WebContainer failed:', err);
      }
    })();

    return () => {
      mounted = false;
      process?.kill();
    };
  }, []);

  return { wc, files, url };
};