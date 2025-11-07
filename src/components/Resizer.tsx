import React from 'react';

interface ResizerProps {
  onResize: (delta: number) => void;
}

const Resizer: React.FC<ResizerProps> = ({ onResize }) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    let prevX = e.clientX;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - prevX;
      onResize(delta);
      prevX = e.clientX;
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-1 bg-transparent hover:bg-blue-500 cursor-col-resize flex-shrink-0"
      style={{ transition: 'background-color 0.2s' }}
    />
  );
};

export default Resizer;