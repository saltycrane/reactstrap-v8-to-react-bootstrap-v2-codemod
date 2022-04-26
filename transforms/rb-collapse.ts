import * as types from "jscodeshift";

import updateImports from "./updateImports";
import { matchElement, renameAttribute } from "./util";

/**
 *
 */
export const convertCollapse = (fileSource: string, api: types.API) => {
  let hasImports: boolean;
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "Collapse",
    rsComponentsToRemove: ["Collapse"],
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
      const collapseElement = matchElement(path.value, ["Collapse"]);
      if (!collapseElement) {
        return;
      }
      renameAttribute(collapseElement, "isOpen", "in");
      renameAttribute(collapseElement, "tag", "as");
    })
    .toSource();
};
