import * as types from "jscodeshift";

import { globalForLogging } from "./logging";
import {
  addAttrLiteral,
  hasAttribute,
  matchElement,
  removeAttribute,
  renameAttribute,
  updateAttrString,
} from "./util";

/**
 *
 */
export default function transformer(file: types.FileInfo, api: types.API) {
  globalForLogging.filepath = file.path;
  return convertXSButton(file.source, api);
}

/**
 *
 */
const convertXSButton = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;

  return j(fileSource)
    .find(j.JSXElement)
    .forEach((path) => {
      const xsButtonElement = matchElement(path.value, ["XSButton"]);
      if (!xsButtonElement) {
        return;
      }
      renameAttribute(xsButtonElement, "color", "variant");

      // Remove `outline` prop and change `variant` value to add "outline-" prefix
      if (hasAttribute(xsButtonElement, "outline")) {
        removeAttribute(xsButtonElement, "outline");
        if (hasAttribute(xsButtonElement, "variant")) {
          updateAttrString(xsButtonElement, "variant", api, (currentValue) => {
            return `outline-${currentValue}`;
          });
        } else {
          addAttrLiteral(xsButtonElement, "variant", "outline-secondary", api);
        }
      }
    })
    .toSource();
};
