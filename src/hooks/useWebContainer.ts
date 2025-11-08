import { useState, useEffect } from 'react';

export const useWebContainer = () => {
  const [wc, setWc] = useState<any>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        console.log('Booting WebContainer...');
        const WebContainer = (window as any).WebContainer; // Use global from CDN script
        if (!WebContainer) {
          throw new Error('WebContainer not available from CDN');
        }
        const instance = await WebContainer.boot();
        // Mount initial project files for a basic Vite + React setup
        await instance.mount({
          'package.json': {
            file: {
              contents: JSON.stringify(
                {
                  name: 'webcontainer-app',
                  type: 'module',
                  dependencies: {
                    react: '^18.3.1',
                    'react-dom': '^18.3.1',
                  },
                  devDependencies: {
                    '@types/react': '^18.3.3',
                    '@types/react-dom': '^18.3.0',
                    '@vitejs/plugin-react': '^4.3.1',
                    typescript: '^5.5.3',
                    vite: '^5.4.1',
                  },
                  scripts: {
                    dev: 'vite --port 3111',
                  },
                },
                null,
                2
              ),
            },
          },
          'vite.config.ts': {
            file: {
              contents: `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3111,
  },
});
              `.trim(),
            },
          },
          'index.html': {
            file: {
              contents: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WebContainer App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
              `.trim(),
            },
          },
          'src': {
            directory: {
              'main.tsx': {
                file: {
                  contents: `
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <h1>Hello from WebContainer!</h1>
  </React.StrictMode>
);
                  `.trim(),
                },
              },
            },
          },
          'tsconfig.json': {
            file: {
              contents: JSON.stringify(
                {
                  compilerOptions: {
                    target: 'ESNext',
                    lib: ['DOM', 'DOM.Iterable', 'ESNext'],
                    module: 'ESNext',
                    skipLibCheck: true,
                    esModule