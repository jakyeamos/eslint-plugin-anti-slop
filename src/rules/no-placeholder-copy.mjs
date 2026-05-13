import { getAntiSlopConfig, getLiteralString, isLikelyUserFacingString, patternMatches } from "./_shared.mjs";

export const noPlaceholderCopyRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow placeholder copy in user-facing strings.",
    },
    schema: [],
    messages: {
      placeholder: "Placeholder copy detected in user-facing text: `{{value}}`.",
    },
  },
  create(context) {
    const config = getAntiSlopConfig(context);

    function check(node, rawValue) {
      if (!rawValue || !isLikelyUserFacingString(node)) {
        return;
      }

      if (patternMatches(rawValue, config.placeholderPatterns)) {
        context.report({
          node,
          messageId: "placeholder",
          data: { value: rawValue.slice(0, 60) },
        });
      }
    }

    return {
      JSXText(node) {
        check(node, node.value);
      },
      Literal(node) {
        if (typeof node.value === "string") {
          check(node, node.value);
        }
      },
      TemplateLiteral(node) {
        const value = getLiteralString(node);
        if (value) {
          check(node, value);
        }
      },
    };
  },
};
