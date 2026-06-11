import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// ─────────────────────────────────────────────────────────────
// Client
// ─────────────────────────────────────────────────────────────

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_to_bypass_build_error',
});

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const CHAT_MODEL = 'gpt-4o-mini';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** Options for the chatCompletion function. */
export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/** Result from a chat completion call. */
export interface ChatCompletionResult {
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// ─────────────────────────────────────────────────────────────
// Embeddings
// ─────────────────────────────────────────────────────────────

/**
 * Generates a single embedding vector for the given text
 * using OpenAI's text-embedding-3-small model (1536 dimensions).
 *
 * @param text - The text to generate an embedding for
 * @returns A 1536-dimensional embedding vector
 * @throws Error if the API call fails or returns empty data
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('Empty embedding response received');
    }

    return response.data[0].embedding;
  } catch (error) {
    throw new Error(
      `Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generates embedding vectors for multiple texts in a single batch request
 * using OpenAI's text-embedding-3-small model (1536 dimensions).
 *
 * @param texts - An array of texts to generate embeddings for
 * @returns An array of 1536-dimensional embedding vectors, one per input text
 * @throws Error if the API call fails or the input array is empty
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    // Sort by index to ensure correct ordering
    const sorted = response.data.sort((a, b) => a.index - b.index);
    return sorted.map((item) => item.embedding);
  } catch (error) {
    throw new Error(
      `Batch embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Chat Completion
// ─────────────────────────────────────────────────────────────

/**
 * General-purpose chat completion using gpt-4o-mini (or specified model).
 * Suitable for classification, summarization, extraction, and other
 * text-processing tasks.
 *
 * @param messages - Array of chat messages following OpenAI's message format
 * @param options - Optional configuration for model, temperature, etc.
 * @returns The generated response content and token usage statistics
 * @throws Error if the API call fails or returns no content
 */
export async function chatCompletion(
  messages: ChatCompletionMessageParam[],
  options: ChatCompletionOptions = {}
): Promise<ChatCompletionResult> {
  try {
    const response = await openai.chat.completions.create({
      model: options.model ?? CHAT_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      top_p: options.topP ?? 1,
      frequency_penalty: options.frequencyPenalty ?? 0,
      presence_penalty: options.presencePenalty ?? 0,
    });

    const choice = response.choices[0];
    if (!choice || !choice.message.content) {
      throw new Error('No content in chat completion response');
    }

    return {
      content: choice.message.content,
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
    };
  } catch (error) {
    throw new Error(
      `Chat completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
