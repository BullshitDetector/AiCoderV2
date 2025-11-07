import { useState, useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';

export const useWebContainer = () => {
  const [wc, setWc] = useState<WebContainer | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
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
                    esModuleInterop: true,
                    jsx: 'react-jsx',
                    strict: true,
                  },
                },
                null,
                2
              ),
            },
          },
        });

        // Fetch and set initial files
        const initialFiles = await getFiles(instance);
        if (isMounted) setFiles(initialFiles);

        // Install dependencies
        const installProcess = await instance.spawn('npm', ['install']);
        await installProcess.exit;

        // Start dev server
        const devProcess = await instance.spawn('npm', ['run', 'dev']);

        instance.on('server-ready', (port, serverUrl) => {
          if (isMounted) setUrl(serverUrl);
        });

        instance.on('error', (err) => console.error('WebContainer error:', err));

        // Listen for file system changes and update files state
        instance.on('fs-change', async (changedPath) => {
          if (isMounted) {
            const updatedFiles = await getFiles(instance);
            setFiles(updatedFiles);
          }
        });

        if (isMounted) setWc(instance);

        return () => {
          devProcess.kill();
          instance.destroy();
        };
      } catch (error) {
        console.error('Failed to boot WebContainer:', error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return { wc, files, url };
};

// Helper to recursively fetch all files and contents
async function getFiles(wc: WebContainer): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  async function recurse(path: string) {
    const entries = await wc.fs.readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = `${path}/${entry.name}`.replace(/^\/\//, '/');
      if (entry.isDirectory()) {
        await recurse(fullPath);
      } else if (entry.isFile()) {
        const content = await wc.fs.readFile(fullPath, 'utf-8');
        files[fullPath] = content;
      }
    }
  }

  await recurse('/');
  return files;
}