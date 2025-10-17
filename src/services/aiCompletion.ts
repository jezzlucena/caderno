// AI completion service using HuggingFace's Free AI Language Model SmollM3
// Users can get a free API key at https://huggingface.co/settings/tokens

const OPENROUTER_API_URL = 'https://router.huggingface.co/v1/chat/completions';
export const PREDICT_TEXT_MESSAGES_GENERATOR = (text: string) => {
  return [
    {
      role: 'system',
      content: 'You are a helpful writing assistant. Continue the user\'s text naturally and concisely. Only provide the continuation, not the original text.'
    },
    {
      role: 'user',
      content: `Continue this text naturally:\n\n${text}`
    }
  ]
};
export const SUMMARIZE_TEXT_MESSAGES_GENERATOR = (text: string) => {
  return [
    {
      role: 'system',
      content: 'You are a helpful writing assistant. Summarize the user\'s text naturally and concisely in 60 characters or less. Only provide the summary, not the original text or any reasoning.'
    },
    {
      role: 'user',
      content: `Summarize this text in 60 characters or less:\n\n${text}`
    }
  ]
};

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  mode?: 'predict' | 'summarize';
}

export async function getCompletion(
  text: string,
  apiKey: string,
  options: CompletionOptions = {}
): Promise<string> {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  const { maxTokens = 50, temperature = 0.7, mode = 'predict' } = options;

  const messages = mode === 'predict' ? PREDICT_TEXT_MESSAGES_GENERATOR(text) : SUMMARIZE_TEXT_MESSAGES_GENERATOR(text);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Agenda Journal',
      },
      body: JSON.stringify({
        model: 'HuggingFaceTB/SmolLM3-3B',
        messages: messages,
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('Insufficient credits. Please check your HuggingFace account.');
      }
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || `API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
      return data.choices[0].message.content.trim();
    }

    throw new Error('Unexpected API response format');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get completion');
  }
}

export function getStoredApiKey(): string | null {
  return localStorage.getItem('agenda-ai-api-key');
}

export function setStoredApiKey(apiKey: string): void {
  localStorage.setItem('agenda-ai-api-key', apiKey);
}

export function removeStoredApiKey(): void {
  localStorage.removeItem('agenda-ai-api-key');
}
