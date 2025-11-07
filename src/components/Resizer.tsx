import React, { useRef, useEffect } from 'react';

interface ResizerProps {
  onResize: (delta: number) => void;
  className?: string;
}

const Resizer: React.FC<ResizerProps> = ({ onResize, className }) => {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      onResize(delta);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      isDragging.current = true;
      startX.current = e.clientX;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    // Attach global listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResize]);

  return (
    <div
      className={`w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors ${className}`}
      onMouseDown={(e) => {
        e.preventDefault();
        startX.current = e.clientX;
        isDragging.current = true;
      }}
    />
  );
};

export default Resizer;