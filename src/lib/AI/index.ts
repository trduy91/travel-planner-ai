import { DeepSeekAI } from './deepseek';
import { GeminiAI } from './gemini';
import { AIService, AIMessage, AIResponse, AIError, AIConfig } from './types';

export { AIService, type AIMessage, type AIResponse, type AIError, type AIConfig };
interface AIServiceInterface {
  chat(messages: AIMessage[], config?: AIConfig): Promise<AIResponse | AIError>;
}

export function createAIService(
  service: AIService
): AIServiceInterface {
  switch (service) {
    case AIService.DeepSeek:
      return new DeepSeekAI();
    case AIService.Gemini:
      return new GeminiAI();
    default:
      throw new Error(`Unsupported AI service: ${service}`);
  }
}

export function formatMessagesForAI(
  messages: { sender: string; text: string }[]
): AIMessage[] {
  return messages.map(msg => ({
    role: (msg.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: msg.text
  }));
}