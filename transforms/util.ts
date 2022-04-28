import * as types from "jscodeshift";

/******************************************************************
 * Attribute utilities
 ******************************************************************/
type TAttrValue = string | number | boolean | RegExp | null;

export type TReactNode =
  | types.BigIntLiteral
  | types.BooleanLiteral
  | types.JSXElement
  | types.JSXExpressionContainer
  | types.JSXFragment
  | types.JSXSpreadChild
  | types.JSXText
  | types.Literal
  | types.NullLiteral
  | types.NumericLiteral
  | types.RegExpLiteral
  | types.StringLiteral;

/**
 *
 */
export const addAttribute = (
  element: types.JSXElement,
  name: string,
  value: Exclude<TReactNode, types.JSXSpreadChild>,
  api: types.API,
) => {
  const j = api.jscodeshift;

  const newAttr = j.jsxAttribute(j.jsxIdentifier(name), value);
  if (element.openingElement.attributes) {
    element.openingElement.attributes.push(newAttr);
  } else {
    element.openingElement.attributes = [newAttr];
  }
};

/**
 *
 */
export const addAttrLiteral = (
  element: types.JSXElement,
  name: string,
  value: TAttrValue | undefined,
  api: types.API,
) => {
  const j = api.jscodeshift;

  const newAttr =
    value === undefined
      ? j.jsxAttribute(j.jsxIdentifier(name))
      : j.jsxAttribute(j.jsxIdentifier(name), j.literal(value));

  if (element.openingElement.attributes) {
    element.openingElement.attributes.push(newAttr);
  } else {
    element.openingElement.attributes = [newAttr];
  }
};

/**
 *
 */
export const addAttrIdentifier = (
  element: types.JSXElement,
  attrName: string,
  identifierName: string,
  api: types.API,
) => {
  const j = api.jscodeshift;

  addAttribute(
    element,
    attrName,
    j.jsxExpressionContainer(j.identifier(identifierName)),
    api,
  );
};

/**
 *
 */
export const hasAttribute = (
  element: types.JSXElement,
  attrNameToMatch: string,
) => {
  return (element.openingElement.attributes ?? []).some((attr) => {
    return matchAttrByName(attr, [attrNameToMatch]);
  });
};

/**
 *
 */
export const matchAttrByName = (
  attr: types.JSXAttribute | types.JSXSpreadAttribute,
  namesToMatch: string[],
) => {
  if (attr.type === "JSXSpreadAttribute") {
    console.warn("JSXSpreadAttribute is not handled");
    return false;
  }
  if (attr.name.type === "JSXNamespacedName") {
    console.warn("JSXNamespacedName is not handled");
    return false;
  }
  if (!namesToMatch.includes(attr.name.name)) {
    return false;
  }
  return attr;
};

/**
 *
 */
export const matchAttrByVal = (
  attr: types.JSXAttribute | types.JSXSpreadAttribute | undefined,
  valuesToMatch: Array<TAttrValue | undefined>,
) => {
  if (!attr) {
    return false;
  }
  if (attr.type === "JSXSpreadAttribute") {
    console.warn("JSXSpreadAttribute is not handled");
    return false;
  }
  const valType = attr.value?.type;
  if (
    valType === "JSXExpressionContainer" ||
    valType === "JSXElement" ||
    valType === "JSXFragment"
  ) {
    return false;
  }
  if (!attr.value || !valuesToMatch.includes(attr.value.value)) {
    return false;
  }
  return attr;
};

/**
 *
 */
export const removeAttribute = (
  node: types.JSXElement | false,
  attrNameToRemove: string,
) => {
  if (!node) {
    return;
  }
  const newAttrs = node.openingElement.attributes?.filter(
    (attr) => !matchAttrByName(attr, [attrNameToRemove]),
  );
  node.openingElement.attributes = newAttrs;
};

/**
 * renameAttribute - given a JSXElement, rename the specified attribute (prop)
 */
export const renameAttribute = (
  node: types.JSXElement | false,
  oldAttrName: string,
  newAttrName: string,
) => {
  if (!node) {
    return;
  }
  (node.openingElement.attributes ?? []).forEach((attr) => {
    const matchedAttr = matchAttrByName(attr, [oldAttrName]);
    if (matchedAttr) {
      matchedAttr.name.name = newAttrName;
    }
  });
};

/**
 * renameOrAddAttribute - rename the attribute if it exists, otherwise add it
 */
export const renameOrAddAttribute = (
  element: types.JSXElement | false,
  oldAttrName: string,
  newAttrName: string,
  defaultValue: TAttrValue,
  api: types.API,
) => {
  if (!element) {
    return;
  }
  if (hasAttribute(element, newAttrName)) {
    // if the attribute already exists, do nothing
    return;
  }
  if (hasAttribute(element, oldAttrName)) {
    // if the old attribute exists, rename the attribute
    (element.openingElement.attributes ?? []).forEach((attr) => {
      const matchedAttr = matchAttrByName(attr, [oldAttrName]);
      if (matchedAttr) {
        matchedAttr.name.name = newAttrName;
      }
    });
  } else {
    // else add the attribute using the default value
    addAttrLiteral(element, newAttrName, defaultValue, api);
  }
};

/**
 *
 */
export const updateAttrStringValue = (
  element: types.JSXElement,
  name: string,
  api: types.API,
  updater: (currentValue: string) => string,
) => {
  const j = api.jscodeshift;
  const attr = element.openingElement.attributes?.find((attr) =>
    matchAttrByName(attr, [name]),
  );
  if (!attr) {
    return;
  }
  if (attr.type === "JSXSpreadAttribute") {
    console.warn("JSXSpreadAttribute is not handled");
    return;
  }
  if (attr.value?.type !== "StringLiteral" && attr.value?.type !== "Literal") {
    console.warn(
      `Only StringLiteral types can be updated. Found type: ${attr.value?.type}`,
    );
    return;
  }
  if (typeof attr.value.value !== "string") {
    console.warn(
      `Only string types can be updated. Found: ${attr.value.value}`,
    );
    return;
  }
  attr.value.value = updater(attr.value.value);
};

/******************************************************************
 * Element utilities
 ******************************************************************/
/**
 *
 */
export const getMatchingChildren = (
  element: types.JSXElement,
  namesToMatch: string[],
) => {
  return (element.children ?? []).filter((child) =>
    matchElement(child, namesToMatch),
  ) as types.JSXElement[];
};

/**
 *
 */
export const isWhiteSpaceChild = (child: TReactNode) => {
  if (child.type === "JSXText") {
    return /^\s*$/.test(child.value);
  }
  if (child.type === "JSXExpressionContainer") {
    if (child.expression.type === "StringLiteral") {
      return /^\s*$/.test(child.expression.value);
    }
  }
  return false;
};

/**
 *
 */
export const matchElement = (node: TReactNode, namesToMatch: string[]) => {
  if (node.type !== "JSXElement") {
    return false;
  }
  if (node.openingElement.name.type !== "JSXIdentifier") {
    return false;
  }
  if (!namesToMatch.includes(node.openingElement.name.name)) {
    return false;
  }
  return node;
};

/**
 *
 */
export const renameElement = (
  node: types.JSXElement,
  elementName: string,
  newElementName: string,
) => {
  if (node.openingElement.name.type !== "JSXIdentifier") {
    return;
  }
  if (node.openingElement.name.name !== elementName) {
    return;
  }

  setElementName(node, newElementName);
};

/**
 *
 */
export const setElementName = (
  node: types.JSXElement,
  newElementName: string,
) => {
  if (node.openingElement.name.type !== "JSXIdentifier") {
    return;
  }

  // set opening element name
  node.openingElement.name.name = newElementName;

  if (!node.closingElement) {
    return;
  }
  if (node.closingElement.name.type !== "JSXIdentifier") {
    return;
  }

  // set closing element name
  node.closingElement.name.name = newElementName;
};
