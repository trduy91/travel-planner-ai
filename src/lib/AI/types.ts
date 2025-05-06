export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  name?: string; // Optional for some APIs
}

export interface AIResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
}

export interface AIError {
  error: string;
  statusCode?: number;
}

export type AIConfig = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
};

export enum AIService {
  DeepSeek = 'deepseek',
  Gemini = 'gemini',
  OpenAI = 'openai'
}