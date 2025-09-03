'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback } from 'react';

export default function Conversation() {
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('Error:', error),
  });

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }); 
      await conversation.startSession({
        agentId: 'agent_1601k47rvwmqf22vdra1kn5183na', // Replace with your actual Agent ID
        // user_id: 'YOUR_CUSTOMER_USER_ID', // optional
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <button onClick={startConversation}>Start Conversation</button>
        <button onClick={stopConversation}>Stop Conversation</button>
      </div>
    </div>
  );
}
