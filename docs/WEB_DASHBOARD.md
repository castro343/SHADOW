# SHADOW web dashboard

The public website lives in `public/` and is deployed as a separate Render static site. It is a project landing page and setup guide, not an authenticated bot control plane.

## Security boundary

The static site has no access to MongoDB, WhatsApp session state, pairing tokens, owner credentials, or private runtime environment variables. It does not claim to show live connection health. Do not add public pairing or administrative actions without a separate authenticated backend and a security review.

## Render

The root `render.yaml` defines two resources: `shadow-bot` (Docker background worker) and `shadow-dashboard` (static site). Secrets are never committed; MongoDB URI and owner number are supplied privately in Render.
