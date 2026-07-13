import {
  getJSXExpression,
  getPropertyValue,
  getStaticClassPaths,
  isInsideJSXAttributeValue,
  isJSXAttributeNamed,
  staticTemplateValue,
  styleObjectProperties,
} from "./_ui-structural.mjs";

function hasDecorativeGrid(value) {
  const text = String(value).toLowerCase();
  return text.includes("linear-gradient")
    && text.includes("1px")
    && (text.includes("90deg") || text.match(/linear-gradient/g)?.length > 1);
}

function styleHasDecorativeGrid(expression) {
  return styleObjectProperties(expression).some((property) => {
    const value = getPropertyValue(property);
    return typeof value === "string" && hasDecorativeGrid(value);
  });
}

export const noDecorativeGridBackgroundRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage decorative grid backgrounds unless the UI is a real canvas/map/measurement surface.",
    },
    schema: [],
    messages: {
      decorativeGrid:
        "Decorative grid backgrounds are a common generated-UI tell. Use product structure or a plain surface instead.",
    },
  },
  create(context) {
    function report(node) {
      context.report({ node, messageId: "decorativeGrid" });
    }

    return {
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, "className")) {
          const paths = getStaticClassPaths(node);
          if (paths.some(hasDecorativeGrid)) {
            report(node);
          }
        }

        if (isJSXAttributeNamed(node, "style") && styleHasDecorativeGrid(getJSXExpression(node))) {
          report(node);
        }
      },
      Literal(node) {
        if (isInsideJSXAttributeValue(node)) {
          return;
        }

        if (typeof node.value === "string" && hasDecorativeGrid(node.value)) {
          report(node);
        }
      },
      TemplateLiteral(node) {
        if (isInsideJSXAttributeValue(node)) {
          return;
        }

        const value = staticTemplateValue(node);
        if (value && hasDecorativeGrid(value)) {
          report(node);
        }
      },
    };
  },
};
