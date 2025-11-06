// src/hooks/useWebContainer.ts
import { WebContainer } from '@webcontainer/api';

// === Reactive State (Plain Event Emitter) ===
interface WebContainerState {
  instance: WebContainer | null;
  ready: boolean;
  url: string | null;
  processes: { [key: string]: any };
}

const initialState: WebContainerState = {
  instance: null,
  ready: false,
  url: null,
  processes: {},
};

const listeners: Array<(state: WebContainerState) => void> = [];
let currentState = { ...initialState };

function updateState(partial: Partial<WebContainerState>) {
  currentState = { ...currentState, ...partial };
  listeners.forEach((cb) => cb(currentState));
}

export const webContainerState = {
  subscribe: (cb: (state: WebContainerState) => void) => {
    cb(currentState);
    listeners.push(cb);
    return () => {
      const idx = listeners.indexOf(cb);
      if (idx > -1) listeners.splice(idx, 1);
    };
  },
  update: updateState,
};

// === Singleton Boot ===
let bootPromise: Promise<WebContainer> | null = null;

export async function bootWebContainer(): Promise<WebContainer> {
  if (bootPromise) return bootPromise;

  bootPromise = (async () => {
    const instance = await WebContainer.boot();

    await instance.mount({
      'package.json': {
        file: {
          contents: JSON.stringify(
            {
              name: 'aicodev',
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
  server: { port: 3000 },
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
</html>
`,
        },
      },
      'src': {
        directory: {
          'main.tsx': {
            file: {
              contents: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
            },
          },
          'App.tsx': {
            file: {
              contents: `import React from 'react';

export default function App() {
  return (
    <div className="p-8 font-sans">
      <h1 className="text-3xl font-bold text-blue-600">AiCoderV2 Ready!</h1>
      <p className="mt-4 text-gray-600">Start building with AI.</p>
    </div>
  );
}
`,
            },
          },
        },
      },
    });

    const installProcess = await instance.spawn('npm', ['install']);
    await installProcess.exit;

    const devProcess = await instance.spawn('npm', ['run', 'dev', '--', '--host']);

    instance.on('server-ready', (port: number, url: string) => {
      updateState({
        ready: true,
        url,
        processes: { ...currentState.processes, dev: devProcess },
      });
    });

    updateState({ instance });

    return instance;
  })();

  return bootPromise;
}

// === Public Singleton ===
export const webContainer = bootWebContainer();

// === React Hook ===
import React from 'react';

export function useWebContainer() {
  const [state, setState] = React.useState<WebContainerState>(currentState);

  React.useEffect(() => {
    const unsubscribe = webContainerState.subscribe(setState);
    bootWebContainer().catch(console.error);
    return unsubscribe;
  }, []);

  return state;
}