import * as types from "jscodeshift";

import updateImports from "./updateImports";
import {
  addAttrLiteral,
  hasAttribute,
  matchElement,
  renameAttribute,
  renameOrAddAttribute,
} from "./util";

/**
 *
 */
export const convertAlert = (fileSource: string, api: types.API) => {
  let hasImports: boolean;
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "Alert",
    rsComponentsToRemove: ["Alert"],
  });
  [fileSource] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "AlertProps",
    rsComponentsToRemove: ["AlertProps"],
  });
  if (!hasImports) {
    return fileSource;
  }
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
      const alertElement = matchElement(path.value, ["Alert"]);
      if (!alertElement) {
        return;
      }

      // Rename `color` -> `variant`.  Also if the `color` prop doesn't exist, add
      // `variant="secondary"` because the default for react-bootstrap is primary
      // instead of seconadary.
      renameOrAddAttribute(alertElement, "color", "variant", "secondary", api);

      renameAttribute(alertElement, "isOpen", "show");

      // Rename `toggle` -> `onClose` and add `dismissible` prop
      if (hasAttribute(alertElement, "toggle")) {
        renameAttribute(alertElement, "toggle", "onClose");
        addAttrLiteral(alertElement, "dismissible", undefined, api);
      }
    })
    .toSource();
};
