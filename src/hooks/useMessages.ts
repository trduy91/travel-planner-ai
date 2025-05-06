import { useState, useEffect, useCallback, useMemo } from 'react';
import { auth } from '@/lib/firebase';
import { Message, sendMessage as firebaseSendMessage, subscribeToMessages } from '@/lib/dbMessage/messages';
import { TravelPlannerAI, AIService } from '@/lib/AI/travelPlanner';

interface UseMessagesReturn {
  messages: Message[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: (message: string) => Promise<void>;
  generateQuickResponse: (prompt: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
}

export const useMessages = (): UseMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;

  // Initialize AI Travel Planner with memoization
  const travelPlanner = useMemo(() => {
    return new TravelPlannerAI({
      aiService: process.env.NEXT_PUBLIC_AI_SERVICE as AIService || AIService.DeepSeek,
    });
  }, []);

  // Subscribe to messages
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToMessages(user.uid, (msgs) => {
      setMessages(msgs);
    });

    return unsubscribe;
  }, [user]);

  // Generate AI response with error handling
  const generateAIResponse = useCallback(async (userMessage: string): Promise<string> => {
    try {
      setIsTyping(true);
      const result = await travelPlanner.generateTravelResponse(userMessage, messages);

      if ('error' in result) {
        console.error('AI Error:', result.error);
        setError(result.error);
        return "I'm having trouble helping with your travel plans right now. Please try again later.";
      }

      return result.content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI service failed';
      console.error('Travel planner error:', errorMessage);
      setError(errorMessage);
      return "Sorry, I encountered an error while planning your trip. Please try again.";
    } finally {
      setIsTyping(false);
    }
  }, [messages, travelPlanner]);

  // Quick response generator for predefined prompts
  const generateQuickResponse = useCallback(async (prompt: string): Promise<string> => {
    setIsLoading(true);
    try {
      return await generateAIResponse(prompt);
    } finally {
      setIsLoading(false);
    }
  }, [generateAIResponse]);

  // Main message sending handler
  const sendMessage = useCallback(async (message: string) => {
    if (!user || !message.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      // Add user message to Firestore
      await firebaseSendMessage(user.uid, {
        text: message,
        sender: 'user',
      });

      // Get and add AI response
      const aiResponse = await generateAIResponse(message);
      await firebaseSendMessage(user.uid, {
        text: aiResponse,
        sender: 'ai',
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Message sending error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user, generateAIResponse]);

  return {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    generateQuickResponse,
    isLoading,
    error,
    isTyping,
  };
};