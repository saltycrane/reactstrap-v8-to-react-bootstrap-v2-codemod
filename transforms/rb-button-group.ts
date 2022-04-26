import * as types from "jscodeshift";

import updateImports from "./updateImports";
import { matchElement, renameAttribute } from "./util";

/**
 *
 */
export const convertButtonGroup = (fileSource: string, api: types.API) => {
  let hasImports: boolean;
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "ButtonGroup",
    rsComponentsToRemove: ["ButtonGroup"],
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
      const buttonGroupElement = matchElement(path.value, ["ButtonGroup"]);
      if (!buttonGroupElement) {
        return;
      }
      renameAttribute(buttonGroupElement, "tag", "as");
    })
    .toSource();
};
