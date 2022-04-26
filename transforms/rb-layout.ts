import * as types from "jscodeshift";

import updateImports from "./updateImports";
import { matchAttrByName, matchElement, renameAttribute } from "./util";

/**
 *
 */
export const convertLayout = (fileSource: string, api: types.API) => {
  let hasImports: boolean;
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "Container",
    rsComponentsToRemove: ["Container"],
  });
  if (hasImports) {
    fileSource = convertContainerJSXElements(fileSource, api);
  }
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "Row",
    rsComponentsToRemove: ["Row"],
  });
  if (hasImports) {
    fileSource = convertRowJSXElements(fileSource, api);
  }
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "Col",
    rsComponentsToRemove: ["Col"],
  });
  if (hasImports) {
    fileSource = convertColJSXElements(fileSource, api);
  }
  return fileSource;
};

/**
 *
 */
const convertContainerJSXElements = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;
  return j(fileSource)
    .find(j.JSXElement)
    .forEach((path) => {
      const containerElement = matchElement(path.value, ["Container"]);
      if (!containerElement) {
        return;
      }
      renameAttribute(containerElement, "tag", "as");
    })
    .toSource();
};

/**
 *
 */
const convertRowJSXElements = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;
  return j(fileSource)
    .find(j.JSXElement)
    .forEach((path) => {
      const rowElement = matchElement(path.value, ["Row"]);
      if (!rowElement) {
        return;
      }
      renameAttribute(rowElement, "tag", "as");
    })
    .toSource();
};

/**
 *
 */
const convertColJSXElements = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;
  return j(fileSource)
    .find(j.JSXElement)
    .forEach((path) => {
      const colElement = matchElement(path.value, ["Col"]);
      if (!colElement) {
        return;
      }
      renameAttribute(colElement, "tag", "as");

      // rename `md={{ size: 10 }}` -> `md={{ span: 10 }}`
      j(path)
        .find(j.JSXAttribute)
        .forEach((path2) => {
          const sizeProp = matchAttrByName(path2.value, [
            "xs",
            "sm",
            "md",
            "lg",
            "xl",
          ]);
          if (!sizeProp) {
            return;
          }
          j(path2)
            .find(j.ObjectExpression)
            .forEach((path3) => {
              path3.value.properties.forEach((property) => {
                if (property.type !== "ObjectProperty") {
                  return;
                }
                if (property.key.type !== "Identifier") {
                  return;
                }
                if (property.key.name === "size") {
                  property.key.name = "span";
                }
              });
            });
        });
    })
    .toSource();
};
