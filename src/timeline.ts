/**
 * Pure logic for building a per-operation timeline from OpenCode session data.
 *
 * Each "operation" maps to the start of a message-writing phase:
 *   - a user message
 *   - a thinking / reasoning block
 *   - a response text part
 *   - a tool call
 *
 * All start timestamps are already stored by OpenCode on the message/part
 * schema (`info.time.created`, `part.time.start`, `part.state.time.start`),
 * so nothing has to be recorded at stream time — past sessions work too.
 */
import type { Message, Part } from "@opencode-ai/sdk/v2"

export type OperationKind = "user" | "thinking" | "response" | "tool"

export interface TimelineEntry {
  kind: OperationKind
  /** Start of the operation, unix milliseconds. */
  start: number
  /** Short human label (message text, tool name, …). */
  label: string
  messageID: string
  partID?: string
}

/** Format a unix-ms timestamp as local `HH:MM:SS`. */
export function formatClock(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function truncate(text: string, max = 40): string {
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

/** The user message's prompt text, pulled from its text parts. */
function userLabel(parts: readonly Part[]): string {
  const textPart = parts.find((p): p is Extract<Part, { type: "text" }> => p.type === "text")
  return textPart?.text ? truncate(textPart.text) : "user message"
}

/** Operations for an assistant message, from its parts. */
function assistantOperations(
  msg: Extract<Message, { role: "assistant" }>,
  parts: readonly Part[],
): TimelineEntry[] {
  const fallback = msg.time.created
  const ops: TimelineEntry[] = []

  for (const part of parts) {
    if (part.type === "reasoning") {
      ops.push({
        kind: "thinking",
        start: part.time?.start ?? fallback,
        label: "thinking",
        messageID: msg.id,
        partID: part.id,
      })
    } else if (part.type === "text") {
      ops.push({
        kind: "response",
        start: part.time?.start ?? fallback,
        label: truncate(part.text),
        messageID: msg.id,
        partID: part.id,
      })
    } else if (part.type === "tool") {
      const start = part.state.status === "pending" ? fallback : part.state.time?.start ?? fallback
      ops.push({
        kind: "tool",
        start,
        label: part.tool,
        messageID: msg.id,
        partID: part.id,
      })
    }
  }

  return ops
}

/**
 * Build a chronologically sorted timeline from a session's messages.
 *
 * @param messages  messages of the session (`api.state.session.messages(id)`)
 * @param getParts  per-message part loader (`api.state.part(id)`)
 */
export function buildTimeline(
  messages: readonly Message[],
  getParts: (messageID: string) => readonly Part[],
): TimelineEntry[] {
  const ops: TimelineEntry[] = []

  for (const msg of messages) {
    const parts = getParts(msg.id)
    if (msg.role === "user") {
      ops.push({ kind: "user", start: msg.time.created, label: userLabel(parts), messageID: msg.id })
    } else {
      ops.push(...assistantOperations(msg, parts))
    }
  }

  return ops.sort((a, b) => a.start - b.start)
}
