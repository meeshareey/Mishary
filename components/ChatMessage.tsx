import React from 'react';
import { Message, Role } from '../types';

interface ChatMessageProps {
  message: Message;
}

const BotIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex items-start gap-4 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
          <BotIcon className="w-6 h-6 text-cyan-400" />
        </div>
      )}
      <div
        className={`max-w-xl rounded-xl shadow-lg ${
          isUser
            ? 'bg-blue-600/50 text-white rounded-br-none'
            : 'bg-gray-700/60 text-gray-200 rounded-bl-none'
        } ${message.imageUrls && message.imageUrls.length > 0 ? 'p-2' : 'p-4'}`}
      >
        {message.imageUrls && message.imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
                {message.imageUrls.map((url, index) => (
                    <img key={index} src={url} alt={`${message.text || 'Uploaded image'} ${index + 1}`} className="rounded-lg max-h-48 h-auto object-contain" />
                ))}
            </div>
        )}
        {message.text && (
            <div className={`whitespace-pre-wrap ${message.imageUrls && message.imageUrls.length > 0 ? 'p-2' : ''}`}>
                {message.text}
            </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center">
          <UserIcon className="w-6 h-6 text-blue-300" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
