
import React from 'react';

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm p-4 border-b border-cyan-500/30 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto flex items-center justify-center space-x-3">
        <ShieldIcon className="w-8 h-8 text-cyan-400" />
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-200">
          Meeshareey
        </h1>
      </div>
    </header>
  );
};

export default Header;
