import { DeepSeekAI } from './deepseek';
import { GeminiAI } from './gemini';
import { AIService, AIMessage, AIResponse, AIError, AIConfig, ActiveAgentConfig } from './types';

export { AIService, type AIMessage, type AIResponse, type AIError, type AIConfig, type ActiveAgentConfig };
export interface AIServiceInterface {
  chat(messages: AIMessage[], config?: AIConfig): Promise<AIResponse | AIError>;
}

export function createAIService(
  agentConfig: ActiveAgentConfig
): AIServiceInterface {
  const { provider, model, apiKey } = agentConfig;
  switch (provider) {
    case AIService.DeepSeek:
      return new DeepSeekAI(model, apiKey);
    case AIService.Gemini:
      return new GeminiAI(model, apiKey);
    default:
      throw new Error(`Unsupported AI service: ${provider}`);
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

export function parseActiveAgents(envVar?: string): ActiveAgentConfig[] {
  if (!envVar) {
    return [];
  }
  const agentConfigs: ActiveAgentConfig[] = [];
  const agentStrings = envVar.split('|');

  for (const agentString of agentStrings) {
    const parts = agentString.split(':');
    if (parts.length === 3) {
      const [alias, providerStr, model] = parts;
      const provider = providerStr.toLowerCase() as AIService;
      if (Object.values(AIService).includes(provider)) {
        agentConfigs.push({ alias, provider, model });
      } else {
        console.warn(`Invalid provider string "${providerStr}" in NEXT_PUBLIC_ACTIVE_AGENTS. Skipping.`);
      }
    } else {
      console.warn(`Invalid agent string format "${agentString}" in NEXT_PUBLIC_ACTIVE_AGENTS. Expected alias:provider:model. Skipping.`);
    }
  }
  return agentConfigs;
}