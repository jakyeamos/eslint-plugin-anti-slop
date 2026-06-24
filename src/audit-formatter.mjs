import { appendAuditEvents, auditEventsFromEslintResults } from "./audit.mjs";

export default function formatAuditResults(results, context = {}) {
  const repoRoot = context.cwd ?? process.cwd();
  const events = auditEventsFromEslintResults({ repoRoot, results });
  appendAuditEvents(repoRoot, events);
  return `Anti-Slop audit events: ${events.length}\n`;
}
