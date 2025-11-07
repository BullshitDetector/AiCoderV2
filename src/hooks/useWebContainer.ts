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

        // Wait for WebContainer to be fully ready
        await new Promise((resolve) => {
          instance.on('ready', resolve);
        });

        // Mount a complete sample React + TypeScript + Vite project
        await instance.mount({
          'package.json': {
            file: {
              contents: JSON.stringify(
                {
                  name: 'sample-react-app',
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
                    moduleResolution: 'node',
                    resolveJsonModule: true,
                    isolatedModules: true,
                    noEmit: true,
                  },
                  include: ['src'],
                },
                null,
                2
              ),
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
  <title>Sample React App</title>
  <link rel="stylesheet" href="/src/index.css" />
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
              'index.css': {
                file: {
                  contents: `
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
                  `.trim(),
                },
              },
              'main.tsx': {
                file: {
                  contents: `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
                  `.trim(),
                },
              },
              'App.tsx': {
                file: {
                  contents: `
import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Hero />
      <Features />
      <Footer />
    </div>
  );
};

export default App;
                  `.trim(),
                },
              },
              'components': {
                directory: {
                  'Header.tsx': {
                    file: {
                      contents: `
import React from 'react';
import { Menu } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">MyApp</h1>
            </div>
            <nav className="ml-10 flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">Home</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">Features</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">Pricing</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">Contact</a>
            </nav>
          </div>
          <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
                      `.trim(),
                    },
                  },
                  'Hero.tsx': {
                    file: {
                      contents: `
import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Build Amazing Apps
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Create beautiful, responsive web applications with React, TypeScript, and Tailwind CSS.
          </p>
          <div className="flex justify-center space-x-4">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              Get Started
            </button>
            <button className="border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
                      `.trim(),
                    },
                  },
                  'Features.tsx': {
                    file: {
                      contents: `
import React from 'react';
import { Zap, Shield, Rocket } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized performance with Vite and React Fast Refresh.',
  },
  {
    icon: Shield,
    title: 'Type Safe',
    description: 'Full TypeScript support with strict type checking.',
  },
  {
    icon: Rocket,
    title: 'Production Ready',
    description: 'Built with best practices and modern tooling.',
  },
];

const Features: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to build modern web applications.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <feature.icon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
                      `.trim(),
                    },
                  },
                  'Footer.tsx': {
                    file: {
                      contents: `
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-2xl font-bold">MyApp</h3>
            <p className="text-gray-400 mt-2">Building the future of web development.</p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-white">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-white">Terms</a>
            <a href="#" className="text-gray-400 hover:text-white">Contact</a>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; 2025 MyApp. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
                      `.trim(),
                    },
                  },
                },
              },
            },
          },
        });

        // Fetch initial files with delay to ensure mount completes
        setTimeout(async () => {
          if (!isMounted) return;
          const initialFiles = await getFiles(instance);
          setFiles(initialFiles);
        }, 500);

        // Install dependencies
        const installProcess = await instance.spawn('npm', ['install']);
        await installProcess.exit;

        // Start dev server
        const devProcess = await instance.spawn('npm', ['run', 'dev']);

        instance.on('server-ready', (port, serverUrl) => {
          if (isMounted) {
            console.log('Preview ready at:', serverUrl);
            setUrl(serverUrl);
          }
        });

        instance.on('error', (err) => console.error('WebContainer error:', err));

        // Listen for file changes
        instance.on('fs-change', async () => {
          if (isMounted) {
            const updatedFiles = await getFiles(instance);
            setFiles(updatedFiles);
          }
        });

        if (isMounted) setWc(instance);

        return () => {
          devProcess.kill();
          instance.teardown?.();
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

// Helper to get all files recursively
async function getFiles(wc: WebContainer): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  async function recurse(path: string) {
    try {
      const entries = await wc.fs.readdir(path, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`;
        if (entry.isDirectory()) {
          await recurse(fullPath);
        } else if (entry.isFile()) {
          const content = await wc.fs.readFile(fullPath, 'utf-8');
          files[fullPath] = content;
        }
      }
    } catch (err) {
      console.warn(`Failed to read directory ${path}:`, err);
    }
  }

  await recurse('/');
  return files;
}