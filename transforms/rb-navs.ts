import * as types from "jscodeshift";

import updateImports from "./updateImports";
import {
  addAttrLiteral,
  hasAttribute,
  matchElement,
  removeAttribute,
  renameAttribute,
  renameElement,
} from "./util";

/**
 *
 */
export const convertNavs = (fileSource: string, api: types.API) => {
  let hasImports: boolean;
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "Nav",
    rsComponentsToRemove: ["Nav", "NavItem", "NavLink"],
  });
  if (hasImports) {
    fileSource = convertJSXElements(fileSource, api);
  }
  return fileSource;
};

/**
 *
 */
const convertJSXElements = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;
  return j(fileSource)
    .find(j.JSXElement)
    .forEach((path) => {
      const element = matchElement(path.value, ["Nav", "NavItem", "NavLink"]);
      renameAttribute(element, "innerRef", "ref");
      renameAttribute(element, "tag", "as");
      renameElement(path.value, "NavItem", "Nav.Item");
      renameElement(path.value, "NavLink", "Nav.Link");

      const navElement = matchElement(path.value, ["Nav"]);
      if (!navElement) {
        return;
      }

      // change `pills` prop -> `variant="pills"`
      if (hasAttribute(navElement, "pills")) {
        removeAttribute(navElement, "pills");
        addAttrLiteral(navElement, "variant", "pills", api);
      }

      // change `tabs` prop -> `variant="tabs"`
      if (hasAttribute(navElement, "tabs")) {
        removeAttribute(navElement, "tabs");
        addAttrLiteral(navElement, "variant", "tabs", api);
      }
    })
    .toSource();
};
