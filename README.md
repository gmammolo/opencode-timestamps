# opencode-timestamps

> OpenCode TUI plugin: a live sidebar timeline showing **when each operation started** — user message, thinking, response, or tool call.

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)

## Why

When you scan back through a long session, OpenCode doesn't tell you *when* a message, a thinking block, a response, or a tool call started. This plugin adds a **timestamps** section in the session sidebar that lists every operation with its start time (`HH:MM:SS`), updating live as the conversation streams.

```
▼ Timestamps
  10:41:37  ✎ response   Done — 3 files changed.
  10:41:31  🔧 tool      Edit
  10:41:28  ✎ response   Here's the pagination PR…
  10:41:15  🧠 thinking  thinking
  10:41:12  ✉ user       add pagination to the table
```

Each operation type maps to a phase of the message-writing process:

| Kind       | Source                                                       |
| ---------- | ------------------------------------------------------------ |
| ✉ `user`      | the user's message (`info.time.created`)                       |
| 🧠 `thinking` | a reasoning/thinking block (`part.time.start`)                  |
| ✎ `response`  | a response text part (`part.time.start`)                       |
| 🔧 `tool`     | a tool call (`part.state.time.start`)                          |

> All timestamps are already stored by OpenCode on the message/part schema, so **past sessions are timestamped too** — nothing needs to be recorded live.

## Install

This plugin is **TUI-only** and installs directly from [GitHub](https://github.com/gmammolo/opencode-timestamps) — no npm package required.

### From GitHub (recommended)

Add the plugin to the `plugin` list of your TUI config (`~/.config/opencode/tui.json`) using the `github:` specifier:

```json
{
  "plugin": [
    ["github:gmammolo/opencode-timestamps", { "maxRows": 10 }]
  ]
}
```

Options can be omitted to use defaults:

```json
{
  "plugin": [
    "github:gmammolo/opencode-timestamps"
  ]
}
```

Restart OpenCode. On first launch OpenCode clones the repository and caches it under `~/.cache/opencode/packages/`.

### Local checkout (dev)

```bash
git clone https://github.com/gmammolo/opencode-timestamps.git
cd opencode-timestamps
npm install
```

Point OpenCode at the local folder instead of the GitHub repo:

```json
{
  "plugin": [
    ["file:/path/to/opencode-timestamps", { "maxRows": 10 }]
  ]
}
```

## Usage

- The `Timestamps` sidebar section is **collapsed by default** — click its header to expand/collapse it.
- Rows are listed **newest first** and capped at the latest `maxRows` operations (default `10`).
- The list updates live while the session streams (message/part events).

## Configuration

Options are passed as a `[plugin, options]` tuple in your TUI config (`~/.config/opencode/tui.json`):

```json
{
  "plugin": [
    ["github:gmammolo/opencode-timestamps", { "maxRows": 10 }]
  ]
}
```

| Option    | Type   | Default | Description                                      |
| --------- | ------ | ------- | ------------------------------------------------ |
| `maxRows` | number | `10`    | How many of the most recent operations to show.  |

Restart OpenCode after changing the config.

## Updating

The GitHub clone is cached and is **not** re-fetched automatically. After pushing changes to the repo, clear the cache and restart OpenCode:

```bash
rm -rf ~/.cache/opencode/packages/github:gmammolo/opencode-timestamps
```

## How it works

- TUI-only plugin: `exports["./tui"]` points at raw `src/tui.tsx`, which OpenCode compiles through its Bun preload (no build step needed).
- Registers the `sidebar_content` slot for the active session.
- Reads `api.state.session.messages(sessionID)` + `api.state.part(messageID)` and subscribes to `message.part.updated` / `message.updated` for live re-renders.

## Development

```bash
npm install
npm run typecheck
```

## License

MIT — see [LICENSE](LICENSE).
