/** @jsxImportSource @opentui/solid */
/** @jsxRuntime automatic */
import { createMemo, createSignal, onCleanup, For, Show } from "solid-js"
import type { BoxRenderable, RGBA } from "@opentui/core"
import type { TuiPluginApi, TuiThemeCurrent } from "@opencode-ai/plugin/tui"
import type { EventMessagePartUpdated, EventMessageUpdated } from "@opencode-ai/sdk/v2"
import { buildTimeline, formatClock, type TimelineEntry } from "../timeline"

interface TimelineProps {
  sessionID: string
  api: TuiPluginApi
  theme: TuiThemeCurrent
  maxRows: number
}

/** Theme color per operation kind. */
function kindColor(kind: TimelineEntry["kind"], theme: TuiThemeCurrent): RGBA {
  switch (kind) {
    case "user":
      return theme.accent
    case "thinking":
      return theme.textMuted
    case "response":
      return theme.text
    case "tool":
      return theme.info
  }
}

const KIND_ICON: Record<TimelineEntry["kind"], string> = {
  user: "✉",
  thinking: "🧠",
  response: "✎",
  tool: "🔧",
}

export function Timeline(props: TimelineProps) {
  const [collapsed, setCollapsed] = createSignal(true)
  const [tick, setTick] = createSignal(0)

  // Recompute the timeline whenever `tick` changes (driven by events).
  // `createMemo` makes the recompute lazy: it only runs when the sidebar
  // actually re-renders, so idle sessions cost nothing.
  const ops = createMemo<TimelineEntry[]>(() => {
    tick()
    return buildTimeline(
      props.api.state.session.messages(props.sessionID),
      (id) => props.api.state.part(id),
    )
  })
  // Newest first: take the last `maxRows` ops and reverse.
  const visibleOps = () => ops().slice(-props.maxRows).reverse()

  const bump = () => {
    setTick((t) => t + 1)
    props.api.renderer.requestRender()
  }
  const onPartEvent = (e: EventMessagePartUpdated) => {
    if (e.properties.sessionID === props.sessionID) bump()
  }
  const onMsgEvent = (e: EventMessageUpdated) => {
    if (e.properties.sessionID === props.sessionID) bump()
  }

  const unsubPart = props.api.event.on("message.part.updated", onPartEvent)
  const unsubMsg = props.api.event.on("message.updated", onMsgEvent)
  onCleanup(() => {
    unsubPart()
    unsubMsg()
  })

  const toggleCollapsed = () => {
    setCollapsed((c) => !c)
    props.api.renderer.requestRender()
  }
  const attachToggle = (node: BoxRenderable) => {
    node.onMouseDown = toggleCollapsed
  }

  return (
    <box width="100%" flexDirection="column">
      <box width="100%" flexDirection="row" alignItems="center" ref={attachToggle}>
        <text fg={props.theme.text}>
          <b>{collapsed() ? "▶ " : "▼ "}Timestamps</b>
        </text>
      </box>

      <Show when={!collapsed()}>
        <box width="100%" flexDirection="column" marginTop={1}>
          <Show
            when={visibleOps().length > 0}
            fallback={<text fg={props.theme.textMuted}>No activity yet</text>}
          >
            <For each={visibleOps()}>
              {(op) => (
                <box width="100%" flexDirection="row">
                  <text fg={kindColor(op.kind, props.theme)}>{formatClock(op.start)}</text>
                  <text fg={props.theme.textMuted}>  {KIND_ICON[op.kind]} {op.kind}</text>
                  <Show when={op.label}>
                    <text fg={props.theme.text}> {op.label}</text>
                  </Show>
                </box>
              )}
            </For>
          </Show>
        </box>
      </Show>
    </box>
  )
}
