import { createAIService, formatMessagesForAI, ActiveAgentConfig, AIServiceInterface } from './index';
import { AIMessage, AIResponse, AIError, AIConfig, AIService, AgentRole } from './types';
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

  private createSystemPrompt(agentConfig?: ActiveAgentConfig, isSingleAgentQuery?: boolean): AIMessage {
    let content = `You are an expert travel planning assistant. Format responses using markdown with headings, lists, bold text, and emojis for readability. Ask clarifying questions if needed.`;

    const generalInstructions = `
Provide:
- Destination recommendations with pros/cons
- Detailed itineraries with time allocations
- Budget estimates (budget/mid-range/luxury)
- Local customs/tips (dos and don'ts)
- Weather considerations
- Safety advisories
- Transportation options and costs
- Visa requirements if international
- Packing suggestions`;
    if (isSingleAgentQuery || !agentConfig?.roleNames || agentConfig.roleNames.length === 0) {
      // Single active agent or no specific role defined for this agent, use general prompt
      content += generalInstructions;
    } else {
      // Agent has one or more roles defined.
      const roles = agentConfig.roleNames.map(r => r.trim()).filter(r => r); // Clean up roles
      if (roles.length > 0) {
        content += `\nYour specific role(s) are: ${roles.join(', ')}.\n`;
        if (roles.length === 1 && !isSingleAgentQuery) {
          content += `Please focus primarily on your role as ${roles[0]}.\n`;
        } else if (roles.length > 1 || isSingleAgentQuery) {
          content += `Please address all aspects of your assigned role(s).\n`;
        }
        

        roles.forEach(roleName => {
          switch (roleName.toLowerCase()) {
            case AgentRole.ItineraryPlanner.toLowerCase():
              content += `\nAs an Itinerary Planner: Focus on creating detailed itineraries with time allocations, activity suggestions, and logical flow. You can also suggest transportation between activities.`;
              break;
            case AgentRole.BudgetAdvisor.toLowerCase():
              content += `\nAs a Budget Advisor: Focus on budget aspects: providing cost estimates for activities, accommodation, food, and transport. Offer tips for saving money and compare budget, mid-range, and luxury options.`;
              break;
            case AgentRole.LocalCultureExpert.toLowerCase():
              content += `\nAs a Local Culture Expert: Focus on local customs, etiquette (dos and don'ts), essential phrases, safety tips, and unique cultural experiences. Also cover weather and packing suggestions relevant to the culture and climate.`;
              break;
            case AgentRole.RecommendationEngine.toLowerCase():
              content += `\nAs a Recommendation Engine: Focus on providing destination recommendations based on user preferences. Highlight pros and cons for each suggestion. Consider visa requirements if international travel is implied.`;
              break;
            default:
              content += `\nFor your role of "${roleName}", no specific instructions are set. Please use your general travel planning expertise for this aspect.`;
              break;
          }
        });
      } else { // Should not happen if roleNames was defined but empty after filter, but as a fallback
        content += generalInstructions;
      }
    }

    content += `
    
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
  **Links** when relevant: More info
  Always use proper line breaks between sections. Emojis for better readability. Estimated costs where relevant.`;

    return { role: 'system', content };
  }

  async generateTravelResponse(
    userMessage: string,
    chatHistory: Message[],
    targetAgentAliases?: string[], 
    config?: AIConfig
  ): Promise<Record<string, AIResponse | AIError>> {

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

    const isSingleAgentQuery = agentsToQuery.length === 1;

    const promises = agentsToQuery.map(async (agentAlias) => {
      const agentData = this.aiProviders.get(agentAlias);
      if (agentData) {
        const { service: serviceInstance, config: agentSpecificConfig } = agentData;
        try {
          // Create system prompt based on whether it's a single agent query or based on the agent's role
          const systemPrompt = this.createSystemPrompt(agentSpecificConfig, isSingleAgentQuery);
          const messagesForThisAgent: AIMessage[] = [
            systemPrompt,
            ...formatMessagesForAI(chatHistory),
            { role: 'user' as const, content: userMessage }
          ];


          // Pass the agent's specific model and apiKey, allow overrides from call-specific config
          const callConfig: AIConfig = {
            model: agentSpecificConfig.model, // Agent's configured model
            temperature: 0.7, // Default temperature
            maxTokens: 1500,  // Default max tokens
            ...config,        // Specific config for this call can override
          };
          responses[agentAlias] = await serviceInstance.chat(messagesForThisAgent, callConfig);
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
