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

- Keep viewport entrance animations in the shared MotionLayout with CSS motion tokens; this preserves visible SSR content and respects reduced-motion preferences without new animation dependencies.
- Generate wedding copy through authenticated server functions that verify wedding ownership before calling the AI Gateway SDK; explicit draft approval prevents AI from silently replacing saved copy.
- Store couple edits in owner-only wedding drafts and publish them atomically; payment approvals and refunds must verify wedding ownership and Razorpay state before privileged writes.
- Derive static sitemap paths from required route decisions and paginate published weddings with session-free public access; omit lastmod without a page-specific content timestamp so private drafts and invented dates never enter search.
- Payout requests are owner-verified, bank details are server-encrypted, and one active request per contribution is reserved atomically; only independently verified transfers may populate settlement dates, never guest-payment confirmations.
