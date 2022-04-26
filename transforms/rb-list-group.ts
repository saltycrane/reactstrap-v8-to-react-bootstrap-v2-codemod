import * as types from "jscodeshift";

import updateImports from "./updateImports";
import { matchElement, renameAttribute, renameElement } from "./util";

/**
 *
 */
export const convertListGroup = (fileSource: string, api: types.API) => {
  let hasImports: boolean;
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "ListGroup",
    rsComponentsToRemove: ["ListGroup", "ListGroupItem"],
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
      const element = matchElement(path.value, ["ListGroup", "ListGroupItem"]);
      renameAttribute(element, "color", "variant");
      renameAttribute(element, "innerRef", "ref");
      renameAttribute(element, "tag", "as");
      renameElement(path.value, "ListGroupItem", "ListGroup.Item");
    })
    .toSource();
};
