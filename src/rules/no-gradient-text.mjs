import {
  getJSXExpression,
  getStaticClassPaths,
  isJSXAttributeNamed,
  splitClasses,
  stylePropertyMap,
} from "./_ui-structural.mjs";

function classNameHasGradientText(value) {
  const classes = splitClasses(value);
  const hasClip = classes.includes("bg-clip-text") || classes.includes("background-clip-text");
  const hasTransparentText = classes.includes("text-transparent") || classes.includes("[color:transparent]");
  const hasGradient = classes.some((item) => item.includes("gradient") || item.startsWith("from-") || item.startsWith("to-"));
  return hasClip && hasTransparentText && hasGradient;
}

function styleHasGradientText(expression) {
  const styles = stylePropertyMap(expression);
  const clip = String(styles.get("backgroundClip") ?? styles.get("WebkitBackgroundClip") ?? "").toLowerCase();
  const background = String(styles.get("background") ?? styles.get("backgroundImage") ?? "").toLowerCase();
  return clip === "text" && background.includes("gradient(");
}

export const noGradientTextRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage gradient-clipped text in product UI.",
    },
    schema: [],
    messages: {
      gradientText: "Gradient text is a low-signal visual trope. Use a solid text color and hierarchy instead.",
    },
  },
  create(context) {
    function report(node) {
      context.report({ node, messageId: "gradientText" });
    }

    return {
      JSXAttribute(node) {
        if (isJSXAttributeNamed(node, "className")) {
          const paths = getStaticClassPaths(node);
          if (paths.some(classNameHasGradientText)) {
            report(node);
          }
        }

        if (isJSXAttributeNamed(node, "style")) {
          const expression = getJSXExpression(node);
          if (styleHasGradientText(expression)) {
            report(node);
          }
        }
      },
    };
  },
};
