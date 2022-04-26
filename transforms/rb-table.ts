import * as types from "jscodeshift";

import updateImports from "./updateImports";
import { matchElement, renameAttribute } from "./util";

/**
 *
 */
export const convertTable = (fileSource: string, api: types.API) => {
  let hasImports: boolean;
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "Table",
    rsComponentsToRemove: ["Table"],
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
      const tableElement = matchElement(path.value, ["Table"]);
      if (!tableElement) {
        return;
      }
      renameAttribute(tableElement, "tag", "as");
    })
    .toSource();
};
