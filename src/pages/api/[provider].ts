import { ActiveAgentConfig, AIMessage } from '@/lib/AI';
import type { NextApiRequest, NextApiResponse } from 'next';

// Helper to get provider-specific fallback API key from environment variables
const getFallbackApiKey = (provider: string | string[] | undefined): string | undefined => {
  if (typeof provider !== 'string') return undefined;

  switch (provider.toLowerCase()) {
    case 'deepseek':
      return process.env.DEEPSEEK_API_KEY; // Example: DEEPSEEK_API_KEY
    case 'gemini':
      return process.env.GEMINI_API_KEY;   // Example: GEMINI_API_KEY
    case 'openai':
      return process.env.OPENAI_API_KEY;   // Example: OPENAI_API_KEY
    default:
      // A very generic fallback, though provider-specific is better
      return process.env.GENERIC_AI_API_KEY;
  }
};

// Server-side agent configurations
let serverSideAgentConfigs: ActiveAgentConfig[] | null = null;

function loadServerSideAgentConfigs(): ActiveAgentConfig[] {
  if (serverSideAgentConfigs) {
    return serverSideAgentConfigs;
  }
  const configJson = process.env.SERVER_AGENTS_CONFIG;
  if (!configJson) {
    console.error("SERVER_AGENTS_CONFIG environment variable is not set.");
    serverSideAgentConfigs = [];
    return [];
  }
  try {
    serverSideAgentConfigs = JSON.parse(configJson);
    return serverSideAgentConfigs || [];
  } catch (e) {
    console.error("Failed to parse SERVER_AGENTS_CONFIG JSON:", e);
    serverSideAgentConfigs = [];
    return [];
  }
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider } = req.query; // e.g., "deepseek", "gemini"
  const body = req.body;

  // The body is now the payload to forward, as it won't contain an apiKey property from the client.
  const payloadToForward = body;
  const modelFromRequest = payloadToForward.model;

  const allServerConfigs = loadServerSideAgentConfigs();
  const targetAgentConfig = allServerConfigs.find(
    (agent) => agent.provider === provider && agent.model === modelFromRequest
  );

  let apiKeyToUse: string | undefined;

  if (targetAgentConfig && targetAgentConfig.apiKey) {
    apiKeyToUse = targetAgentConfig.apiKey;
  } else {
    // Fallback to provider-specific keys if no matching agent config or agent config has no key
    console.warn(`No specific agent config found for ${provider}/${modelFromRequest} in SERVER_AGENTS_CONFIG or key missing. Falling back to direct env key.`);
    apiKeyToUse = getFallbackApiKey(provider);
  }

  if (!apiKeyToUse) {
    return res.status(500).json({ error: `API key for provider ${provider} (model: ${modelFromRequest}) not configured on the server.` });
  }

  try {
    switch (provider) {
      case 'deepseek': {
        // DeepSeek expects model, messages, temperature, etc. in payloadToForward
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKeyToUse}`,
          },
          body: JSON.stringify(payloadToForward),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`DeepSeek API Error (${response.status}):`, error);
          throw new Error(error.error?.message || error.message || `DeepSeek API request failed with status ${response.status}`);
        }
        const data = await response.json();
        return res.status(200).json(data);
      }

      case 'gemini': {
        // Gemini expects 'contents' in payloadToForward.
        // The model name is part of the URL.
        const model = payloadToForward.model || 'gemini-1.5-flash-latest'; // Default if not in payload

        // Transform AIMessage[] from payloadToForward.messages to Gemini's expected format
        const originalMessages: AIMessage[] = payloadToForward.messages || [];
        const geminiFormattedMessages = originalMessages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : (msg.role === 'system' ? 'user' : msg.role),
          parts: [{ text: msg.content }],
        }));
        
        // Gemini API expects 'contents' not 'messages'
        // This transformation should ideally happen in the GeminiAI class before callAI,
        // but if callAI just forwards, we might need to do it here or ensure payloadToForward is correct.
        // Assuming payloadToForward.messages is already in Gemini's {role: 'user'/'model', parts: [{text: ...}]} format
        const geminiPayload = {
          contents: geminiFormattedMessages, // Assuming messages are pre-formatted for Gemini
          generationConfig: {
            temperature: payloadToForward.temperature,
            // maxOutputTokens: payloadToForward.maxTokens, // if needed
          }
        };

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeyToUse}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(geminiPayload),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`Gemini API Error (${response.status}):`, errorData);
          throw new Error(errorData.error?.message || `Gemini API request failed with status ${response.status}`);
        }
        const data = await response.json();
        // Add the model used to the response, as Gemini API doesn't include it in the same way
        return res.status(200).json({ ...data, model: model });
      }

      case 'openai': {
        // OpenAI expects model, messages, temperature, etc. in payloadToForward
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKeyToUse}`,
          },
          body: JSON.stringify(payloadToForward),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`OpenAI API Error (${response.status}):`, error);
          throw new Error(error.error?.message || `OpenAI API request failed with status ${response.status}`);
        }
        const data = await response.json();
        return res.status(200).json(data);
      }

      default:
        return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }
  } catch (error) {
    console.error(`API route error for provider ${provider}:`, error);
    const message = error instanceof Error ? error.message : `Unknown error occurred with ${provider}`;
    // Try to parse status code from error if it's a custom error object, otherwise default to 500
    const statusCode = (error as any).statusCode || 500;
    res.status(statusCode).json({ error: message });
  }
}