import * as types from "jscodeshift";

import updateImports from "./updateImports";
import { matchElement, renameAttribute, renameOrAddAttribute } from "./util";

/**
 *
 */
export const convertBadge = (fileSource: string, api: types.API) => {
  let hasImports: boolean;
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "Badge",
    rsComponentsToRemove: ["Badge"],
  });
  [fileSource] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "BadgeProps",
    rsComponentsToRemove: ["BadgeProps"],
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
      const badgeElement = matchElement(path.value, ["Badge"]);
      if (!badgeElement) {
        return;
      }
      // rename prop
      renameAttribute(badgeElement, "tag", "as");
      // Rename `color` -> `bg`.  Also if the `color` prop doesn't exist, add
      // `bg="secondary"` because the default for react-bootstrap is primary
      // instead of seconadary.
      renameOrAddAttribute(badgeElement, "color", "bg", "secondary", api);
    })
    .toSource();
};
