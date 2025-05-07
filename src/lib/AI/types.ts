export interface AIMessage {
  role: 'user' | 'assistant' | 'system' | 'model';
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
  OpenAI = 'openai',
  Llama = 'llama'
}

export interface ActiveAgentConfig {
  alias: string; // Unique identifier for tagging, e.g., "gemini-pro"
  provider: AIService; // e.g., AIService.Gemini
  model: string; // e.g., "gemini-1.5-pro-latest"
  apiKey?: string;
  roleNames?: string[]; // e.g., ["ItineraryPlanner", "BudgetAdvisor"]
}

export enum AgentRole {
  ItineraryPlanner = 'itineraryplanner',
  BudgetAdvisor = 'budgetadvisor',
  LocalCultureExpert = 'localcultureexpert',
  RecommendationEngine = 'recommendationengine'
}