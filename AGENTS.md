# GetLoveYVR Repo Notes

Default workflow for this repository:

- After making a requested change, run `npm run build`.
- If the build passes, commit the change with a clear message.
- Push the commit to `main`.
- Wait for the GitHub Pages deployment to finish successfully.
- `npm run build` regenerates `public/sitemap.xml` automatically from the public event schedule. Do not hand-edit the sitemap.
- If a change affects public URLs, event share slugs, or which events are public vs archived, make sure the regenerated sitemap is included in the commit.

Treat this as the default behavior unless the user explicitly asks to skip committing, pushing, or deploying, or says they only want a local change.
