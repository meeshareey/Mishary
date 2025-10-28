
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex items-start gap-4 my-4 justify-start">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"/></svg>
        </div>
      <div className="max-w-xl p-4 rounded-xl shadow-lg bg-gray-700/60 rounded-bl-none flex items-center space-x-2">
        <div className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default Loader;
