<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Keep predicate data access in the read-only adapter using only the existing research RPCs, a single metadata read, and a batched product-code read; this prevents per-device request loops and schema coupling.
- Cache chain promises by normalized subject set and generation limit for the browser session; this avoids repeated ancestry requests without persistent storage.
- Keep tree rendering lazy and exports inside user actions; this isolates browser visualization and download libraries from server rendering.
- Keep ancestry calculations in pure helpers with concrete tests; this protects generation, confidence and reachability semantics across views and exports.
- Escape raw NUL separators in streamed HTML responses; HTML parsing otherwise corrupts serialized route IDs and prevents hydration.

- Share navigation and release metadata in the root shell, with separate reviewer routes and a lazy evidence workspace; this keeps evidence requests out of the default brief.
- Keep reviewer payload types and parsing/filter helpers in browser-safe modules, and import PDF/Excel generators only inside download actions; this preserves SSR safety and testable rules.
