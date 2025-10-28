import React from 'react';

const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="22"></line>
    </svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor" >
        <rect x="6" y="6" width="12" height="12" rx="2"></rect>
    </svg>
);

interface LiveControlsProps {
  isLive: boolean;
  onToggleLive: () => void;
  isLoading: boolean;
}

const LiveControls: React.FC<LiveControlsProps> = ({ isLive, onToggleLive, isLoading }) => {
  return (
    <div className="fixed bottom-6 left-6 z-20">
        <button
            onClick={onToggleLive}
            disabled={isLoading && !isLive}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                isLive
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-400'
            } ${(isLoading && !isLive) ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isLive ? 'Stop live chat' : 'Start live chat'}
        >
            {isLive ? <StopIcon className="w-8 h-8 text-white" /> : <MicIcon className="w-8 h-8 text-white" />}
        </button>
    </div>
  );
};

export default LiveControls;