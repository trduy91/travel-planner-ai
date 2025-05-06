import { callAI } from '@/lib/services/aiService';
import { AIMessage, AIResponse, AIError, AIConfig, AIService } from './types';

export class GeminiAI {
  async chat(
    messages: AIMessage[],
    config: AIConfig = {}
  ): Promise<AIResponse | AIError> {
    const defaultConfig: AIConfig = {
      model: 'gemini-2.0-flash',
      temperature: 0.7,
      maxTokens: 1000,
      ...config,
    };
    try {
      const data = await callAI(AIService.Gemini, messages, defaultConfig)
      return {
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
        model: data.model,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}