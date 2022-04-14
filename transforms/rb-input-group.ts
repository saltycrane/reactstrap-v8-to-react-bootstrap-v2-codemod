import * as types from "jscodeshift";

import updateImports from "./updateImports";
import { matchElement, renameElement } from "./util";

// Rs/rs = reactstrap
// Rb/rb = react-bootstrap

/**
 *
 */
export default function transformer(file: types.FileInfo, api: types.API) {
  return convertInputGroup(file.source, api);
}

/**
 *
 */
export const convertInputGroup = (fileSource: string, api: types.API) => {
  return convertJSXElements(
    removeInputGroupAddon(
      updateImports({
        api,
        fileSource,
        rbComponentToAdd: "InputGroup",
        rsComponentsToRemove: [
          "InputGroup",
          "InputGroupAddon",
          "InputGroupText",
        ],
      }),
      api
    ),
    api
  );
};

/**
 * removeInputGroupAddon - remove obsolete `InputGroupAddon` JSX element
 */
const removeInputGroupAddon = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;

  return j(fileSource)
    .find(j.JSXElement)
    .forEach((path) => {
      if (!path.value.children) {
        return;
      }
      const newChildren = path.value.children.flatMap((child) => {
        const inputGroupAddonChild = matchElement(child, ["InputGroupAddon"]);
        if (inputGroupAddonChild) {
          const attrs = inputGroupAddonChild.openingElement.attributes ?? [];
          const unexpectedAttrs = attrs.filter((attr) => {
            if (attr.type !== "JSXAttribute") {
              return true;
            }
            return attr.name.name !== "addonType";
          });
          if (unexpectedAttrs.length > 0) {
            throw Error(
              "Unsafe to remove <InputGroupAddon> because it has extra prop(s). Fix manually."
            );
          }
          return inputGroupAddonChild.children ?? [];
        }
        return child;
      });
      path.value.children = newChildren;
    })
    .toSource();
};

/**
 * convertJSXElements
 */
const convertJSXElements = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;

  return j(fileSource)
    .find(j.JSXElement)
    .forEach((path) => {
      // `InputGroupText` -> `InputGroup.Text`
      renameElement(path.value, "InputGroupText", "InputGroup.Text");
    })
    .toSource();
};
