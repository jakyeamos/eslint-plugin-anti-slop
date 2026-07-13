import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { metadataForCatalogRule } from "./internal/rules/catalog.mjs";

const SECRET_RE =
  /\b(api[_-]?key|secret|token|password|private[_-]?key|client[_-]?secret)\b\s*[:=]\s*['"][^'"\s]{8,}['"]/gi;

export function redactSecrets(text) {
  return String(text).replace(SECRET_RE, (_match, key) => `${key} = "[REDACTED]"`);
}

export function dedupeFingerprint(gate, ruleId, files, failurePattern) {
  const payload = [
    gate.trim().toLowerCase(),
    ruleId.trim().toLowerCase(),
    ...files.map((file) => file.trim().toLowerCase()).sort(),
    failurePattern.trim().toLowerCase(),
  ].join("\n");
  return createHash("sha256").update(payload).digest("hex").slice(0, 24);
}

export function antiSlopPattern(ruleId) {
  const normalized = ruleId.replace("anti-slop/", "").replaceAll("-", " ");
  return `anti-slop ${normalized}`;
}

export function normalizeAntiSlopFindings({ repoRoot, results }) {
  const findings = [];

  for (const result of results) {
    const file = result.filePath ? relative(repoRoot, result.filePath) : "<unknown>";
    const sourceLines = sourceLinesForResult(result);
    for (const message of result.messages ?? []) {
      if (!message.ruleId?.startsWith("anti-slop/")) {
        continue;
      }

      const metadata = metadataForCatalogRule(message.ruleId);
      const failurePattern = antiSlopPattern(message.ruleId);
      const snippet = findingSnippet(sourceLines, message.line ?? 1);
      findings.push({
        ruleId: message.ruleId,
        ruleName: message.ruleId.replace("anti-slop/", ""),
        severity: message.severity >= 2 ? "error" : "warning",
        eslintSeverity: message.severity,
        category: metadata.category,
        file,
        line: message.line ?? 1,
        column: message.column ?? 1,
        endLine: message.endLine ?? message.line ?? 1,
        message: redactSecrets(message.message),
        requiredFix: metadata.requiredFix,
        failurePattern,
        fingerprint: dedupeFingerprint(
          "Anti-Slop",
          message.ruleId,
          [file],
          `${failurePattern}\n${snippet ?? `line:${message.line ?? 1}`}`,
        ),
      });
    }
  }

  return findings;
}

function sourceLinesForResult(result) {
  if (typeof result.source === "string") {
    return result.source.split("\n");
  }

  try {
    return readFileSync(result.filePath, "utf8").split("\n");
  } catch {
    return null;
  }
}

function findingSnippet(sourceLines, line) {
  const text = sourceLines?.[line - 1]?.trim();
  return text || null;
}
