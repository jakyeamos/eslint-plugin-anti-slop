export interface AntiSlopRuleMetadata {
  category: string;
  recommendedSeverity: "warn" | "error";
  strictSeverity: "warn" | "error";
  requiredFix: string;
}

export declare const ruleMetadata: Record<string, AntiSlopRuleMetadata>;

export declare function metadataForRule(ruleId: string): AntiSlopRuleMetadata;
