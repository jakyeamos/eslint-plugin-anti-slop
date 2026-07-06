import type { ESLint } from "eslint";

export interface AntiSlopCliDependencies {
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
  cwd?: string;
  changedFiles?: (cwd: string) => string[];
  eslintRunner?: (
    files: string[],
    options: { cwd: string; ignores: string[] },
  ) => Promise<ESLint.LintResult[]>;
}

export declare function runCli(argv: string[], dependencies?: AntiSlopCliDependencies): Promise<number>;
