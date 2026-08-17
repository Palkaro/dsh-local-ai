/**
 * Serialize harness messages and requests into the Ollama `/api/chat` wire
 * vocabulary. User text is joined; assistant text becomes `content` and tool
 * calls become `tool_calls` (with arguments parsed from the raw JSON string to
 * the object Ollama expects); tool results become separate `tool` messages.
 * Core image blocks are rejected explicitly because this route is text-only;
 * unknown declaration-merged block types retain the documented extension
 * fallback (ignored for content, retained as text where text is expected).
 * @module dsh-local-ai/serialize
 */

import { contentHasImage, LlmError } from '@deepseek-ai/dsh-llm'
import type { ContentBlock, GenerateOptions, Message, ToolSchema } from '@deepseek-ai/dsh-llm'
import type { ResolvedConfig } from './config.ts'

/** One Ollama chat message on the wire. */
export interface OllamaWireMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: Array<{ function: { name: string; arguments: Record<string, unknown> } }>
  tool_name?: string
}

/** The Ollama `/api/chat` request body. */
export interface OllamaWireRequest {
  model: string
  messages: OllamaWireMessage[]
  stream: boolean
  options?: Record<string, unknown>
  tools?: Array<{ type: 'function'; function: ToolSchema }>
}

/** Join the text blocks of a message (used for user/tool-result content). */
function flattenText(blocks: readonly ContentBlock[]): string {
  return blocks
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
}

/** Reject core image content before any text-flattening path can silently erase it. */
function assertTextOnly(blocks: readonly ContentBlock[]): void {
  if (contentHasImage(blocks)) {
    throw new LlmError('The Ollama adapter does not support image content.', 'UNSUPPORTED_CONTENT')
  }
}

/**
 * Parse a tool-call argument string into the object Ollama expects. The raw
 * string is guaranteed by the harness contract to be JSON; a malformed value
 * from a hand-built call degrades to a single `value` field rather than
 * bricking the whole session.
 * @param raw - the raw JSON string produced by the model.
 * @returns the parsed object, or a `{ value }` fallback.
 */
export function parseToolArguments(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return { value: raw }
  } catch {
    return { value: raw }
  }
}

/** Serialize one assistant message (text + tool calls). */
function serializeAssistant(message: Message): OllamaWireMessage {
  const text = flattenText(message.content)
  const toolCalls = message.content
    .filter(block => block.type === 'tool-call')
    .map(block => ({
      function: { name: block.name, arguments: parseToolArguments(block.arguments) },
    }))

  return {
    role: 'assistant',
    content: text,
    ...toolCalls.length > 0 ? { tool_calls: toolCalls } : {},
  }
}

/** Resolve a tool-result block's name from the assistant tool calls that precede it. */
function toolNameOf(callId: string, namesByCallId: ReadonlyMap<string, string>): string | undefined {
  return namesByCallId.get(callId)
}

/**
 * Serialize the conversation. `tool-result` blocks become standalone
 * `{role: 'tool'}` messages; the harness puts each tool result in its own
 * user-role message, so a mixed user message contributes its text first and
 * its tool results as separate wire messages after. Assistant tool calls are
 * indexed first so their results can carry the tool name Ollama needs.
 * @param messages - the harness conversation, in order.
 * @returns the wire messages; order preserved, each tool result expanded into its own entry.
 */
export function serializeMessages(messages: Message[]): OllamaWireMessage[] {
  const namesByCallId = new Map<string, string>()
  for (const message of messages) {
    if (message.role !== 'assistant') continue
    for (const block of message.content) {
      if (block.type === 'tool-call') namesByCallId.set(String(block.id), block.name)
    }
  }

  const wire: OllamaWireMessage[] = []
  for (const message of messages) {
    assertTextOnly(message.content)
    if (message.role === 'system') {
      wire.push({ role: 'system', content: flattenText(message.content) })
      continue
    }
    if (message.role === 'assistant') {
      wire.push(serializeAssistant(message))
      continue
    }
    // user role: tool results ride in user messages in the harness
    // vocabulary, but Ollama wants them as role:'tool' messages.
    const toolResults = message.content.filter(block => block.type === 'tool-result')
    const text = flattenText(message.content)
    if (text.length > 0 || toolResults.length === 0) {
      wire.push({ role: 'user', content: text })
    }
    for (const result of toolResults) {
      const name = toolNameOf(String(result.toolCallId), namesByCallId)
      wire.push({
        role: 'tool',
        // Empty tool output still needs SOME content on the wire.
        content: flattenText(result.content) || '(no output)',
        ...name === undefined ? {} : { tool_name: name },
      })
    }
  }
  return wire
}

/**
 * Build the full wire request. Always streaming (`stream: true`); optional
 * fields are omitted rather than sent as null, so Ollama defaults apply.
 * `temperature` resolves request → model mapping → plugin default; `num_predict`
 * is the harness-materialized `maxTokens`.
 * @param options - the harness request (model, history, system, tools, sampling).
 * @param resolved - the resolved plugin config.
 * @returns the `/api/chat` request body.
 */
export function serializeRequest(
  options: GenerateOptions,
  resolved: ResolvedConfig,
): OllamaWireRequest {
  const mapping = resolved.models.find(entry => entry.name === options.model)
  const model = mapping?.model ?? options.model

  const messages: OllamaWireMessage[] = []
  if (options.system !== undefined) {
    messages.push({ role: 'system', content: options.system })
  }
  messages.push(...serializeMessages(options.messages))

  const temperature = options.temperature ?? mapping?.temperature ?? resolved.temperature
  const ollamaOptions: Record<string, unknown> = {}
  if (temperature !== undefined) ollamaOptions.temperature = temperature
  if (options.maxTokens !== undefined) ollamaOptions.num_predict = options.maxTokens
  if (options.stop !== undefined && options.stop.length > 0) ollamaOptions.stop = options.stop

  const tools = options.tools?.map(tool => ({
    type: 'function' as const,
    function: tool,
  }))

  return {
    model,
    messages,
    stream: true,
    ...Object.keys(ollamaOptions).length > 0 ? { options: ollamaOptions } : {},
    ...tools !== undefined && tools.length > 0 ? { tools } : {},
  }
}
