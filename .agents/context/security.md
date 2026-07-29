---
id: eslint-plugin-anti-slop.security
last_reviewed: 2026-07-28
---

# Security constraints

- Never commit credentials, private keys, token literals, exploit details, or
  raw private repository evidence.
- Keep configured baseline and audit output paths inside the repository root;
  reject symlink escapes.
- Tests and checks may read local fixtures but must not publish, deploy, push,
  or mutate a user's primary checkout.
- Network is limited to approved package registries and explicit release or
  published-consumer workflows.
- `dependency:security:required` remains a blocking gate. Unavailable registry
  evidence is not a pass and must be reported as unavailable.
