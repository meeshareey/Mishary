import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string, files: File[]) => void;
  isLoading: boolean;
  isLive?: boolean;
  onToggleLive?: () => void;
}

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const AttachmentIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

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


const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, isLive, onToggleLive }) => {
  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Create object URLs for previews
    const newPreviewUrls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviewUrls);

    // Cleanup object URLs on component unmount or when files change
    return () => {
      newPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prevFiles => [...prevFiles, ...Array.from(e.target.files!)]);
    }
  };
  
  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    // Also need to clear the file input value so the same file can be re-added
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || selectedFiles.length > 0) && !isLoading) {
      onSendMessage(input.trim(), selectedFiles);
      setInput('');
      setSelectedFiles([]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pb-4 pt-2">
        {previewUrls.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
                {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                        <img src={url} alt={`preview ${index}`} className="h-16 w-16 object-cover rounded-md" />
                        <button onClick={() => handleRemoveFile(index)} className="absolute -top-1 -right-1 bg-gray-800 rounded-full p-0.5 text-white hover:bg-gray-700">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              type="file"
              multiple
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="bg-gray-700 text-gray-300 rounded-lg p-3 hover:bg-gray-600 disabled:opacity-50 transition-colors duration-300"
                aria-label="Attach file"
            >
                <AttachmentIcon className="w-6 h-6" />
            </button>
            {onToggleLive && (
              <button
                type="button"
                onClick={onToggleLive}
                disabled={isLoading && !isLive}
                className={`p-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    isLive
                    ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300 focus:ring-cyan-400'
                } ${(isLoading && !isLive) ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={isLive ? 'Stop live chat' : 'Start live chat'}
              >
                  {isLive ? <StopIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
              </button>
            )}
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLive ? "Live chat is in progress..." : "Ask about any cyber threat..."}
                disabled={isLoading}
                className="flex-grow bg-gray-800 border border-gray-600 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300 disabled:opacity-50"
            />
            <button
                type="submit"
                disabled={isLoading}
                className="bg-cyan-500 text-white rounded-lg p-3 hover:bg-cyan-600 disabled:bg-cyan-700 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
                <SendIcon className="w-6 h-6" />
            </button>
        </form>
    </div>
  );
};

export default ChatInput;