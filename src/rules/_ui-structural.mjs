const CLASS_BUILDER_NAMES = new Set(["clsx", "classnames", "classNames", "cn", "cx", "cva", "twMerge", "twJoin"]);

function classBuilderName(callee) {
  if (callee.type === "Identifier") {
    return callee.name;
  }

  if (callee.type === "MemberExpression" && !callee.computed && callee.property.type === "Identifier") {
    return callee.property.name;
  }

  return null;
}

export function staticClassFragments(expression) {
  const fragments = [];

  function walk(node) {
    if (!node || typeof node !== "object") {
      return;
    }

    if (node.type === "Literal") {
      if (typeof node.value === "string") {
        fragments.push(node.value);
      }
      return;
    }

    if (node.type === "TemplateLiteral") {
      if (node.expressions.length === 0) {
        fragments.push(node.quasis.map((part) => part.value.cooked ?? "").join(""));
        return;
      }

      for (const [index, quasi] of node.quasis.entries()) {
        let text = quasi.value.cooked ?? "";
        if (index > 0) {
          text = text.replace(/^\S+/, "");
        }
        if (index < node.expressions.length) {
          text = text.replace(/\S+$/, "");
        }
        if (text.trim()) {
          fragments.push(text);
        }
      }
      return;
    }

    if (node.type === "ArrayExpression") {
      for (const element of node.elements) {
        walk(element);
      }
      return;
    }

    if (node.type === "ObjectExpression") {
      for (const property of node.properties) {
        if (property.type !== "Property" || property.computed) {
          continue;
        }
        if (property.key.type === "Literal" && typeof property.key.value === "string") {
          fragments.push(property.key.value);
        } else if (property.key.type === "Identifier") {
          fragments.push(property.key.name);
        }
      }
      return;
    }

    if (node.type === "ConditionalExpression") {
      walk(node.consequent);
      walk(node.alternate);
      return;
    }

    if (node.type === "LogicalExpression") {
      walk(node.right);
      if (node.operator === "||" || node.operator === "??") {
        walk(node.left);
      }
      return;
    }

    if (node.type === "ChainExpression") {
      walk(node.expression);
      return;
    }

    if (node.type === "CallExpression") {
      const name = classBuilderName(node.callee);
      if (name && CLASS_BUILDER_NAMES.has(name)) {
        for (const argument of node.arguments) {
          walk(argument);
        }
      }
    }
  }

  walk(expression);
  return fragments;
}

export function getStaticClassValue(node) {
  if (!node?.value) {
    return null;
  }

  if (node.value.type === "Literal" && typeof node.value.value === "string") {
    return node.value.value;
  }

  if (node.value.type === "JSXExpressionContainer") {
    const fragments = staticClassFragments(node.value.expression);
    return fragments.length > 0 ? fragments.join(" ") : null;
  }

  return null;
}

export function getJSXExpression(node) {
  if (!node?.value || node.value.type !== "JSXExpressionContainer") {
    return null;
  }

  return node.value.expression;
}

export function isJSXAttributeNamed(node, name) {
  return node.name?.type === "JSXIdentifier" && node.name.name === name;
}

export function splitClasses(value) {
  return String(value).split(/\s+/).filter(Boolean);
}

export function getPropertyName(property) {
  if (!property || property.type !== "Property") {
    return null;
  }

  const key = property.key;
  if (key.type === "Identifier" && !property.computed) {
    return key.name;
  }

  if (key.type === "Literal" && typeof key.value === "string") {
    return key.value;
  }

  return null;
}

export function getPropertyValue(property) {
  if (!property || property.type !== "Property") {
    return null;
  }

  const value = property.value;
  if (value.type === "Literal" && (typeof value.value === "string" || typeof value.value === "number")) {
    return value.value;
  }

  if (value.type === "TemplateLiteral" && value.expressions.length === 0) {
    return value.quasis.map((part) => part.value.cooked ?? "").join("");
  }

  return null;
}

export function styleObjectProperties(node) {
  if (node?.type !== "ObjectExpression") {
    return [];
  }

  return node.properties.filter((property) => property.type === "Property");
}

export function stylePropertyMap(node) {
  const map = new Map();
  for (const property of styleObjectProperties(node)) {
    const name = getPropertyName(property);
    if (name) {
      map.set(name, getPropertyValue(property));
    }
  }
  return map;
}

export function parseCssLengthPx(value) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  const match = /^(-?\d+(?:\.\d+)?)(px|rem)?$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const numeric = Number.parseFloat(match[1]);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return match[2] === "rem" ? numeric * 16 : numeric;
}

export function staticTemplateValue(node) {
  if (node.type !== "TemplateLiteral" || node.expressions.length > 0) {
    return null;
  }

  return node.quasis.map((part) => part.value.cooked ?? "").join("");
}

export function isInsideJSXAttributeValue(node) {
  let current = node.parent;
  while (current && current.type !== "Program") {
    if (current.type === "JSXAttribute") {
      return true;
    }
    current = current.parent;
  }

  return false;
}
