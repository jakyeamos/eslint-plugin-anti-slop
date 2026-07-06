import {
  getJSXExpression,
  getPropertyName,
  getStaticClassValue,
  isInsideJSXAttributeValue,
  isJSXAttributeNamed,
  splitClasses,
  staticTemplateValue,
  styleObjectProperties,
} from "./_ui-structural.mjs";

function hasReducedMotionFallback(sourceText) {
  return /prefers-reduced-motion|motion-reduce:|useReducedMotion/.test(sourceText);
}

function classHasMotion(value) {
  return splitClasses(value).some((item) => /^(?:animate-|transition(?:-|$))/.test(item));
}

function styleHasMotion(expression) {
  return styleObjectProperties(expression).some((property) => {
    const name = getPropertyName(property);
    return name === "animation" || name === "animationName" || name === "transition";
  });
}

function cssStringHasMotion(value) {
  return /\b(?:animation|transition)\s*:/.test(String(value));
}

export const requireReducedMotionRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require a reduced-motion fallback when static UI code declares motion.",
    },
    schema: [],
    messages: {
      reducedMotion: "Motion needs a reduced-motion fallback such as prefers-reduced-motion, motion-reduce:, or useReducedMotion.",
    },
  },
  create(context) {
    const sourceText = context.sourceCode.getText();
    const hasFallback = hasReducedMotionFallback(sourceText);

    function report(node) {
      if (!hasFallback) {
        context.report({ node, messageId: "reducedMotion" });
      }
    }

    return {
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, "className")) {
          const value = getStaticClassValue(node);
          if (value && classHasMotion(value)) {
            report(node);
          }
        }

        if (isJSXAttributeNamed(node, "style") && styleHasMotion(getJSXExpression(node))) {
          report(node);
        }
      },
      Literal(node) {
        if (isInsideJSXAttributeValue(node)) {
          return;
        }

        if (typeof node.value === "string" && cssStringHasMotion(node.value)) {
          report(node);
        }
      },
      TemplateLiteral(node) {
        if (isInsideJSXAttributeValue(node)) {
          return;
        }

        const value = staticTemplateValue(node);
        if (value && cssStringHasMotion(value)) {
          report(node);
        }
      },
    };
  },
};
