import { relative } from "node:path";
import { redactSecrets } from "./finding-core.mjs";

export function analysisErrorsFromResults({ repoRoot, results }) {
  const errors = [];

  for (const result of results) {
    const file = result.filePath ? relative(repoRoot, result.filePath) : null;
    const fatalMessages = (result.messages ?? []).filter((message) => message.fatal === true);
    for (const message of fatalMessages) {
      errors.push({
        kind: /(?:parsing|parser) error/i.test(message.message) ? "parser" : "eslint",
        file,
        line: message.line ?? null,
        column: message.column ?? null,
        message: redactSecrets(message.message),
      });
    }

    const fatalErrorCount = Number(result.fatalErrorCount) || 0;
    for (let index = fatalMessages.length; index < fatalErrorCount; index += 1) {
      errors.push({
        kind: "eslint",
        file,
        line: null,
        column: null,
        message: "ESLint reported a fatal analysis error without a diagnostic message.",
      });
    }
  }

  return errors;
}

export function analysisErrorFromException(error) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    kind: "eslint",
    file: null,
    line: null,
    column: null,
    message: redactSecrets(message),
  };
}
