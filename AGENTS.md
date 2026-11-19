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

- Keep the single shareable brief route and release metadata in the root shell, with footer methodology and a lazy evidence workspace; this keeps evidence requests out of the default brief.
- Keep reviewer payload types and parsing/filter helpers in browser-safe modules, and import PDF/Excel generators only inside download actions; this preserves SSR safety and testable rules.
- Reuse the exact logo source for the on-page mark and browser PDF rasterization; this keeps branding consistent without server-side rendering libraries.
- Keep inline brand artwork and export SVG sourced from shared SVG contents; this prevents header, icons and PDFs from drifting.
- Read vendor coverage once through a cached count and ordered year bounds; this avoids capped table reads and keeps existing research calls unchanged.
- Keep vendor and payment reads in the existing read-only adapter; load portfolios on opening and selected-device reads only on explicit benchmarking to avoid request loops.
- Render only explicitly selected aggregate fields in vendor/payment views and exports; never enumerate raw payload fields, preserving recipient privacy.
- Keep vendor, ownership and comparison state on the single index route; isolate chart imports behind lazy client rendering and downloads inside user actions.
- Render result-page decision briefs from the signal RPCs through shared decision components, with evidence sections addressed by stable ids and the view kept in the URL; print-only brief markup plus print CSS produces the PDF so no export library is needed for briefs.
- Stress-test result pages by intercepting read-only RPC responses in browser checks, never through shipped fixtures or adapter overrides; this keeps synthetic research data out of published pages.
- Keep interaction motion in shared CSS, suppress movement for reduced motion and keyboard actions, and leave evidence contents lazy; this preserves fast, accessible controls without extra evidence requests.
- Load recall history only inside opened evidence sections through the read-only adapter, with ownership-dependent vendor reads and a lazy chart; this keeps default briefs free of recall requests.
- When a deployed signal RPC omits recalls, append the existing recall-card RPC result verbatim only if missing; this supports older deployments without inventing wording or duplicating cards.
- Compose reference chapters, glance tiles and rails from signal card short/figs fields and shared evidence elements; this preserves source wording, lazy reads and print payloads.
- Dock one shared keyboard-search control into the root header through a client portal and keep mode/view selection in the existing URL; this preserves a single search field and SSR-safe navigation.
- Derive sitemap paths from explicit route staticData.sitemap decisions and share the public origin with page metadata; this keeps discoverable URLs aligned without research queries.
- Keep procedure reads in the read-only adapter (pc_procedure_list, pc_procedure, pc_device_procedures, pc_vendor_procedures); worksheet inputs stay in component state and are never stored or sent.
- Keep procedure pages as un-nested leaf routes with shared evidence and worksheet components; this preserves the existing root shell and isolates private worksheet inputs from route data.
- Load benchmark procedure links only when their evidence section opens, cache by subject and ownership mode, and keep them out of cards and exports; this preserves lazy research and existing briefs.
- Benchmark a vendor always shows the parent company: resolve v with pc_vendor_resolve, redirect with from=, and call vendor RPCs with m='current'.
