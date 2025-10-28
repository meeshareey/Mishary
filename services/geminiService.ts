import { GoogleGenAI, Chat, FunctionDeclaration, Type, Modality, LiveServerMessage, Blob } from "@google/genai";
import { Role } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const systemInstruction = `You are Meeshareey, a highly advanced AI cybersecurity analyst with a powerful mathematical brain. 
Your purpose is to provide expert analysis on cyber threats, online safety, and digital security best practices. 
You can also analyze images related to cybersecurity (e.g., screenshots of phishing emails).
Your responses must be concise, precise, and directly address the user's query. Avoid conversational fluff. 
Use markdown for clarity.
If the user asks you to generate an image, you must use the generateImage tool.`;

const generateImageFunctionDeclaration: FunctionDeclaration = {
  name: 'generateImage',
  description: 'Generates an image based on a user-provided description.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: {
        type: Type.STRING,
        description: 'A detailed description of the image to generate.',
      },
    },
    required: ['description'],
  },
};

export const startChat = (): Chat => {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      tools: [{ functionDeclarations: [generateImageFunctionDeclaration] }],
    },
  });
  return chat;
};

// Helper to convert a File object to a GoogleGenerativeAI.Part object.
const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: file.type,
        },
    };
};

export const sendMessage = async (chat: Chat, message: string, files: File[] = []) => {
    const imageParts = await Promise.all(files.map(fileToGenerativePart));
    
    // Do not send if there is no text and no images
    if (!message.trim() && files.length === 0) {
        return null;
    }
    
    // FIX: The `chat.sendMessage` method expects an object with a `message` property,
    // which should contain an array of Parts for multimodal input. The original code
    // used an incorrect property 'parts' and an invalid structure for the content array.
    const contentParts = [];
    if (message.trim()) {
        contentParts.push({ text: message });
    }
    contentParts.push(...imageParts);
    
    const result = await chat.sendMessage({ message: contentParts });
    return result;
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    throw new Error('No image data found in response.');
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image. The model may have refused the request due to safety policies.');
  }
};


// --- LIVE API CODE ---

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}


export const connectLive = (voiceName: string, callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
}) => {
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
      },
      systemInstruction: systemInstruction,
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  });
};