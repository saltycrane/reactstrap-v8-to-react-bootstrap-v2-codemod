import * as types from "jscodeshift";

import updateImports from "./updateImports";
import { matchElement, renameAttribute, renameElement } from "./util";

/**
 *
 */
export const convertNavbars = (fileSource: string, api: types.API) => {
  let hasImports: boolean;
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "Navbar",
    rsComponentsToRemove: ["Navbar", "NavbarBrand"],
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
      const element = matchElement(path.value, ["Navbar", "NavbarBrand"]);
      renameAttribute(element, "tag", "as");
      renameElement(path.value, "NavbarBrand", "Navbar.Brand");
    })
    .toSource();
};
