import { AIMessage, AIService } from "@/lib/AI/types";

  
  export async function callAI(
    provider: AIService,
    messages: AIMessage[],
    options?: {
      model?: string;
      temperature?: number;
    }
  ) {
    try {
      const response = await fetch(`/api/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: options?.model,
          temperature: options?.temperature,
        }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
      }
  
      return await response.json();
    } catch (error) {
      console.error(`${provider} API call failed:`, error);
      throw error;
    }
  }