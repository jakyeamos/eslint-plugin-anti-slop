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

const MOTION_BASE_RE = /^(?:animate-|transition(?:-|$))/;

function classToken(item) {
  const segments = item.split(":");
  return {
    variants: segments.slice(0, -1),
    base: segments.at(-1),
  };
}

function classMotionState(value) {
  let hasMotion = false;
  let hasFallback = false;

  for (const item of splitClasses(value)) {
    const { variants, base } = classToken(item);
    if (variants.includes("motion-reduce")) {
      hasFallback = true;
      continue;
    }

    if (MOTION_BASE_RE.test(base) && !variants.includes("motion-safe")) {
      hasMotion = true;
    }
  }

  return { hasMotion, hasFallback };
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

function cssStringHasFallback(value) {
  return /prefers-reduced-motion/.test(String(value));
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
    let usesReducedMotionHook = false;
    const candidates = [];

    function isImportBinding(node) {
      const parentType = node.parent?.type;
      return (
        parentType === "ImportSpecifier" ||
        parentType === "ImportDefaultSpecifier" ||
        parentType === "ImportNamespaceSpecifier"
      );
    }

    return {
      Identifier(node) {
        if (node.name === "useReducedMotion" && !isImportBinding(node)) {
          usesReducedMotionHook = true;
        }
      },
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, "className")) {
          const value = getStaticClassValue(node);
          if (value) {
            const { hasMotion, hasFallback } = classMotionState(value);
            if (hasMotion && !hasFallback) {
              candidates.push(node);
            }
          }
        }

        if (isJSXAttributeNamed(node, "style") && styleHasMotion(getJSXExpression(node))) {
          candidates.push(node);
        }
      },
      Literal(node) {
        if (isInsideJSXAttributeValue(node)) {
          return;
        }

        if (typeof node.value === "string" && cssStringHasMotion(node.value) && !cssStringHasFallback(node.value)) {
          candidates.push(node);
        }
      },
      TemplateLiteral(node) {
        if (isInsideJSXAttributeValue(node)) {
          return;
        }

        const value = staticTemplateValue(node);
        if (value && cssStringHasMotion(value) && !cssStringHasFallback(value)) {
          candidates.push(node);
        }
      },
      "Program:exit"() {
        if (usesReducedMotionHook) {
          return;
        }

        for (const node of candidates) {
          context.report({ node, messageId: "reducedMotion" });
        }
      },
    };
  },
};
