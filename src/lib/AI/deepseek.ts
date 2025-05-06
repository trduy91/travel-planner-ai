import { callAI } from '@/lib/services/aiService';
import { AIMessage, AIResponse, AIError, AIConfig, AIService } from './types';

export class DeepSeekAI {

  async chat(
    messages: AIMessage[],
    config: AIConfig = {}
  ): Promise<AIResponse | AIError> {
    const defaultConfig: AIConfig = {
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 1000,
      ...config,
    };

    try {
      const data = await callAI(AIService.DeepSeek, messages, defaultConfig)
      return {
        content: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens,
        model: data.model,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}