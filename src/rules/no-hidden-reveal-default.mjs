import {
  getJSXExpression,
  getPropertyName,
  getPropertyValue,
  getStaticClassPaths,
  isInsideJSXAttributeValue,
  isJSXAttributeNamed,
  splitClasses,
  staticTemplateValue,
  styleObjectProperties,
} from "./_ui-structural.mjs";

function classHasHiddenReveal(value) {
  const classes = splitClasses(value);
  const hidden = classes.some((item) => item === "opacity-0" || item === "invisible");
  const motion = classes.some((item) => /^(?:animate-|transition(?:-|$)|duration-)/.test(item));
  return hidden && motion;
}

function styleHasHiddenReveal(expression) {
  const properties = styleObjectProperties(expression);
  const hidden = properties.some((property) => {
    const name = getPropertyName(property);
    const value = getPropertyValue(property);
    return (name === "opacity" && Number(value) === 0) || (name === "visibility" && value === "hidden");
  });
  const motion = properties.some((property) => {
    const name = getPropertyName(property);
    return name === "animation" || name === "transition";
  });
  return hidden && motion;
}

function cssStringHasHiddenReveal(value) {
  const text = String(value);
  return /(?:opacity\s*:\s*0|visibility\s*:\s*hidden)/.test(text) && /\b(?:animation|transition)\s*:/.test(text);
}

export const noHiddenRevealDefaultRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage reveal animations that hide content by default.",
    },
    schema: [],
    messages: {
      hiddenReveal:
        "Reveal animations should enhance already-visible content. Do not gate content behind hidden default state.",
    },
  },
  create(context) {
    function report(node) {
      context.report({ node, messageId: "hiddenReveal" });
    }

    return {
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, "className")) {
          const paths = getStaticClassPaths(node);
          if (paths.some(classHasHiddenReveal)) {
            report(node);
          }
        }

        if (isJSXAttributeNamed(node, "style") && styleHasHiddenReveal(getJSXExpression(node))) {
          report(node);
        }
      },
      Literal(node) {
        if (isInsideJSXAttributeValue(node)) {
          return;
        }

        if (typeof node.value === "string" && cssStringHasHiddenReveal(node.value)) {
          report(node);
        }
      },
      TemplateLiteral(node) {
        if (isInsideJSXAttributeValue(node)) {
          return;
        }

        const value = staticTemplateValue(node);
        if (value && cssStringHasHiddenReveal(value)) {
          report(node);
        }
      },
    };
  },
};
