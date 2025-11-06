// src/hooks/useWebContainer.ts
import { WebContainer } from '@webcontainer/api';
import { useEffect, useState } from 'react';

let _instance: WebContainer | null = null;
let _bootPromise: Promise<WebContainer> | null = null;

const getWebContainer = async (): Promise<WebContainer> => {
  if (_instance) return _instance;
  if (_bootPromise) return _bootPromise;

  _bootPromise = WebContainer.boot();
  _instance = await _bootPromise;

  await _instance.mount({
    'package.json': {
      file: { contents: JSON.stringify({
        name: 'aicoderv2',
        private: true,
        type: 'module',
        scripts: { dev: 'vite', build: 'vite build' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: {
          vite: '^5.4.8',
          '@vitejs/plugin-react': '^4.3.2',
          typescript: '^5.5.4',
        },
      }, null, 2) },
    },
    'vite.config.ts': {
      file: { contents: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 3000, strictPort: true },
  preview: { host: true, port: 3000, strictPort: true },
});` },
    },
    'tsconfig.json': {
      file: { contents: JSON.stringify({
        compilerOptions: {
          target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler',
          jsx: 'react-jsx', strict: true, esModuleInterop: true,
          skipLibCheck: true, forceConsistentCasingInFileNames: true,
        },
      }, null, 2) },
    },
    'index.html': {
      file: { contents: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AiCoderV2</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>` },
    },
    'src': {
      directory: {
        'main.tsx': { file: { contents: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);` } },
        'App.tsx': { file: { contents: `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">AiCoderV2 Ready!</h1>
        <p className="text-lg text-gray-600">WebContainer running on port 3000.</p>
      </div>
    </div>
  );
}` } },
      },
    },
  });

  const install = await _instance.spawn('npm', ['install']);
  await install.exit;

  const dev = await _instance.spawn('npm', ['run', 'dev', '--', '--host']);

  dev.output.pipeTo(new WritableStream({
    write(data) {
      const output = new TextDecoder().decode(data);
      const urlMatch = output.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        const url = urlMatch[1];
        window.postMessage({ type: 'serverReady', url }, '*');
      }
    },
  }));

  _instance.on('server-ready', (port, url) => {
    window.postMessage({ type: 'serverReady', url }, '*');
  });

  return _instance;
};

export function useWebContainer() {
  const [container, setContainer] = useState<WebContainer | null>(null);
  const [ready, setReady] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getWebContainer().then((wc) => {
      if (!mounted) return;
      setContainer(wc);
      setReady(true);
    }).catch(console.error);

    const handler = (e: MessageEvent) => {
      if (e.data.type === 'serverReady' && e.data.url) {
        setUrl(e.data.url);
      }
    };
    window.addEventListener('message', handler);
    return () => {
      window.removeEventListener('message', handler);
      mounted = false;
    };
  }, []);

  const installDependencies = async () => {
    if (!container) return;
    const proc = await container.spawn('npm', ['install']);
    await proc.exit;
  };

  const startDevServer = async () => {
    if (!container) return;
    await container.spawn('npm', ['run', 'dev', '--', '--host']);
  };

  return { container, ready, url, installDependencies, startDevServer };
}