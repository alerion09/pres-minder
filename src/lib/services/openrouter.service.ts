import type {
  ChatOptions,
  ChatResponse,
  ChatStructuredOptions,
  ChatStructuredResponse,
  OpenRouterChatRequest,
  OpenRouterChatResponse,
  OpenRouterConfig,
  OpenRouterConfigOverrides,
  ResponseFormat,
} from "./openrouter.types";
import { OpenRouterError, OpenRouterErrorType } from "./openrouter.types";

const DEFAULT_CONFIG: Omit<OpenRouterConfig, "apiKey"> = {
  baseUrl: "https://openrouter.ai/api/v1",
  defaultModel: "openai/gpt-4o-mini",
  defaultParams: {
    temperature: 0.7,
    max_tokens: 10000,
  },
  requestTimeoutMs: 30000,
  retry: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    factor: 2,
  },
};

export class OpenRouterService {
  private readonly config: OpenRouterConfig;

  constructor(config: Partial<OpenRouterConfig> & { apiKey: string }) {
    if (!config.apiKey || typeof config.apiKey !== "string" || config.apiKey.trim() === "") {
      throw new OpenRouterError(
        OpenRouterErrorType.CONFIGURATION,
        "OpenRouter API key is required and must be a non-empty string"
      );
    }

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      retry: {
        ...DEFAULT_CONFIG.retry,
        ...config.retry,
      },
      defaultParams: {
        ...DEFAULT_CONFIG.defaultParams,
        ...config.defaultParams,
      },
    };
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    this.validateChatOptions(options);
    const payload = this.toChatPayload(options);
    const response = await this.request<OpenRouterChatResponse>("/chat/completions", payload);
    return this.parseChatResponse(response);
  }

  async chatStructured<T = unknown>(options: ChatStructuredOptions): Promise<ChatStructuredResponse<T>> {
    this.validateChatOptions(options);
    this.validateResponseFormat(options.response_format);
    const payload = this.toChatPayload(options);
    const response = await this.request<OpenRouterChatResponse>("/chat/completions", payload);
    const chatResponse = this.parseChatResponse(response);
    const structuredData = this.parseStructured<T>(chatResponse.content, options.response_format);

    return {
      ...chatResponse,
      structured_data: structuredData,
    };
  }

  withOverrides(overrides: OpenRouterConfigOverrides): OpenRouterService {
    return new OpenRouterService({
      ...this.config,
      ...overrides,
      retry: {
        ...this.config.retry,
        ...overrides.retry,
      },
      defaultParams: {
        ...this.config.defaultParams,
        ...overrides.defaultParams,
      },
    });
  }

  getDefaultConfig(): Omit<OpenRouterConfig, "apiKey"> & { apiKey: string } {
    return {
      ...this.config,
      apiKey: "***REDACTED***",
    };
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
    };
  }

  private toChatPayload(options: ChatOptions | ChatStructuredOptions): OpenRouterChatRequest {
    const model = options.model || this.config.defaultModel;
    const params = {
      ...this.config.defaultParams,
      ...options.params,
    };

    const payload: OpenRouterChatRequest = {
      model,
      messages: options.messages,
      ...params,
    };

    if ("response_format" in options && options.response_format) {
      payload.response_format = options.response_format;
    }

    return payload;
  }

  private async request<T>(endpoint: string, payload: OpenRouterChatRequest): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    let lastError: OpenRouterError | undefined;

    for (let attempt = 0; attempt < this.config.retry.maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text();
          let errorMessage = `OpenRouter API error: ${response.status} ${response.statusText}`;

          try {
            const errorJson = JSON.parse(errorBody);
            if (errorJson.error?.message) {
              errorMessage = errorJson.error.message;
            }
          } catch {
            // Keep default error message if parsing fails
          }

          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            const retryAfterMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined;

            lastError = new OpenRouterError(
              OpenRouterErrorType.RATE_LIMIT,
              errorMessage,
              response.status,
              retryAfterMs
            );

            if (attempt < this.config.retry.maxAttempts - 1) {
              const delay = retryAfterMs || this.getBackoffDelay(attempt);
              await this.delay(delay);
              continue;
            }
            throw lastError;
          }

          if (response.status >= 500) {
            lastError = new OpenRouterError(OpenRouterErrorType.PROVIDER_ERROR, errorMessage, response.status);

            if (attempt < this.config.retry.maxAttempts - 1) {
              await this.delay(this.getBackoffDelay(attempt));
              continue;
            }
            throw lastError;
          }

          throw new OpenRouterError(OpenRouterErrorType.UNKNOWN, errorMessage, response.status);
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof OpenRouterError) {
          throw error;
        }

        if ((error as Error).name === "AbortError") {
          lastError = new OpenRouterError(
            OpenRouterErrorType.TIMEOUT,
            `Request timeout after ${this.config.requestTimeoutMs}ms`,
            undefined,
            undefined,
            error
          );

          if (attempt < this.config.retry.maxAttempts - 1) {
            await this.delay(this.getBackoffDelay(attempt));
            continue;
          }
          throw lastError;
        }

        lastError = new OpenRouterError(
          OpenRouterErrorType.NETWORK,
          `Network error: ${(error as Error).message}`,
          undefined,
          undefined,
          error
        );

        if (attempt < this.config.retry.maxAttempts - 1) {
          await this.delay(this.getBackoffDelay(attempt));
          continue;
        }
        throw lastError;
      }
    }

    throw lastError || new OpenRouterError(OpenRouterErrorType.UNKNOWN, "Request failed after all retries");
  }

  private getBackoffDelay(attempt: number): number {
    return this.config.retry.baseDelayMs * Math.pow(this.config.retry.factor, attempt);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private parseChatResponse(response: OpenRouterChatResponse): ChatResponse {
    if (!response.choices || response.choices.length === 0) {
      throw new OpenRouterError(OpenRouterErrorType.PROVIDER_ERROR, "OpenRouter response has no choices");
    }

    const choice = response.choices[0];
    if (!choice.message || !choice.message.content) {
      throw new OpenRouterError(
        OpenRouterErrorType.PROVIDER_ERROR,
        "OpenRouter response choice has no message content"
      );
    }

    return {
      content: choice.message.content,
      model: response.model,
      usage: response.usage,
    };
  }

  private parseStructured<T>(content: string, responseFormat: ResponseFormat): T {
    let parsed: unknown;

    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new OpenRouterError(
        OpenRouterErrorType.VALIDATION,
        `Failed to parse structured response as JSON: ${(error as Error).message}`,
        undefined,
        undefined,
        error
      );
    }

    if (!parsed || typeof parsed !== "object") {
      throw new OpenRouterError(OpenRouterErrorType.VALIDATION, "Structured response is not a valid JSON object");
    }

    return parsed as T;
  }

  private validateChatOptions(options: ChatOptions): void {
    if (!options.messages || !Array.isArray(options.messages) || options.messages.length === 0) {
      throw new OpenRouterError(OpenRouterErrorType.INVALID_INPUT, "Messages array is required and must not be empty");
    }

    for (const [index, message] of options.messages.entries()) {
      if (!message.role || !["system", "user", "assistant"].includes(message.role)) {
        throw new OpenRouterError(
          OpenRouterErrorType.INVALID_INPUT,
          `Invalid role at message ${index}: must be 'system', 'user', or 'assistant'`
        );
      }

      if (!message.content || typeof message.content !== "string" || message.content.trim() === "") {
        throw new OpenRouterError(
          OpenRouterErrorType.INVALID_INPUT,
          `Invalid content at message ${index}: must be a non-empty string`
        );
      }
    }
  }

  private validateResponseFormat(responseFormat: ResponseFormat): void {
    if (!responseFormat) {
      throw new OpenRouterError(OpenRouterErrorType.INVALID_INPUT, "response_format is required");
    }

    if (responseFormat.type !== "json_schema") {
      throw new OpenRouterError(OpenRouterErrorType.INVALID_INPUT, "response_format.type must be 'json_schema'");
    }

    if (!responseFormat.json_schema) {
      throw new OpenRouterError(OpenRouterErrorType.INVALID_INPUT, "response_format.json_schema is required");
    }

    if (!responseFormat.json_schema.name || typeof responseFormat.json_schema.name !== "string") {
      throw new OpenRouterError(
        OpenRouterErrorType.INVALID_INPUT,
        "response_format.json_schema.name is required and must be a string"
      );
    }

    if (!responseFormat.json_schema.schema) {
      throw new OpenRouterError(OpenRouterErrorType.INVALID_INPUT, "response_format.json_schema.schema is required");
    }
  }
}

export function createOpenRouterService(): OpenRouterService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new OpenRouterError(OpenRouterErrorType.CONFIGURATION, "OPENROUTER_API_KEY environment variable is not set");
  }

  return new OpenRouterService({ apiKey });
}
