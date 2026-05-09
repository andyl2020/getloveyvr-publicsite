# GetLoveYVR Repo Notes

Default workflow for this repository:

- After making a requested change, run `npm run build`.
- If the build passes, commit the change with a clear message.
- Push the commit to `main`.
- Wait for the GitHub Pages deployment to finish successfully.
- `npm run build` regenerates `public/sitemap.xml` automatically from the public event schedule. Do not hand-edit the sitemap.
- If a change affects public URLs, event share slugs, or which events are public vs archived, make sure the regenerated sitemap is included in the commit.
- If a change updates the public event schedule or any event date, run `npm run schedule:sync` before the final build so the live dashboard schedule and sitemap stay aligned.
- Date moves keep the same event binding. Preserve the existing event `id`, `seriesType`, `seriesNumber`, `shareSlug`, and event type when moving an event to a new date.
- Dashboard tasks, output state, and ownership stay with the bound event type/id by default. Do not move task state for date-only changes.
- Only use `npm run dashboard:move-state -- --source <id> --target <id>` when intentionally rebinding work from one event type/id to another. Never use it for simple date changes.

Treat this as the default behavior unless the user explicitly asks to skip committing, pushing, or deploying, or says they only want a local change.
