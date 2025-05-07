import { useState, useEffect, useCallback, useMemo } from 'react';
import { auth } from '@/lib/firebase';
import { Message, sendMessage as firebaseSendMessage, subscribeToMessages } from '@/lib/dbMessage/messages';
import { TravelPlannerAI, AIService } from '@/lib/AI/travelPlanner';
import { ActiveAgentConfig, AIResponse, parseActiveAgents } from '@/lib/AI';

interface UseMessagesReturn {
  messages: Message[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: (message: string) => Promise<void>;
  appendTagToInput: (tag: string) => string;
  generateQuickResponse: (prompt: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
  agentConfigs: ActiveAgentConfig[];
}

export const useMessages = (): UseMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;

  // Initialize AI Travel Planner with memoization
  const agentConfigs = useMemo(() => {
    const envVar = process.env.NEXT_PUBLIC_ACTIVE_AGENTS;
    const configs = parseActiveAgents(envVar);
    if (configs.length === 0) {
      console.warn("useMessages: No active AI agents configured from NEXT_PUBLIC_ACTIVE_AGENTS. AI responses will be limited or unavailable.");
    }
    return configs;
  }, []);
  const travelPlanner = useMemo(() => new TravelPlannerAI(agentConfigs), [agentConfigs]);


  // Subscribe to messages
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToMessages(user.uid, (msgs) => {
      setMessages(msgs);
    });

    return unsubscribe;
  }, [user]);

  // Get AI responses from potentially multiple services
  const getAIResponses = useCallback(async (
    userMessage: string,
    history: Message[],
    targetAgentAliases?: string[] // Aliases like "gemini-pro"
  ): Promise<Record<string, { content: string } | { error: string }>> => { // Keyed by alias
    try {
      setIsTyping(true);
      setError(null);
      // Pass targetAgentAliases to travelPlanner
      const results = await travelPlanner.generateTravelResponse(userMessage, history, targetAgentAliases);
      const processedResults: Record<string, { content: string } | { error: string }> = {};

      for (const key in results) {
        const agentAlias = key; // This is now the agent's alias
        const result = results[agentAlias];
        if (result && 'error' in result) {
          console.error(`AI Error from agent "${agentAlias}":`, result.error);
          processedResults[agentAlias] = { error: result.error };
        } else if (result && 'content' in result) { // Check for content property
          processedResults[agentAlias] = { content: (result as AIResponse).content };
        } else {
          // Handle cases where result might be undefined or not match expected structure
          console.error(`Unexpected AI result structure from agent "${agentAlias}":`, result);
          processedResults[agentAlias] = { error: "Unexpected response structure from AI." };
        }
      }

      return processedResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI service failed';
      console.error('Travel planner error:', errorMessage);
      setError(errorMessage);
      const errorResponseForAll: Record<string, { error: string }> = {};
      const agentsToReportErrorFor = targetAgentAliases && targetAgentAliases.length > 0
        ? targetAgentAliases
        : agentConfigs.map(ac => ac.alias); // Report error for all configured if no target

      agentsToReportErrorFor.forEach(alias => {
        errorResponseForAll[alias] = { error: errorMessage };
      });
      return errorResponseForAll;
    } finally {
      setIsTyping(false);
    }
  }, [travelPlanner, agentConfigs]);

  // Quick response generator for predefined prompts
  const generateQuickResponse = useCallback(async (prompt: string): Promise<string> => {
    setIsLoading(true);
    const defaultAgentAlias = agentConfigs.length > 0 ? agentConfigs[0].alias : undefined;

    try {
      if (!defaultAgentAlias) {
        setError("No default AI agent configured for quick response.");
        return "Sorry, I can't provide a quick response right now.";
      }
      // Pass current messages history to getAIResponses
      const responses = await getAIResponses(prompt, messages, [defaultAgentAlias]);
      const response = responses[defaultAgentAlias];

      if (response && 'content'in response) return response.content;
      
      const errorMsg = response && 'error'in response ? response.error : "Sorry, couldn't generate a quick response.";
      setError(errorMsg); return errorMsg;
    } finally {
      setIsLoading(false);
    }
  }, [getAIResponses, messages, agentConfigs]);

  // Function to append a clicked tag to the newMessage input
  const appendTagToInput = useCallback((tag: string): string => {
    let resultText = '';
    setNewMessage(prev => {
      const newText = prev ? `${prev} ${tag} ` : `${tag} `;
      resultText = newText;
      return resultText;
    });
    return resultText;
  }, [setNewMessage]);

  // Main message sending handler
  const sendMessage = useCallback(async (messageContent: string) => {
    if (!user || !messageContent.trim()) return;

    setIsLoading(true);
    setError(null);
    const localNewMessage = messageContent; // Capture message content before setNewMessage clears it
    setNewMessage(''); // Clear input immediately

    try {
      

      // Add user message to Firestore
      await firebaseSendMessage(user.uid, {
        text: localNewMessage,
        sender: 'user',
      });

      // Parse message for tags (e.g., @gemini-pro, @deepseek-chat)
      const tagRegex = /@([\w.-]+)(?=\s|$)/g; 
      const mentionedAgentAliases: string[] = [];
      let match;
      let messageForAI = localNewMessage;

      while ((match = tagRegex.exec(localNewMessage)) !== null) {
        const alias = match[1].toLowerCase();
        // Check if this alias is one of the configured agents
        if (agentConfigs.some(ac => ac.alias.toLowerCase() === alias)) {
          mentionedAgentAliases.push(alias);
        }
      }
      
      // Remove tags from the message content that's sent to the AI
      if (mentionedAgentAliases.length > 0) {
        messageForAI = localNewMessage.replace(tagRegex, '').trim();
      }
      // If no specific agents are tagged, targetAgentAliases will be undefined,
      // and getAIResponses will query all active agents.
      const targetAliases = mentionedAgentAliases.length > 0 ? mentionedAgentAliases : undefined;

      // Fetch (potentially) multiple AI responses
      // Pass the current messages state at the time of sending for history
      const aiResponses = await getAIResponses(messageForAI, messages, targetAliases);

      for (const agentAlias in aiResponses) {
        const response = aiResponses[agentAlias];
        let responseText: string;

        if (response && 'error'in response) {
          responseText = `Error from @${agentAlias}: ${response.error}`;
        } else if (response && 'content' in response) {
          // Prefixing response with AI name for clarity in UI
          const agentConfig = agentConfigs.find(ac => ac.alias === agentAlias);
          const displayName = agentConfig ? `@${agentConfig.alias}` : `@${agentAlias}`;
          responseText = `${displayName}: ${response.content}`;
        } else {
          responseText = `Received an unexpected response from @${agentAlias}.`;
          console.warn(`Unexpected response structure for ${agentAlias}:`, response);
        }
        
        await firebaseSendMessage(user.uid, {
          text: responseText,
          sender: 'ai',
          // Consider adding: aiAgentAlias: agentAlias, // if Message schema is updated
        });
      }
      

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Message sending error:', errorMessage);
      await firebaseSendMessage(user.uid, {
        text: "Sorry, I encountered an error processing your request.",
        sender: 'ai',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, getAIResponses, messages, setNewMessage, agentConfigs]);

  return {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    appendTagToInput,
    generateQuickResponse,
    isLoading,
    error,
    isTyping,
    agentConfigs
  };
};