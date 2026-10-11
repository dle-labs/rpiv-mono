# DLE Labs RPIV

This Git-installable Pi package is named `@dle-labs/rpiv`. Its root manifest loads **only** `packages/rpiv-ask-user-question/index.ts`. The rest of the upstream monorepo is retained for development and attribution, not automatically enabled in Pi. In particular, RPIV Voice is unchanged and must not be removed when replacing only the questionnaire.

## Changes

- Applies the opt-in RPIV 2.12.0 questionnaire adapter from [dle-labs/herdr-web-ui](https://github.com/dle-labs/herdr-web-ui/tree/12e8d08d89d8ad4797675f2e291f1c61324fdfe1/integrations/rpiv).
- Includes its standalone runtime publisher as `packages/rpiv-ask-user-question/herdr-bridge.ts`, including in the questionnaire's package file manifest.
- Uses one shutdown listener per extension registration; completed questionnaires release their bridge. Hosts without session-file information retain normal terminal behavior without publishing actionable state.
- Keeps upstream package names, configuration keys, tool names, and MIT attribution intact. The installed root package and Git source identify the DLE Labs fork without breaking internal workspace imports.

## Install

Use the matching fork WebUI backend on the same Linux machine. The adapter was verified against Pi 1.1.0. It is experimental; unsupported states stay terminal-only.

1. Finish active tools and stop the Pi sessions you intend to change. Back up `~/.pi/agent/settings.json` privately.
2. Review the diff and install this repository at a reviewed commit:

   ```sh
   pi install git:github.com/dle-labs/rpiv-mono@<reviewed-commit>
   ```

   For a development checkout instead, install dependencies with `npm ci --ignore-scripts --legacy-peer-deps`, then use `pi install /absolute/path/to/dle-labs--rpiv-mono`.
3. Before starting/reloading Pi, remove the `npm:@juicesharp/rpiv-ask-user-question` declaration from the `packages` array in your Pi settings. Leave its on-disk package intact for rollback, and preserve unrelated package declarations. Never enable both sources of `ask_user_question` simultaneously.
4. Start Pi, or use `/reload` only when no tool call is active. Confirm `pi list` shows the DLE Labs Git source or checkout instead of the upstream questionnaire source.
5. Try a fictional questionnaire in a disposable session before relying on it. Existing sessions do not load the adapter until restarted or reloaded.

Do not publish this root package to npm. It is intentionally private and installed from Git or a reviewed local checkout.

## What the adapter permits

The adapter publishes private, short-lived snapshots bound to the real session, process, active question, cursor, checked options, and proven live key mappings. The WebUI still sends normal herdr keys/text and verifies every transition. It does not invoke private extension callbacks or infer safe keys from footer text.

Single choices, multi-select (including empty selection), and one-line custom replies are supported. Notes, final multi-question review/submission, hidden or unfocused overlays, external editors, and unsupported bindings remain terminal-only. Never answer simultaneously from multiple clients.

Snapshots may contain question and custom-draft text. They live alongside session files in a private `.herdr-rpiv` directory (0700; files 0600), expire after 1.5 seconds, and are invalidated on close/shutdown. A crash can leave an expired private snapshot; it does not authorize input.

## Verification

```sh
npm ci --ignore-scripts --legacy-peer-deps
npm test -- packages/rpiv-ask-user-question
npx tsc --noEmit -p tsconfig.base.json
```

The matching WebUI checkout also provides `bun integrations/rpiv/verify-copy.ts /absolute/path/to/this/checkout/packages/rpiv-ask-user-question` to exercise the real patched controller/router/reducer, live remapping, and advancement to the terminal-only review screen without submitting.

## Rollback

After active tools finish, replace the DLE Labs package declaration with the original `npm:@juicesharp/rpiv-ask-user-question` declaration and reload/restart Pi. Do not restore an old settings backup wholesale if other settings have changed since installation. No WebUI configuration or voice configuration needs changing.
