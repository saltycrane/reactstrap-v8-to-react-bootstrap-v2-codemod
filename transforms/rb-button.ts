import * as types from "jscodeshift";

import updateImports from "./updateImports";
import {
  hasAttribute,
  matchElement,
  removeAttribute,
  renameAttribute,
  renameOrAddAttribute,
  updateAttrStringValue,
} from "./util";

/**
 *
 */
export const convertButton = (fileSource: string, api: types.API) => {
  fileSource = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "Button",
    rsComponentsToRemove: ["Button"],
  });
  fileSource = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "ButtonProps",
    rsComponentsToRemove: ["ButtonProps"],
  });
  return convertJSXElements(fileSource, api);
};

/**
 *
 */
const convertJSXElements = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;

  return j(fileSource)
    .find(j.JSXElement)
    .forEach((path) => {
      // rename `Button` props
      const buttonElement = matchElement(path.value, ["Button"]);
      if (!buttonElement) {
        return;
      }

      renameAttribute(buttonElement, "tag", "as");
      renameAttribute(buttonElement, "innerRef", "ref");

      // Rename `color` -> `variant`.  Also if the `color` prop doesn't exist, add
      // `variant="secondary"` because the default for react-bootstrap is primary
      // instead of seconadary.
      renameOrAddAttribute(buttonElement, "color", "variant", "secondary", api);

      // Remove `outline` prop and change `variant` value to add "outline-" prefix
      if (hasAttribute(buttonElement, "outline")) {
        removeAttribute(buttonElement, "outline");
        updateAttrStringValue(buttonElement, "variant", api, (currentValue) => {
          console.log("[rb-button.ts] currentValue", currentValue);
          return `outline-${currentValue}`;
        });
      }
    })
    .toSource();
};
