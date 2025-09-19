'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState, useEffect } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaRobot, FaPhone, FaPhoneSlash, FaTrash, FaHistory } from 'react-icons/fa';
import { CONVERSATION_CONFIG, cleanExpiredMessages } from '@/config/conversationConfig';

// Conversation history management using configuration
const {
  STORAGE_KEY: CONVERSATION_STORAGE_KEY,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_AGE_DAYS,
  MAX_CONTEXT_MESSAGES
} = CONVERSATION_CONFIG;

const getStoredConversationHistory = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored);
    // Clean expired messages if age limit is set
    const cleanedHistory = cleanExpiredMessages(history, MAX_MESSAGE_AGE_DAYS);

    // If we cleaned any messages, update storage
    if (cleanedHistory.length !== history.length) {
      saveConversationHistory(cleanedHistory);
    }

    return cleanedHistory;
  } catch (error) {
    console.error('Error loading conversation history:', error);
    return [];
  }
};

const saveConversationHistory = (history) => {
  if (typeof window === 'undefined') return;
  try {
    // Keep only the most recent messages to prevent localStorage bloat
    const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES);
    console.log('Saving to localStorage:', trimmedHistory);
    localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(trimmedHistory));
    console.log('Saved successfully. Current localStorage value:', localStorage.getItem(CONVERSATION_STORAGE_KEY));
  } catch (error) {
    console.error('Error saving conversation history:', error);
  }
};

const clearConversationHistory = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CONVERSATION_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing conversation history:', error);
  }
};

export default function Conversation() {
  const [isListening, setIsListening] = useState(false);
  const [conversationIsSpeaking, setIsAISpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load conversation history on component mount
  useEffect(() => {
    const storedHistory = getStoredConversationHistory();
    console.log('Loading stored conversation history:', storedHistory);
    setConversationHistory(storedHistory);
  }, []);

  // Generate context summary from conversation history
  const generateContextSummary = useCallback(() => {
    if (conversationHistory.length === 0) return '';

    // Get the last N meaningful messages for context (configurable)
    const recentMessages = conversationHistory
      .filter(msg => msg.message && msg.message.trim() && !msg.message.includes('audioData'))
      .slice(-MAX_CONTEXT_MESSAGES)
      .map(msg => {
        const source = msg.source === 'user' ? 'User' : 'AI';
        return `${source}: ${msg.message}`;
      })
      .join('\n');

    return recentMessages ? `Previous conversation context:\n${recentMessages}\n\nPlease continue our conversation naturally based on this context.` : '';
  }, [conversationHistory]);

  const conversation = useConversation({
    overrides: conversationHistory.length > 0 ? {
      agent: {
        prompt: {
          prompt: `You are a helpful AI assistant for Upskillr, an AI-powered training platform. ${generateContextSummary()}`
        },
        firstMessage: conversationHistory.length > 0
          ? "I remember our previous conversation. How can I continue helping you?"
          : "Hello! I'm your AI assistant. How can I help you with your training today?"
      }
    } : undefined,

    onConnect: () => {
      console.log('Connected');
      setConnectionStatus('connected');

      // Send contextual update if we have previous conversation history
      if (conversationHistory.length > 0) {
        setTimeout(() => {
          const contextSummary = generateContextSummary();
          if (contextSummary) {
            conversation.sendContextualUpdate(contextSummary);
          }
        }, 1000); // Small delay to ensure connection is fully established
      }
    },

    onModeChange: (mode) => {
      console.log(mode, "mode changed");
    },

    onDisconnect: () => {
      console.log('Disconnected');
      setConnectionStatus('disconnected');
      setIsListening(false);
      setIsAISpeaking(false);
    },

    onMessage: (message) => {
      console.log('Message received:', message);

      // Store meaningful messages in conversation history
      if (message.message && message.message.trim() && !message.message.includes('audioData')) {
        console.log('Storing message:', message.message, 'from:', message.source);

        const newMessage = {
          id: Date.now() + Math.random(), // Simple unique ID
          timestamp: new Date().toISOString(),
          source: message.source,
          message: message.message,
          type: message.type || 'text'
        };

        setConversationHistory(prev => {
          const updated = [...prev, newMessage];
          console.log('Updated conversation history:', updated);
          saveConversationHistory(updated);
          return updated;
        });
      } else {
        console.log('Message not stored - either empty, contains audioData, or invalid:', {
          hasMessage: !!message.message,
          messageLength: message.message?.length,
          containsAudioData: message.message?.includes('audioData')
        });
      }

      // Check if the message contains audio data (user is speaking)
      if (message.audioData && message.audioData.length > 0) {
        setIsListening(true);
        setIsAISpeaking(false);
        return;
      }

      // If no audio data, check if we have a message from the user
      if (message.source === 'user') {
        setIsListening(false);
        setIsAISpeaking(false);
      }

      // Track AI speaking state
      if (message.source === 'ai') {
        setIsListening(false);
        setIsAISpeaking(true);
      }
    },

    onError: (error) => {
      console.error('Error:', error);
      setConnectionStatus('error');
      setIsListening(false);
      setIsAISpeaking(false);
    },
  });
  // console.log(conversation.isSpeaking,"conversation")
  const startConversation = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: 'agent_1601k47rvwmqf22vdra1kn5183na', // Replace with your actual Agent ID
        // user_id: 'YOUR_CUSTOMER_USER_ID', // optional
      });
    } catch (error) {
      console.log('Failed to start conversation:', error);
      setConnectionStatus('error');
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    setConnectionStatus('disconnecting');
    await conversation.endSession();
  }, [conversation]);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    clearConversationHistory();
  }, []);

  const debugLocalStorage = useCallback(() => {
    const stored = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    console.log('=== DEBUG INFO ===');
    console.log('Current conversationHistory state:', conversationHistory);
    console.log('Raw localStorage value:', stored);
    console.log('Parsed localStorage:', stored ? JSON.parse(stored) : null);
    console.log('Storage key:', CONVERSATION_STORAGE_KEY);
    console.log('==================');
  }, [conversationHistory]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
      case 'disconnecting':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8 bg-gray-50 min-h-screen">
      {/* Status Display */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Voice Conversation</h1>
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          Status: {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
        </div>
        {conversationHistory.length > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            {conversationHistory.length} messages in history
          </div>
        )}
      </div>

      {/* Visual Status Indicators */}
      <div className="flex items-center gap-8">
        {/* User Speaking Indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className={`p-4 rounded-full transition-all duration-300 ${isListening
            ? 'bg-blue-500 text-white shadow-lg scale-110'
            : 'bg-gray-200 text-gray-500'
            }`}>
            {isListening ? (
              <FaMicrophone className="w-8 h-8" />
            ) : (
              <FaMicrophoneSlash className="w-8 h-8" />
            )}
          </div>
          <span className={`text-sm font-medium transition-colors ${isListening ? 'text-blue-600' : 'text-gray-500'
            }`}>
            {isListening ? 'You\'re speaking...' : 'You'}
          </span>
        </div>

        {/* Connection Line */}
        <div className={`w-16 h-1 rounded transition-colors ${connectionStatus === 'connected'
          ? 'bg-green-400'
          : connectionStatus === 'connecting' || connectionStatus === 'disconnecting'
            ? 'bg-yellow-400'
            : 'bg-gray-300'
          }`} />

        {/* AI Speaking Indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className={`p-4 rounded-full transition-all duration-300 ${conversation.isSpeaking
            ? 'bg-purple-500 text-white shadow-lg scale-110 animate-pulse'
            : 'bg-gray-200 text-gray-500'
            }`}>
            <FaRobot className="w-8 h-8" />
          </div>
          <span className={`text-sm font-medium transition-colors ${conversation.isSpeaking ? 'text-purple-600' : 'text-gray-500'
            }`}>
            {conversation.isSpeaking ? 'AI is speaking...' : 'AI'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={startConversation}
          disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${connectionStatus === 'connected' || connectionStatus === 'connecting'
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg'
            }`}
        >
          <FaPhone className="w-5 h-5" />
          {connectionStatus === 'connecting' ? 'Connecting...' : 'Start Conversation'}
        </button>

        <button
          onClick={stopConversation}
          disabled={connectionStatus === 'disconnected' || connectionStatus === 'disconnecting'}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${connectionStatus === 'disconnected' || connectionStatus === 'disconnecting'
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg'
            }`}
        >
          <FaPhoneSlash className="w-5 h-5" />
          {connectionStatus === 'disconnecting' ? 'Disconnecting...' : 'Stop Conversation'}
        </button>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg"
        >
          <FaHistory className="w-5 h-5" />
          {showHistory ? 'Hide History' : 'Show History'}
        </button>

        {conversationHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all bg-orange-500 text-white hover:bg-orange-600 shadow-md hover:shadow-lg"
          >
            <FaTrash className="w-5 h-5" />
            Clear History
          </button>
        )}

        <button
          onClick={debugLocalStorage}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-gray-500 text-white hover:bg-gray-600 text-sm"
        >
          Debug Storage
        </button>
      </div>

      {/* Live Status Text */}
      <div className="text-center min-h-[2rem]">
        {isListening && (
          <div className="text-blue-600 font-medium animate-pulse">
            🎤 Listening to your voice...
          </div>
        )}
        {conversation.isSpeaking && (
          <div className="text-purple-600 font-medium animate-pulse">
            🤖 AI is responding...
          </div>
        )}
        {!isListening && !conversation.isSpeaking && connectionStatus === 'connected' && (
          <div className="text-gray-500">
            Ready to chat! Start speaking...
          </div>
        )}
      </div>

      {/* Conversation History Panel */}
      {showHistory && (
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Conversation History</h2>
            <span className="text-sm text-gray-500">
              {conversationHistory.length} messages
            </span>
          </div>

          {conversationHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No conversation history yet. Start a conversation to see messages here.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {conversationHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.source === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${msg.source === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                      }`}
                  >
                    <div className="text-sm mb-1">
                      <span className="font-medium">
                        {msg.source === 'user' ? 'You' : 'AI'}
                      </span>
                      <span className="text-xs opacity-70 ml-2">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm">{msg.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}