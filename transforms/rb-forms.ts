import * as types from "jscodeshift";

import updateImports from "./updateImports";
import {
  addAttrIdentifier,
  addAttrLiteral,
  getMatchingChildren,
  hasAttribute,
  isWhiteSpaceChild,
  matchAttrByName,
  matchAttrByVal,
  matchElement,
  removeAttribute,
  renameAttribute,
  renameElement,
  setElementName,
  addAttribute,
} from "./util";

/**
 *
 */
export const convertForms = (fileSource: string, api: types.API) => {
  let hasImports: boolean;
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "Form",
    rsComponentsToRemove: [
      "CustomInput",
      "Form",
      "FormFeedback",
      "FormGroup",
      "FormText",
      "Input",
      "Label",
    ],
  });

  if (!hasImports) {
    return fileSource;
  }

  let componentsToImport: string[] = [];
  [fileSource, componentsToImport] = convertFormGroupJSXElements(
    fileSource,
    api,
  );
  fileSource = convertLabelJSXElements(fileSource, api);
  fileSource = convertFormJSXElements(fileSource, api);

  // import additional components needed after doing the JSX transform
  for (const componentName of componentsToImport) {
    [fileSource] = updateImports({
      api,
      fileSource,
      rbComponentToAdd: componentName,
      rsComponentsToRemove: [componentName],
      skipHasRsImportsCheck: true,
    });
  }

  return fileSource;
};

/**
 *
 */
const convertFormGroupJSXElements = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;
  const componentsToImport: string[] = [];

  const modifiedFileSource = j(fileSource)
    .find(j.JSXElement)
    .forEach((path) => {
      const formGroupElement = matchElement(path.value, ["FormGroup"]);
      if (!formGroupElement) {
        return;
      }

      // remove "check" prop
      removeAttribute(formGroupElement, "check");

      // handle "inline" prop
      //  - remove "inline" prop from `FormGroup`
      //  - add "inline" prop to child `Input` component
      const hasInlineProp = hasAttribute(formGroupElement, "inline");
      if (hasInlineProp) {
        removeAttribute(formGroupElement, "inline");

        // `Input` may not be a direct child of `FormGroup` so use `.find()`
        j(path)
          .find(j.JSXElement)
          .forEach((path2) => {
            const inputElement = matchElement(path2.value, [
              "Input",
              "CustomInput",
            ]);
            if (!inputElement) {
              return;
            }
            addAttrLiteral(inputElement, "inline", undefined, api);
          });
      }

      // handle "row" prop
      //  - remove "row" prop
      //  - add `as={Row}` prop
      //  - take note to import "Row" later
      //  - add "column" prop to child `Label` components
      const hasRowProp = hasAttribute(formGroupElement, "row");
      if (hasRowProp) {
        removeAttribute(formGroupElement, "row");
        addAttrIdentifier(formGroupElement, "as", "Row", api);
        const labelElements = getMatchingChildren(formGroupElement, ["Label"]);
        for (const labelElement of labelElements) {
          addAttrLiteral(labelElement, "column", undefined, api);
        }
      }

      setElementName(formGroupElement, "Form.Group");

      if (hasRowProp) {
        componentsToImport.push("Row");
      }
    })
    .toSource();

  return [modifiedFileSource, componentsToImport] as const;
};

/**
 *
 */
const convertLabelJSXElements = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;

  return j(fileSource)
    .find(j.JSXElement)
    .replaceWith((path) => {
      const labelElement = matchElement(path.value, ["Label"]);
      if (!labelElement) {
        return path.value;
      }
      const newElement = convertLabelWithInputChild(labelElement, api);
      if (newElement) {
        return newElement;
      }
      removeAttribute(labelElement, "check");
      setElementName(labelElement, "Form.Label");
      return labelElement;
    })
    .toSource();
};

/**
 *
 */
const convertLabelWithInputChild = (
  labelElement: types.JSXElement,
  api: types.API,
) => {
  const j = api.jscodeshift;

  // convert <Label><Input />My Label</Label>  -> <Input label="My Label" />
  const children = labelElement.children ?? [];
  const inputChildren = children.filter((child) => {
    return matchElement(child, ["Input", "CustomInput"]);
  }) as types.JSXElement[];
  if (inputChildren.length > 1) {
    throw Error("Label has more than 1 Input children");
  }
  if (inputChildren.length === 0) {
    return false;
  }
  const inputElement = inputChildren[0];
  const otherChildren = children.filter((child) => {
    return (
      !matchElement(child, ["Input", "CustomInput"]) &&
      !isWhiteSpaceChild(child)
    );
  });
  if (otherChildren.length > 1) {
    throw Error("Other non-whitespace children > 1");
  }
  const label = otherChildren.length === 0 ? null : otherChildren[0];
  if (label) {
    addAttribute(
      inputElement,
      "label",
      j.jsxExpressionContainer(
        j.jsxFragment(
          { type: "JSXOpeningFragment" },
          { type: "JSXClosingFragment" },
          [label],
        ),
      ),
      api,
    );
  }
  convertInput(inputElement);

  return inputElement;
};

/**
 * convertFormJSXElements
 */
const convertFormJSXElements = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;

  return j(fileSource)
    .find(j.JSXElement)
    .forEach((path) => {
      // convert `Input` and `CustomInput`
      const inputElement = matchElement(path.value, ["Input", "CustomInput"]);
      convertInput(inputElement);

      // rename other elements
      renameElement(path.value, "FormFeedback", "Form.Control.Feedback");
      renameElement(path.value, "FormText", "Form.Text");
    })
    .toSource();
};

/**
 *
 */
const convertInput = (inputElement: types.JSXElement | false) => {
  if (!inputElement) {
    return;
  }
  renameAttribute(inputElement, "innerRef", "ref");
  renameAttribute(inputElement, "invalid", "isInvalid");
  renameAttribute(inputElement, "valid", "isValid");
  const typeAttr = inputElement.openingElement.attributes?.find((attr) =>
    matchAttrByName(attr, ["type"]),
  );
  if (matchAttrByVal(typeAttr, ["checkbox", "radio", "switch"])) {
    setElementName(inputElement, "Form.Check");
  } else if (matchAttrByVal(typeAttr, ["select"])) {
    removeAttribute(inputElement, "type");
    setElementName(inputElement, "Form.Select");
  } else {
    renameAttribute(inputElement, "bsSize", "size");
    setElementName(inputElement, "Form.Control");
  }
};
