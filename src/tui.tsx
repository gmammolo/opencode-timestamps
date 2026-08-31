/** @jsxImportSource @opentui/solid */
/** @jsxRuntime automatic */
import type { TuiPlugin, TuiPluginApi, TuiPluginMeta } from "@opencode-ai/plugin/tui"
import type { PluginOptions } from "@opencode-ai/plugin"
import { Timeline } from "./components/Timeline"

const DEFAULT_MAX_ROWS = 10

function resolveMaxRows(options: PluginOptions | undefined): number {
  const raw = options?.maxRows
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw)
  }
  return DEFAULT_MAX_ROWS
}

const plugin: TuiPlugin = async (api: TuiPluginApi, options, _meta) => {
  const maxRows = resolveMaxRows(options)
  api.slots.register({
    // Numeric weight used by OpenCode to order sidebar sections. Adjust to taste.
    order: 150,
    slots: {
      sidebar_content: (ctx, props) => (
        <Timeline
          sessionID={props.session_id}
          api={api}
          theme={ctx.theme.current}
          maxRows={maxRows}
        />
      ),
    },
  })
}

const pluginModule: { id: string; tui: TuiPlugin } = {
  id: "opencode-timestamps",
  tui: plugin,
}

export default pluginModule
