import { createAIService, AIService, formatMessagesForAI } from './index';
import { AIMessage, AIResponse, AIError, AIConfig } from './types';
import { Message } from '@/lib/dbMessage/messages';

interface TravelPlannerConfig {
  aiService: AIService;
  defaultModel?: string;
}

export class TravelPlannerAI {
  private aiService: ReturnType<typeof createAIService>;

  constructor(config: TravelPlannerConfig) {
    this.aiService = createAIService(config.aiService);
  }

  private createSystemPrompt(): AIMessage {
    return {
      role: 'system',
      content: `You are an expert travel planning assistant. Provide:
      - Destination recommendations with pros/cons
      - Detailed itineraries with time allocations
      - Budget estimates (budget/mid-range/luxury)
      - Local customs/tips (dos and don'ts)
      - Weather considerations
      - Safety advisories
      - Transportation options and costs
      - Visa requirements if international
      - Packing suggestions
      
      Format responses using markdown:
        **Headings** for sections:
        # Main Title
        ## Itinerary
        ### Day 1
        
        **Lists** for activities:
        - Morning: Activity 1
        - Afternoon: Activity 2
        
        **Code blocks** for exact addresses:
        \`\`\`
        123 Main St, Paris
        \`\`\`
        
        **Bold** for important info: **Budget**: €200/day
        
        **Links** when relevant: [More info](https://example.com)
        
        Always use proper line breaks between sections.
        Emojis for better readability
        Estimated costs where relevant
      
      Ask clarifying questions if needed.`
    };
  }

  async generateTravelResponse(
    userMessage: string,
    chatHistory: Message[],
    config?: AIConfig
  ): Promise<AIResponse | AIError> {
    const messages: AIMessage[] = [
      this.createSystemPrompt(),
      ...formatMessagesForAI(chatHistory),
      { 
        role: 'user' as const, // Explicitly type as 'user'
        content: userMessage 
      }
    ];

    // Type guard to ensure aiService has chat method
    if ('chat' in this.aiService) {
      return this.aiService.chat(messages, {
        temperature: 0.7,
        maxTokens: 1500,
        ...config,
      });
    }
    
    throw new Error('Selected AI service does not support chat');
  }

  async generateItinerary(
    destination: string,
    days: number,
    budget: string,
    interests: string[]
  ): Promise<AIResponse | AIError> {
    const prompt = `Create a ${days}-day itinerary for ${destination} with ${budget} budget focusing on: ${interests.join(', ')}. Include:
    - Daily schedule with time slots
    - Activity recommendations
    - Restaurant suggestions
    - Transportation options
    - Estimated costs`;

    return this.generateTravelResponse(prompt, []);
  }
}

export { AIService };
