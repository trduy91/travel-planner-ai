import { callAI } from '@/lib/services/aiService';
import { AIMessage, AIResponse, AIError, AIConfig, AIService } from './types';

export class GeminiAI {
  private apiKey: string;
  private model: string;

  constructor(model: string, apiKey?: string) {
    this.model = model; // e.g., "gemini-1.5-pro-latest"
    this.apiKey = apiKey || ''; // Assign or handle if direct calls are made from this class
    console.log(`GeminiAI agent initialized for model ${this.model}. API key will be handled by the backend if using callAI.`);
  }

  async chat(
    messages: AIMessage[],
    config: AIConfig = {}
  ): Promise<AIResponse | AIError> {

    const defaultConfig: AIConfig = {
      model: this.model,
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