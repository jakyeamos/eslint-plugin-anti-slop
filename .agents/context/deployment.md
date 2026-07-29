---
id: eslint-plugin-anti-slop.deployment
last_reviewed: 2026-07-28
---

# Packaging, deployment, and rollback

- `pnpm pack --dry-run` is the local package-surface check.
- Release tags must match `package.json` and resolve to commits reachable from
  `main` before publishing.
- Publishing uses the repository's protected release workflow and requires
  explicit human approval; normal tests never publish or deploy.
- Rollback is a package-version or release-channel decision. Do not rewrite
  history; publish a corrective patch or withdraw the affected release through
  the repository's approved process.
- Keep the previous published package and changelog entry available as the
  recovery reference.
