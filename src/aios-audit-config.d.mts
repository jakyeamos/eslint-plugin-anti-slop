import type { Linter } from "eslint";

export declare const antiSlopAuditFormatter: string;

export declare const aiosAuditArtifacts: readonly string[];

export declare const defaultAntiSlopAuditIgnores: readonly string[];

export declare function antiSlopAiosAuditConfig(options?: { ignores?: string[] }): Linter.Config[];

declare const config: Linter.Config[];
export default config;
