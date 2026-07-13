export const VALID_MODES = new Set(["auto", "block", "warn", "audit"]);

export class AntiSlopInputError extends Error {
  constructor(kind, path, detail) {
    super(`Anti-Slop ${kind} error in ${path}: ${detail}`);
    this.name = "AntiSlopInputError";
    this.kind = kind;
  }
}

export function isAntiSlopInputError(error) {
  return error instanceof AntiSlopInputError;
}
