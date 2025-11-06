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
            scripts: {
              dev: 'vite --host 0.0.0.0 --port 3000',
              build: 'vite build',
            },
            dependencies: {
              react: '^18.3.1',
              'react-dom': '^18.3.1',
            },
            devDependencies: {
              vite: '^5.4.8',
              '@vitejs/plugin-react': '^4.3.2',
              typescript: '^5.5.4',
            },
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

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 3000, strictPort: true },
  preview: { host: '0.0.0.0', port: 3000, strictPort: true },
});
`,
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
              forceConsistentCasingInFileNames: true,
            },
          },
          null,
          2
        ),
      },
    },

    'index.html': {
      file: {
        contents: `<!DOCTYPE html>
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
</html>`,
      },
    },

    src: {
      directory: {
        'main.tsx': {
          file: {
            contents: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);`,
          },
        },

        'App.tsx': {
          file: {
            contents: `import Layout from './components/Layout';

export default function App() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">AiCoderV2 Ready!</h1>
          <p className="text-lg text-gray-600">WebContainer running on <strong>port 3000</strong>.</p>
        </div>
      </div>
    </Layout>
  );
}`,
          },
        },

        components: {
          directory: {
            'Layout.tsx': {
              file: {
                contents: `import React, { ReactNode } from 'react';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return <div className="min-h-screen">{children}</div>;
}`,
              },
            },
          },
        },
      },
    },
  });

  console.log('[WebContainer] npm install…');
  const install = await wc.spawn('npm', ['install']);
  const installExit = await install.exit;
  if (installExit !== 0) throw new Error(`npm install failed (code ${installExit})`);

  console.log('[WebContainer] Starting Vite on port 3000…');
  const dev = await wc.spawn('npm', ['run', 'dev']);

  dev.output.pipeTo(
    new WritableStream({
      write(chunk) {
        const text = new TextDecoder().decode(chunk);
        console.log('[Vite]', text);
      },
    })
  );

  wc.on('server-ready', (port, url) => {
    console.log(`[WebContainer] Server ready → ${url} (port ${port})`);
    window.postMessage({ type: 'serverReady', url, port }, '*');
  });

  return wc;
};

export function useWebContainer() {
  const [container, setContainer] = useState<WebContainer | null>(null);
  const [ready, setReady] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const serverStarted = useRef(false);

  useEffect(() => {
    let mounted = true;
    getWebContainer()
      .then((wc) => {
        if (!mounted) return;
        setContainer(wc);
        setReady(true);
      })
      .catch((e) => console.error('[WebContainer] boot error', e));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data.type === 'serverReady' && e.data.url) {
        setUrl(e.data.url);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const installDependencies = async () => {
    if (!container) return;
    const proc = await container.spawn('npm', ['install']);
    await proc.exit;
  };

  const startDevServer = async () => {
    if (!container || serverStarted.current) return;
    serverStarted.current = true;
    await container.spawn('npm', ['run', 'dev']);
  };

  return {
    container,
    ready,
    url,
    installDependencies,
    startDevServer,
  };
}