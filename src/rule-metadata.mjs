import { metadataByRuleId, metadataForCatalogRule } from "./internal/rules/catalog.mjs";

export const ruleMetadata = metadataByRuleId;

export function metadataForRule(ruleId) {
  return metadataForCatalogRule(ruleId);
}
