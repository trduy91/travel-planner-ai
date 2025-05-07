import { createAIService, formatMessagesForAI, ActiveAgentConfig, AIServiceInterface } from './index';
import { AIMessage, AIResponse, AIError, AIConfig, AIService } from './types';
import { Message } from '@/lib/dbMessage/messages';

interface TravelPlannerConfig {
  aiService: AIService;
  defaultModel?: string;
}

export class TravelPlannerAI {
  private aiProviders: Map<string, { service: AIServiceInterface, config: ActiveAgentConfig }>;

  constructor(agentConfigs: ActiveAgentConfig[]) {
    this.aiProviders = new Map();

    if (!agentConfigs || agentConfigs.length === 0) {
      console.warn("TravelPlannerAI initialized with no active agent configurations. AI functionality will be limited.");
      return;
    }

    agentConfigs.forEach(agentConfig => {
      try {
        const serviceInstance = createAIService(agentConfig);
        this.aiProviders.set(agentConfig.alias, { service: serviceInstance, config: agentConfig });
        console.log(
          `TravelPlannerAI: Initialized agent "${agentConfig.alias}" (Provider: ${agentConfig.provider}, Model: ${agentConfig.model})`
        );
      } catch (error) {
        console.error(
          `TravelPlannerAI: Failed to initialize agent "${agentConfig.alias}":`,
          error instanceof Error ? error.message : String(error)
        );
      }
    });
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
    targetAgentAliases?: string[], 
    config?: AIConfig
  ): Promise<Record<string, AIResponse | AIError>> {
    const messages: AIMessage[] = [
      this.createSystemPrompt(),
      ...formatMessagesForAI(chatHistory),
      { 
        role: 'user' as const, // Explicitly type as 'user'
        content: userMessage 
      }
    ];

    const responses: Record<string, AIResponse | AIError> = {}; // Keyed by agent alias
    let agentsToQuery: string[]; // Array of agent aliases

    if (targetAgentAliases && targetAgentAliases.length > 0) {
      agentsToQuery = targetAgentAliases.filter(alias => this.aiProviders.has(alias));
      if (agentsToQuery.length !== targetAgentAliases.length) {
        const missing = targetAgentAliases.filter(alias => !this.aiProviders.has(alias));
        console.warn(`generateTravelResponse: Could not find configured agents for aliases: ${missing.join(', ')}`);
      }
    } else {
      agentsToQuery = Array.from(this.aiProviders.keys()); // Query all configured agents
    }

    if (agentsToQuery.length === 0) {
      console.warn("generateTravelResponse: No valid AI agents to query.");
      return { "system_error": { error: "No valid AI agents targeted or available." } };
    }

    const promises = agentsToQuery.map(async (agentAlias) => {
      const agentData = this.aiProviders.get(agentAlias);
      if (agentData) {
        const { service: serviceInstance, config: agentSpecificConfig } = agentData;
        try {
          // Pass the agent's specific model and apiKey, allow overrides from call-specific config
          const callConfig: AIConfig = {
            model: agentSpecificConfig.model, // Agent's configured model
            temperature: 0.7, // Default temperature
            maxTokens: 1500,  // Default max tokens
            ...config,        // Specific config for this call can override
          };
          responses[agentAlias] = await serviceInstance.chat(messages, callConfig);
        } catch (e) {
          responses[agentAlias] = { error: e instanceof Error ? e.message : `Chat error with ${agentAlias}` };
        }
      }
    });

    await Promise.all(promises);
    return responses;
  }

  async generateItinerary(
    destination: string,
    days: number,
    budget: string,
    interests: string[]
  ): Promise<Record<string, AIResponse | AIError>> {
    const prompt = `Create a ${days}-day itinerary for ${destination} with ${budget} budget focusing on: ${interests.join(', ')}. Include:
    - Daily schedule with time slots
    - Activity recommendations
    - Restaurant suggestions
    - Transportation options
    - Estimated costs`;

    return this.generateTravelResponse(prompt, [], undefined);
  }
}

export { AIService };
