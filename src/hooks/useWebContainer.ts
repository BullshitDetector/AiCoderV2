// src/hooks/useWebContainer.ts
import { WebContainer } from '@webcontainer/api';
import { useEffect, useState, useRef } from 'react';

let _instance: WebContainer | null = null;
let _bootPromise: Promise<WebContainer> | null = null;

const getWebContainer = async (): Promise<WebContainer> => {
  if (_instance) return _instance;
  if (_bootPromise) return _bootPromise;

  _bootPromise = WebContainer.boot();
  const wc = await _bootPromise;
  _instance = wc;

  console.log('[WebContainer] Booting…');

  await wc.mount({
    'package.json': {
      file: {
        contents: JSON.stringify(
          {
            name: 'aicoderv2',
            private: true,
            type: 'module',
            scripts: { dev: 'vite --host 0.0.0.0 --port 3000', build: 'vite build' },
            dependencies: {
              react: '^18.3.1',
              'react-dom': '^18.3.1',
              '@vitejs/plugin-react': '^4.3.2',
            },
            devDependencies: { vite: '^5.4.8', typescript: '^5.5.4' },
          },
          null,
          2
        ),
      },
    },
    'vite.config.ts': {
      file: {
        contents: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { host: '0.0.0.0', port: 3000, strictPort: true } });`,
      },
    },
    'tsconfig.json': {
      file: {
        contents: JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              module: 'ESNext',
              moduleResolution: 'bundler',
              jsx: 'react-jsx',
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
            },
          },
          null,
          2
        ),
      },
    },
    'index.html': {
      file: {
        contents: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>AiCoderV2</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
      },
    },
    src: {
      directory: {
        'main.tsx': { file: { contents: `import React from 'react'; import ReactDOM from 'react-dom/client'; import App from './App'; ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);` } },
        'App.tsx': { file: { contents: `import React from 'react'; export default function App() { return <div className="p-8">AiCoderV2 Ready!</div>; }` } },
        components: { directory: { 'Layout.tsx': { file: { contents: `import React, { ReactNode } from 'react'; export default function Layout({ children }: { children: ReactNode }) { return <>{children}</>; }` } } } },
      },
    },
  });

  console.log('[WebContainer] Starting Vite…');
  const dev = await wc.spawn('npm', ['run', 'dev']);
  
  // SAFE OUTPUT PIPE (handles Uint8Array | ArrayBuffer | string)
  const decoder = new TextDecoder();
  let buffer = '';
  
  const safeWrite = (chunk: Uint8Array | ArrayBuffer) => {
    if (chunk instanceof ArrayBuffer) chunk = new Uint8Array(chunk);
    if (!(chunk instanceof Uint8Array)) return;
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    lines.forEach(line => console.log('[Vite]', line));
  };
  
  if (typeof WritableStream !== 'undefined') {
    try {
      dev.output.pipeTo(
        new WritableStream({
          write(chunk) {
            safeWrite(chunk);
          },
        })
      ).catch(() => {});
    } catch {
      // fallback below
    }
  }
  
  // Fallback reader for older browsers
  const reader = dev.output.getReader();
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        safeWrite(value);
      }
    } catch {}
  })();
  
  wc.on('server-ready', (port, url) => {
    console.log(`[WebContainer] Ready → ${url}`);
    window.postMessage({ type: 'serverReady', url, port }, '*');
  });
  
  return wc;