'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaRobot, FaPhone, FaPhoneSlash } from 'react-icons/fa';

export default function Conversation() {
  const [isListening, setIsListening] = useState(false);
  const [conversationIsSpeaking, setIsAISpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // console.log(conversation.isSpeaking,isListening,"connectionStatus")
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected');
      setConnectionStatus('connected');
    },
    onModeChange: (mode) => {
   console.log(mode,"mode changed")
    },
    
    onDisconnect: () => {
      console.log('Disconnected');
      setConnectionStatus('disconnected');
      setIsListening(false);
      setIsAISpeaking(false);
    },

    onMessage: (message) => {
      console.log('Message:', message);
      
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
      console.error('Failed to start conversation:', error);
      setConnectionStatus('error');
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    setConnectionStatus('disconnecting');
    await conversation.endSession();
  }, [conversation]);

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
      </div>

      {/* Visual Status Indicators */}
      <div className="flex items-center gap-8">
        {/* User Speaking Indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className={`p-4 rounded-full transition-all duration-300 ${
            isListening 
              ? 'bg-blue-500 text-white shadow-lg scale-110' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            {isListening ? (
              <FaMicrophone className="w-8 h-8" />
            ) : (
              <FaMicrophoneSlash className="w-8 h-8" />
            )}
          </div>
          <span className={`text-sm font-medium transition-colors ${
            isListening ? 'text-blue-600' : 'text-gray-500'
          }`}>
            {isListening ? 'You\'re speaking...' : 'You'}
          </span>
        </div>

        {/* Connection Line */}
        <div className={`w-16 h-1 rounded transition-colors ${
          connectionStatus === 'connected' 
            ? 'bg-green-400' 
            : connectionStatus === 'connecting' || connectionStatus === 'disconnecting'
            ? 'bg-yellow-400'
            : 'bg-gray-300'
        }`} />

        {/* AI Speaking Indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className={`p-4 rounded-full transition-all duration-300 ${
            conversation.isSpeaking 
              ? 'bg-purple-500 text-white shadow-lg scale-110 animate-pulse' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            <FaRobot className="w-8 h-8" />
          </div>
          <span className={`text-sm font-medium transition-colors ${
            conversation.isSpeaking ? 'text-purple-600' : 'text-gray-500'
          }`}>
            {conversation.isSpeaking ? 'AI is speaking...' : 'AI'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        <button 
          onClick={startConversation}
          disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            connectionStatus === 'connected' || connectionStatus === 'connecting'
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
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            connectionStatus === 'disconnected' || connectionStatus === 'disconnecting'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg'
          }`}
        >
          <FaPhoneSlash className="w-5 h-5" />
          {connectionStatus === 'disconnecting' ? 'Disconnecting...' : 'Stop Conversation'}
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
    </div>
  );
}