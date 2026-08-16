const TRANSPARENT_EXPRESSION_TYPES = new Set([
  "ParenthesizedExpression",
  "TSAsExpression",
  "TSTypeAssertion",
  "TSNonNullExpression",
  "TSSatisfiesExpression",
]);

const BUILT_IN_TYPE_NAMES = new Set(["Partial", "PropertyKey", "Record", "Readonly", "Required"]);

export function unwrapEvidenceExpression(expression) {
  let current = expression;
  while (TRANSPARENT_EXPRESSION_TYPES.has(current?.type)) {
    current = current.expression;
  }
  return current;
}

export function resolveVariable(sourceCode, identifier) {
  let scope = sourceCode.getScope(identifier);
  while (scope) {
    const variable = scope.set.get(identifier.name);
    if (variable) {
      return variable;
    }
    scope = scope.upper;
  }
  return null;
}

export function variableDeclarator(variable) {
  if (!variable || variable.defs.length !== 1) {
    return null;
  }

  const [definition] = variable.defs;
  return definition?.type === "Variable" && definition.node.type === "VariableDeclarator"
    ? definition.node
    : null;
}

export function isStableConstVariable(variable, declarator) {
  return (
    declarator.parent.type === "VariableDeclaration" &&
    declarator.parent.kind === "const" &&
    variable.references.every((reference) => reference.init || !reference.isWrite())
  );
}

export function isKnownEvidenceExpression(sourceCode, expression, visitedVariables = new Set()) {
  const current = unwrapEvidenceExpression(expression);

  if (
    current.type === "ObjectExpression" ||
    current.type === "ArrayExpression" ||
    current.type === "ArrowFunctionExpression" ||
    current.type === "ClassExpression" ||
    current.type === "FunctionExpression" ||
    current.type === "NewExpression" ||
    current.type === "Literal" ||
    current.type === "TemplateLiteral" ||
    current.type === "UnaryExpression"
  ) {
    return true;
  }

  if (current.type !== "Identifier") {
    return false;
  }

  const variable = resolveVariable(sourceCode, current);
  if (!variable || visitedVariables.has(variable)) {
    return false;
  }

  const declarator = variableDeclarator(variable);
  if (!declarator || declarator.init === null || !isStableConstVariable(variable, declarator)) {
    return false;
  }

  const nextVisitedVariables = new Set(visitedVariables);
  nextVisitedVariables.add(variable);
  return isKnownEvidenceExpression(sourceCode, declarator.init, nextVisitedVariables);
}

function declaredStatement(statement) {
  if (statement.type === "ExportNamedDeclaration" || statement.type === "ExportDefaultDeclaration") {
    return statement.declaration;
  }
  return statement;
}

export function createEvidenceTypeEnvironment(program) {
  const aliases = new Map();
  const shadowedBuiltIns = new Set();

  for (const statement of program.body) {
    const declaration = declaredStatement(statement);
    if (!declaration) {
      continue;
    }

    if (declaration.type === "ImportDeclaration") {
      for (const specifier of declaration.specifiers) {
        if (BUILT_IN_TYPE_NAMES.has(specifier.local.name)) {
          shadowedBuiltIns.add(specifier.local.name);
        }
      }
      continue;
    }

    if (declaration.type === "TSTypeAliasDeclaration") {
      if (aliases.has(declaration.id.name) || BUILT_IN_TYPE_NAMES.has(declaration.id.name)) {
        shadowedBuiltIns.add(declaration.id.name);
      } else {
        aliases.set(declaration.id.name, declaration);
      }
    }
  }

  return { aliases, shadowedBuiltIns };
}

function unwrapEvidenceType(type) {
  let current = type;
  while (
    current?.type === "TSParenthesizedType" ||
    (current?.type === "TSTypeOperator" && current.operator === "readonly")
  ) {
    current = current.typeAnnotation;
  }
  return current;
}

function typeReferenceName(type) {
  return type.typeName.type === "Identifier" ? type.typeName.name : null;
}

function isBuiltInType(name, environment) {
  return BUILT_IN_TYPE_NAMES.has(name) && !environment.shadowedBuiltIns.has(name);
}

function isBroadMappedKey(type, environment) {
  const current = unwrapEvidenceType(type);
  if (["TSStringKeyword", "TSNumberKeyword", "TSSymbolKeyword"].includes(current?.type)) {
    return true;
  }
  if (current?.type === "TSUnionType") {
    return current.types.every((member) => isBroadMappedKey(member, environment));
  }
  return (
    current?.type === "TSTypeReference" &&
    typeReferenceName(current) === "PropertyKey" &&
    !environment.shadowedBuiltIns.has("PropertyKey")
  );
}

function classifyAliasTarget(type, environment, resolvingAliases) {
  const current = unwrapEvidenceType(type);
  if (current?.type === "TSUnknownKeyword") {
    return { kind: "unknown" };
  }
  if (current?.type === "TSObjectKeyword") {
    return { kind: "object" };
  }
  if (current?.type === "TSTypeLiteral") {
    return current.members.some((member) => member.type === "TSIndexSignature")
      ? { kind: "open dictionary" }
      : null;
  }
  if (current?.type === "TSMappedType") {
    return isBroadMappedKey(current.typeParameter?.constraint, environment)
      ? { kind: "open dictionary" }
      : null;
  }
  if (current?.type !== "TSTypeReference") {
    return null;
  }

  const name = typeReferenceName(current);
  if (!name) {
    return null;
  }
  if (isBuiltInType(name, environment) && ["Partial", "Readonly", "Required"].includes(name)) {
    const wrapped = current.typeArguments?.params[0];
    return wrapped ? classifyAliasTarget(wrapped, environment, resolvingAliases) : null;
  }
  if (isBuiltInType(name, environment) && name === "Record") {
    return { kind: "open dictionary" };
  }

  const alias = environment.aliases.get(name);
  if (!alias || resolvingAliases.has(name)) {
    return null;
  }
  const nextResolvingAliases = new Set(resolvingAliases);
  nextResolvingAliases.add(name);
  if (alias.typeParameters?.params.length) {
    return classifyGenericAliasTarget(alias.typeAnnotation, environment, nextResolvingAliases);
  }
  return classifyAliasTarget(alias.typeAnnotation, environment, nextResolvingAliases);
}

function classifyGenericAliasTarget(type, environment, resolvingAliases) {
  const current = unwrapEvidenceType(type);
  if (current?.type === "TSTypeReference") {
    const name = typeReferenceName(current);
    if (name && isBuiltInType(name, environment) && name === "Record") {
      return { kind: "generic container" };
    }
  }
  if (current?.type === "TSTypeLiteral") {
    return current.members.some((member) => member.type === "TSIndexSignature")
      ? { kind: "generic container" }
      : null;
  }
  if (current?.type === "TSMappedType") {
    return isBroadMappedKey(current.typeParameter?.constraint, environment)
      ? { kind: "generic container" }
      : null;
  }
  return classifyAliasTarget(current, environment, resolvingAliases);
}

export function classifyWideningTarget(type, environment) {
  const current = unwrapEvidenceType(type);
  if (current?.type === "TSUnknownKeyword") {
    return { kind: "unknown" };
  }
  if (current?.type === "TSObjectKeyword") {
    return { kind: "object" };
  }
  if (current?.type === "TSTypeLiteral") {
    return current.members.some((member) => member.type === "TSIndexSignature")
      ? { kind: "open dictionary" }
      : current.members.length > 0
        ? { kind: "anonymous object" }
        : null;
  }
  if (current?.type === "TSMappedType") {
    return isBroadMappedKey(current.typeParameter?.constraint, environment)
      ? { kind: "open dictionary" }
      : null;
  }
  if (current?.type !== "TSTypeReference") {
    return null;
  }

  const name = typeReferenceName(current);
  if (!name) {
    return null;
  }
  if (isBuiltInType(name, environment) && name === "Record") {
    return { kind: "open dictionary" };
  }
  if (isBuiltInType(name, environment) && ["Partial", "Readonly", "Required"].includes(name)) {
    const wrapped = current.typeArguments?.params[0];
    return wrapped ? classifyWideningTarget(wrapped, environment) : null;
  }

  const alias = environment.aliases.get(name);
  if (!alias) {
    return null;
  }
  if (alias.typeParameters?.params.length) {
    return classifyGenericAliasTarget(alias.typeAnnotation, environment, new Set([name]));
  }
  return classifyAliasTarget(alias.typeAnnotation, environment, new Set([name]));
}

export function classifyBroadType(type, environment) {
  const current = unwrapEvidenceType(type);
  if (current?.type === "TSAnyKeyword") {
    return "top";
  }

  const target = classifyWideningTarget(current, environment);
  if (!target) {
    return null;
  }
  if (target.kind === "unknown") {
    return "top";
  }
  if (target.kind === "object") {
    return "object";
  }
  if (target.kind === "open dictionary" || target.kind === "generic container") {
    return "record";
  }
  return null;
}

export function isEmptyEvidenceObject(expression) {
  const current = unwrapEvidenceExpression(expression);
  return current.type === "ObjectExpression" && current.properties.length === 0;
}

export function isDefinitelyObjectType(type) {
  const current = unwrapEvidenceType(type);
  if (
    [
      "TSArrayType",
      "TSConstructorType",
      "TSFunctionType",
      "TSMappedType",
      "TSTupleType",
    ].includes(current?.type)
  ) {
    return true;
  }
  if (current?.type === "TSTypeLiteral") {
    return current.members.length > 0;
  }
  if (current?.type === "TSIntersectionType") {
    return current.types.every((member) => isDefinitelyObjectType(member));
  }
  return current?.type === "TSObjectKeyword";
}

export function isDefinitelyNarrowerRecordType(type) {
  const current = unwrapEvidenceType(type);
  if (current?.type === "TSTypeLiteral") {
    return current.members.some((member) => member.type !== "TSIndexSignature");
  }
  if (current?.type !== "TSTypeReference" || current.typeName.type !== "Identifier") {
    return false;
  }
  const name = current.typeName.name;
  if (name === "Readonly") {
    const [inner] = current.typeArguments?.params ?? [];
    return inner ? isDefinitelyNarrowerRecordType(inner) : false;
  }
  if (name !== "Record") {
    return false;
  }
  const [, value] = current.typeArguments?.params ?? [];
  return Boolean(value && !["TSUnknownKeyword", "TSAnyKeyword"].includes(unwrapEvidenceType(value).type));
}
