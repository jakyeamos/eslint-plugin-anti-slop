import assert from "node:assert/strict";
import { describe, it } from "node:test";
import plugin from "../src/index.mjs";
import { sarifFromGateReport } from "../src/gate.mjs";
import { metadataForRule, ruleMetadata } from "../src/rule-metadata.mjs";
import {
  metadataByRuleId,
  metadataForCatalogRule,
  pluginRules,
  presetRules,
  ruleCatalog,
  sarifRuleDescriptors,
} from "../src/internal/rules/catalog.mjs";

const DOCS_BASE_URL = "https://github.com/jakyeamos/eslint-plugin-anti-slop/blob/main/docs/rules";
const UNKNOWN_RULE_METADATA = {
  category: "Quality",
  recommendedSeverity: "warn",
  strictSeverity: "error",
  requiredFix: "Fix the anti-slop rule violation before committing.",
};
const CATALOG_GOLDEN = [
  {
    ruleName: "no-unjustified-use-client",
    category: "Architecture",
    recommendedSeverity: "error",
    strictSeverity: "error",
    requiredFix: "Review the client boundary; remove the directive only after confirming no client-only behavior remains.",
  },
  {
    ruleName: "no-useless-memo",
    category: "Maintainability",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Remove trivial memoization or justify a memo-sensitive boundary.",
  },
  {
    ruleName: "no-placeholder-copy",
    category: "UX",
    recommendedSeverity: "error",
    strictSeverity: "error",
    requiredFix: "Replace placeholder copy with real product text.",
  },
  {
    ruleName: "no-marketing-copy",
    category: "UX",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Replace generic marketing language with specific workflow copy.",
  },
  {
    ruleName: "require-empty-state-action",
    category: "UX",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Add action wording or a usable enabled control within the local empty-state boundary.",
  },
  {
    ruleName: "no-demo-data-primary-path",
    category: "Data integrity",
    recommendedSeverity: "error",
    strictSeverity: "error",
    requiredFix: "Use real data in primary routes or restrict demo data to a nullish fallback for an immutable same-scope real-data result.",
  },
  {
    ruleName: "no-defensive-guard-sprawl",
    category: "Maintainability",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Move repeated shape checks into a centralized validator or type guard.",
  },
  {
    ruleName: "no-generic-stat-label",
    category: "UX",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Use domain-specific metric labels.",
  },
  {
    ruleName: "no-gradient-text",
    category: "UI structure",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Replace gradient-clipped text with a solid text color and clearer hierarchy.",
  },
  {
    ruleName: "no-decorative-grid-background",
    category: "UI structure",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Remove decorative CSS grid backgrounds unless the surface is an actual canvas, map, or measurement tool.",
  },
  {
    ruleName: "no-side-stripe-accent",
    category: "UI structure",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Replace thick side-stripe accents with full borders, icons, or background contrast.",
  },
  {
    ruleName: "no-excessive-radius",
    category: "UI structure",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Use the project radius scale instead of oversized card or panel radii.",
  },
  {
    ruleName: "no-arbitrary-z-index",
    category: "UI structure",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Use a semantic z-index token or scale.",
  },
  {
    ruleName: "require-reduced-motion",
    category: "Accessibility",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Add a type-matched reduced-motion fallback for each static animation or transition.",
  },
  {
    ruleName: "no-hidden-reveal-default",
    category: "Accessibility",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Keep content visible by default and layer reveal motion on top.",
  },
  {
    ruleName: "no-nested-cards",
    category: "UI structure",
    recommendedSeverity: "warn",
    strictSeverity: "error",
    requiredFix: "Flatten nested cards into sections or a simpler hierarchy.",
  },
];

function expectedCatalogEntries() {
  return CATALOG_GOLDEN.map(({ ruleName, ...metadata }) => ({
    ruleId: `anti-slop/${ruleName}`,
    ruleName,
    docsUrl: `${DOCS_BASE_URL}/${ruleName}.md`,
    metadata,
  }));
}

function expectedMetadata() {
  return Object.fromEntries(expectedCatalogEntries().map(({ ruleId, metadata }) => [ruleId, metadata]));
}

function expectedPreset(severityKey) {
  return Object.fromEntries(
    expectedCatalogEntries().map(({ ruleId, metadata }) => [ruleId, metadata[severityKey]]),
  );
}

function expectedSarifRules() {
  return expectedCatalogEntries().map(({ ruleId, ruleName, metadata }) => ({
    id: ruleId,
    name: ruleName,
    shortDescription: { text: metadata.requiredFix },
    properties: {
      category: metadata.category,
      recommendedSeverity: metadata.recommendedSeverity,
    },
  }));
}

describe("canonical rule catalog", () => {
  it("projects the fixed rule contract into every internal and public consumer", () => {
    const expectedEntries = expectedCatalogEntries();

    assert.equal(metadataForRule.name, "metadataForRule");
    assert.deepEqual(
      ruleCatalog.map(({ ruleId, ruleName, docsUrl, metadata }) => ({ ruleId, ruleName, docsUrl, metadata })),
      expectedEntries,
    );
    assert.deepEqual(Object.keys(pluginRules), expectedEntries.map(({ ruleName }) => ruleName));
    assert.equal(plugin.rules, pluginRules);
    assert.deepEqual(ruleMetadata, expectedMetadata());
    assert.equal(ruleMetadata, metadataByRuleId);
    assert.deepEqual(plugin.configs.recommended.rules, expectedPreset("recommendedSeverity"));
    assert.deepEqual(plugin.configs.strict.rules, expectedPreset("strictSeverity"));
    assert.deepEqual(presetRules("recommendedSeverity"), expectedPreset("recommendedSeverity"));
    assert.deepEqual(presetRules("strictSeverity"), expectedPreset("strictSeverity"));

    for (const { ruleId, ruleName, docsUrl } of expectedEntries) {
      assert.equal(plugin.rules[ruleName].meta.docs.url, docsUrl);
      assert.equal(metadataForRule(ruleId), ruleMetadata[ruleId]);
      assert.equal(metadataForCatalogRule(ruleId), ruleMetadata[ruleId]);
      assert.deepEqual(Object.keys(ruleMetadata[ruleId]).sort(), [
        "category",
        "recommendedSeverity",
        "requiredFix",
        "strictSeverity",
      ]);
    }

    assert.deepEqual(sarifRuleDescriptors(), expectedSarifRules());
    assert.deepEqual(
      sarifFromGateReport({ analysis: { status: "complete" }, newFindings: [] }).runs[0].tool.driver.rules,
      expectedSarifRules(),
    );
  });

  it("keeps unknown rule metadata outside the catalog and non-shared", () => {
    const firstFallback = metadataForRule("anti-slop/future-rule");
    const secondFallback = metadataForCatalogRule("anti-slop/future-rule");

    assert.deepEqual(firstFallback, UNKNOWN_RULE_METADATA);
    assert.deepEqual(secondFallback, UNKNOWN_RULE_METADATA);
    assert.notEqual(firstFallback, secondFallback);
  });
});
