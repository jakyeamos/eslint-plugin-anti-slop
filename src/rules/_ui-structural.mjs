import { getLiteralString } from "./_shared.mjs";

export function getStaticJSXAttributeValue(node) {
  if (!node?.value) {
    return null;
  }

  if (node.value.type === "Literal" && typeof node.value.value === "string") {
    return node.value.value;
  }

  if (node.value.type === "JSXExpressionContainer") {
    return getLiteralString(node.value.expression);
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
