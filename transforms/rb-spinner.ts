import * as types from "jscodeshift";

import updateImports from "./updateImports";
import { matchElement, renameAttribute, renameOrAddAttribute } from "./util";

/**
 *
 */
export const convertSpinner = (fileSource: string, api: types.API) => {
  let hasImports: boolean;
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "Spinner",
    rsComponentsToRemove: ["Spinner"],
  });
  [fileSource] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "SpinnerProps",
    rsComponentsToRemove: ["SpinnerProps"],
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
      const spinnerElement = matchElement(path.value, ["Spinner"]);
      if (!spinnerElement) {
        return;
      }
      // rename props
      renameAttribute(spinnerElement, "color", "variant");
      renameAttribute(spinnerElement, "innerRef", "ref");
      renameAttribute(spinnerElement, "tag", "as");
      // set `animation="border"` if none specified, because react-bootstrap doesn't set a default
      renameOrAddAttribute(spinnerElement, "type", "animation", "border", api);
    })
    .toSource();
};
