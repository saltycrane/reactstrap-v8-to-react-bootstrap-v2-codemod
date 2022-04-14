import * as types from "jscodeshift";

import updateImports from "./updateImports";
import {
  TChild,
  addAttrIdentifier,
  addAttrLiteral,
  getMatchingChildren,
  hasAttribute,
  matchAttrByName,
  matchAttrByVal,
  matchElement,
  removeAttribute,
  renameAttribute,
  renameElement,
  setElementName,
  addAttribute,
} from "./util";

// Rs/rs = reactstrap
// Rb/rb = react-bootstrap

/**
 *
 */
export default function transformer(file: types.FileInfo, api: types.API) {
  return convertForms(file.source, api);
}

/**
 *
 */
export const convertForms = (fileSource: string, api: types.API) => {
  fileSource = updateImports({
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

  let componentsToImport: string[] = [];
  [fileSource, componentsToImport] = convertFormJSXElements(fileSource, api);

  for (const componentName of componentsToImport) {
    fileSource = updateImports({
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
 * convertFormJSXElements
 */
const convertFormJSXElements = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;
  const componentsToImport: string[] = [];

  const modifiedFileSource = j(fileSource)
    .find(j.JSXElement)
    .forEach((path) => {
      // convert `Label`
      const labelElement = matchElement(path.value, ["Label"]);
      convertLabel(labelElement);

      // convert `FormGroup`
      const formGroupElement = matchElement(path.value, ["FormGroup"]);
      const hasRowProp = convertFormGroup(formGroupElement, api);
      if (hasRowProp) {
        componentsToImport.push("Row");
      }

      // convert `Input` and `CustomInput`
      const inputElement = matchElement(path.value, ["Input", "CustomInput"]);
      convertInput(inputElement);

      // rename other elements
      renameElement(path.value, "FormFeedback", "Form.Control.Feedback");
      renameElement(path.value, "FormText", "Form.Text");
    })
    .toSource();

  return [modifiedFileSource, componentsToImport] as const;
};

/**
 *
 */
const convertLabel = (
  labelElement: types.JSXElement | false,
  // api: types.API,
) => {
  if (!labelElement) {
    return;
  }

  // remove `check` prop from some components
  removeAttribute(labelElement, "check");

  // // convert <Label><Input />My Label</Label>
  // // -> <Input label="My Label" />
  // // DOES NOT WORK - <Label> often has more than 2 children in valid cases.  Maybe
  // // need to filter out whitespace. Seems pretty difficult. Also if I ever come
  // // back to it, the logic is still wrong even if there were always 2 children.
  // const children = labelElement.children ?? [];
  // if (children.length === 2) {
  //   const first = matchElement(children[0], ["Input", "CustomInput"]);
  //   const second = matchElement(children[0], ["Input", "CustomInput"]);
  //   if (first && second) {
  //     throw Error("Label has 2 Input children");
  //   }
  //   if (!first && !second) {
  //     throw Error("Label has 0 Input children");
  //   }
  //   const label = (first ? second : first) as TChild;
  //   const input = (first ? first : second) as types.JSXElement;
  //   if (label.type === "JSXSpreadChild") {
  //     throw Error("label type of JSXSpreadChild is not handled");
  //   }
  //   addAttribute(input, "label", label, api);
  // }

  setElementName(labelElement, "Form.Label");
};

/**
 *
 */
const convertFormGroup = (
  formGroupElement: types.JSXElement | false,
  api: types.API,
) => {
  if (!formGroupElement) {
    return;
  }

  // remove "check" prop
  removeAttribute(formGroupElement, "check");

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

  return hasRowProp;
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
