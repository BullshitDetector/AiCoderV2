// src/components/Preview.tsx
import { useWebContainer } from '../hooks/useWebContainer';

export const Preview = () => {
  const { url, ready } = useWebContainer();

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <p className="text-gray-600">Booting WebContainer…</p>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <p className="text-gray-600">Waiting for server…</p>
      </div>
    );
  }

  return (
    <iframe
      src={url}
      className="h-full w-full border-0"
      title="Live Preview"
      sandbox="allow-scripts allow-same-origin allow-modals"
    />
  );
};