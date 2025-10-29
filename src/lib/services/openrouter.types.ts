export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ModelParams {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface JsonSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchema;
  };
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  factor: number;
}

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  defaultParams: ModelParams;
  requestTimeoutMs: number;
  retry: RetryConfig;
}

export type OpenRouterConfigOverrides = Partial<OpenRouterConfig>;

export interface ChatOptions {
  messages: ChatMessage[];
  model?: string;
  params?: ModelParams;
}

export interface ChatStructuredOptions extends ChatOptions {
  response_format: ResponseFormat;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage: TokenUsage;
}

export interface ChatStructuredResponse<T = unknown> extends ChatResponse {
  structured_data: T;
}

export interface OpenRouterChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
}

export interface OpenRouterChoice {
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface OpenRouterChatResponse {
  id: string;
  model: string;
  choices: OpenRouterChoice[];
  usage: TokenUsage;
  created: number;
}

export enum OpenRouterErrorType {
  CONFIGURATION = "CONFIGURATION",
  TIMEOUT = "TIMEOUT",
  RATE_LIMIT = "RATE_LIMIT",
  PROVIDER_ERROR = "PROVIDER_ERROR",
  VALIDATION = "VALIDATION",
  INVALID_INPUT = "INVALID_INPUT",
  NETWORK = "NETWORK",
  UNKNOWN = "UNKNOWN",
}

export class OpenRouterError extends Error {
  constructor(
    public type: OpenRouterErrorType,
    message: string,
    public statusCode?: number,
    public retryAfter?: number,
    public cause?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}
