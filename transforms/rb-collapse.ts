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
    .replaceWith((path) => {
      const collapseElement = matchElement(path.value, ["Collapse"]);
      if (!collapseElement) {
        return path.value;
      }
      renameAttribute(collapseElement, "isOpen", "in");
      renameAttribute(collapseElement, "tag", "as");

      // if there is more than 1 child, wrap them with a `<div>` because
      // `Collapse` cannot have more than 1 child
      if (collapseElement.children && collapseElement.children.length > 1) {
        collapseElement.children = [
          j.jsxElement(
            j.jsxOpeningElement(j.jsxIdentifier("div")),
            j.jsxClosingElement(j.jsxIdentifier("div")),
            collapseElement.children,
          ),
        ];
      }

      return collapseElement;
    })
    .toSource();
};
