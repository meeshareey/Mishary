import React, { useState, useEffect, useRef, useCallback } from 'react';
// FIX: Removed `LiveSession` as it's not an exported member of `@google/genai`.
import { Chat, LiveServerMessage } from "@google/genai";
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Loader from './components/Loader';
import { Message, Role } from './types';
import { startChat, sendMessage, generateImageFromPrompt, connectLive, createBlob, decode, decodeAudioData } from './services/geminiService';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="22"></line>
    </svg>
);

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- LIVE STATE & REFS ---
  const [isLive, setIsLive] = useState(false);
  // FIX: Use ReturnType to get the type of the session promise since LiveSession is not exported.
  const sessionPromiseRef = useRef<ReturnType<typeof connectLive> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const currentTurnMessages = useRef<{ user: Message | null, model: Message | null }>({ user: null, model: null });
  const audioPlaybackQueueRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextAudioStartTimeRef = useRef(0);


  useEffect(() => {
    // Initialize chat session on component mount
    try {
      chatRef.current = startChat();
      setMessages([
        {
          role: Role.MODEL,
          text: "I am Meeshareey, a cybersecurity analyst. How can I assist you with digital security threats or best practices? You can also provide an image for analysis.",
        },
      ]);
    } catch (e) {
      setError('Failed to initialize the chat service. Please check your API key.');
      console.error(e);
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to the latest message
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const stopLiveSession = useCallback(() => {
    setIsLive(false);
    setIsLoading(false);

    sessionPromiseRef.current?.then(session => session.close());
    sessionPromiseRef.current = null;

    microphoneStreamRef.current?.getTracks().forEach(track => track.stop());
    microphoneStreamRef.current = null;
    
    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;

    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;

    audioPlaybackQueueRef.current.forEach(source => source.stop());
    audioPlaybackQueueRef.current.clear();
    nextAudioStartTimeRef.current = 0;
  }, []);
  
  // Stop live session on unmount
  useEffect(() => {
    return () => {
      if (isLive) {
        stopLiveSession();
      }
    };
  }, [isLive, stopLiveSession]);

  const startLiveSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;
      
      // FIX: Cast window to any to support vendor-prefixed webkitAudioContext for older browsers.
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextAudioStartTimeRef.current = 0;

      const sessionPromise = connectLive('Puck', { // Use 'Puck' for a different male voice
        onopen: () => {
          setIsLive(true);
          setIsLoading(false);

          // Greet the user to start the conversation
          sessionPromiseRef.current?.then((session) => {
            session.sendRealtimeInput({ text: "State your name and function, and ask how you can assist." });
          });
          
          const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
          const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
          scriptProcessorRef.current = scriptProcessor;

          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromiseRef.current?.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };

          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContextRef.current!.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
            const currentOutputCtx = outputAudioContextRef.current;
            if (!currentOutputCtx) return;
        
            let transcriptionUpdated = false;
        
            if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                if (currentTurnMessages.current.user) {
                    currentTurnMessages.current.user.text += text;
                } else {
                    currentTurnMessages.current.user = { role: Role.USER, text: text };
                    setMessages(prev => [...prev, currentTurnMessages.current.user!]);
                }
                transcriptionUpdated = true;
            }
        
            if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                if (currentTurnMessages.current.model) {
                    currentTurnMessages.current.model.text += text;
                } else {
                    currentTurnMessages.current.model = { role: Role.MODEL, text: text };
                    setMessages(prev => [...prev, currentTurnMessages.current.model!]);
                }
                transcriptionUpdated = true;
            }
            
            if (transcriptionUpdated) {
                setMessages(prev => [...prev]); // Force re-render with updated message text
            }
        
            if (message.serverContent?.turnComplete) {
                currentTurnMessages.current = { user: null, model: null };
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
                nextAudioStartTimeRef.current = Math.max(nextAudioStartTimeRef.current, currentOutputCtx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), currentOutputCtx, 24000, 1);
                const source = currentOutputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(currentOutputCtx.destination);
                source.addEventListener('ended', () => audioPlaybackQueueRef.current.delete(source));
                source.start(nextAudioStartTimeRef.current);
                nextAudioStartTimeRef.current += audioBuffer.duration;
                audioPlaybackQueueRef.current.add(source);
            }
            
            if (message.serverContent?.interrupted) {
                audioPlaybackQueueRef.current.forEach(source => source.stop());
                audioPlaybackQueueRef.current.clear();
                nextAudioStartTimeRef.current = 0;
            }
        },
        onerror: (e: ErrorEvent) => {
          console.error('Live session error:', e);
          setError('A live session error occurred. Please try again.');
          stopLiveSession();
        },
        onclose: (e: CloseEvent) => {
          stopLiveSession();
        },
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error('Failed to start live session:', err);
      setError('Could not access microphone. Please grant permission and try again.');
      setIsLoading(false);
    }
  }, [stopLiveSession]);

  const handleToggleLive = () => {
    if (isLive) {
      stopLiveSession();
    } else {
      startLiveSession();
    }
  };

  const handleSendMessage = useCallback(async (userInput: string, files: File[]) => {
    if (!chatRef.current) {
      setError("Chat is not initialized.");
      return;
    }
    if (!userInput.trim() && files.length === 0) {
      return; // Prevent sending empty messages
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const imageUrls = await Promise.all(files.map(fileToBase64));
      const newUserMessage: Message = { role: Role.USER, text: userInput, imageUrls };
      setMessages((prevMessages) => [...prevMessages, newUserMessage]);
      
      const response = await sendMessage(chatRef.current, userInput, files);

      if (!response) {
        setIsLoading(false);
        return;
      }
      
      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        for (const fc of functionCalls) {
          if (fc.name === 'generateImage') {
            const description = fc.args.description as string;
            setMessages((prev) => [...prev, {role: Role.MODEL, text: `Generating an image of: "${description}"`}]);
            
            try {
                const imageUrl = await generateImageFromPrompt(description);
                setMessages((prev) => [...prev, {role: Role.MODEL, text: '', imageUrls: [imageUrl]}]);
            } catch (imgError) {
                const errorMessage = "Sorry, I couldn't generate that image. It might violate safety policies. Please try a different description.";
                setMessages((prev) => [...prev, {role: Role.MODEL, text: errorMessage}]);
                console.error(imgError);
            }
          }
        }
      } else {
        const modelResponse: Message = { role: Role.MODEL, text: response.text };
        setMessages((prevMessages) => [...prevMessages, modelResponse]);
      }

    } catch (e) {
      const errorMessage = "Sorry, something went wrong. Please try again.";
      setError(errorMessage);
       setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          newMessages.push({ role: Role.MODEL, text: errorMessage });
          return newMessages;
        });
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col font-sans">
      <Header />
      {isLive && (
        <div className="bg-cyan-600 text-white text-center py-2 flex items-center justify-center gap-2 shadow-md">
          <MicIcon className="w-5 h-5 animate-pulse" />
          <span className="font-semibold">Live chat is active</span>
        </div>
      )}
      <main ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 pb-24">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && !isLive && <Loader />}
          {error && <div className="text-red-400 text-center my-4">{error}</div>}
        </div>
      </main>
      <div className="bg-gray-900/80 backdrop-blur-sm border-t border-cyan-500/30 sticky bottom-0">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading || isLive} 
          isLive={isLive}
          onToggleLive={handleToggleLive}
        />
      </div>
    </div>
  );
};

export default App;