import { appendAuditEvents, auditEventsFromEslintResults } from "./audit.mjs";

export default function formatAuditResults(results, context = {}) {
  const repoRoot = context.cwd ?? process.cwd();
  const events = auditEventsFromEslintResults({ repoRoot, results });
  appendAuditEvents(repoRoot, events);
  const analysisFailure = events.find((event) => event.event_type === "analysis_failed");
  if (analysisFailure) {
    return `Anti-Slop audit analysis failed: ${analysisFailure.summary.replace(/^Anti-Slop analysis failed:\s*/, "")}\n`;
  }
  return `Anti-Slop audit events: ${events.length}\n`;
}
