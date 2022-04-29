import * as types from "jscodeshift";

import updateImports from "./updateImports";
import {
  addAttrLiteral,
  hasAttribute,
  matchElement,
  removeAttribute,
  renameAttribute,
  renameOrAddAttribute,
  updateAttrString,
} from "./util";

/**
 *
 */
export const convertButton = (fileSource: string, api: types.API) => {
  let hasImports: boolean;
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "Button",
    rsComponentsToRemove: ["Button"],
  });
  [fileSource] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "ButtonProps",
    rsComponentsToRemove: ["ButtonProps"],
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
    .replaceWith((path) => {
      let buttonElement = matchElement(path.value, ["Button"]);
      if (!buttonElement) {
        return path.value;
      }

      // rename `Button` props
      renameAttribute(buttonElement, "tag", "as");
      renameAttribute(buttonElement, "innerRef", "ref");

      // Rename `color` -> `variant`.  Also if the `color` prop doesn't exist, add
      // `variant="secondary"` because the default for react-bootstrap is primary
      // instead of seconadary.
      renameOrAddAttribute(buttonElement, "color", "variant", "secondary", api);

      // Remove `outline` prop and change `variant` value to add "outline-" prefix
      if (hasAttribute(buttonElement, "outline")) {
        removeAttribute(buttonElement, "outline");
        if (hasAttribute(buttonElement, "variant")) {
          updateAttrString(buttonElement, "variant", api, (currentValue) => {
            return `outline-${currentValue}`;
          });
        } else {
          addAttrLiteral(buttonElement, "variant", "outline-secondary", api);
        }
      }

      // remove `block` prop and wrap button with `<div className="d-grid w-100">`
      if (hasAttribute(buttonElement, "block")) {
        removeAttribute(buttonElement, "block");
        // buttonElement = j.jsxElement(
        //   j.jsxOpeningElement(j.jsxIdentifier("div"), [
        //     j.jsxAttribute(
        //       j.jsxIdentifier("className"),
        //       j.literal("d-grid w-100"),
        //     ),
        //   ]),
        //   j.jsxClosingElement(j.jsxIdentifier("div")),
        //   [buttonElement],
        // );
        buttonElement = j(`
          <div className="d-grid w-100">
            ${j(buttonElement).toSource()}
          </div>
        `).nodes()[0];
      }

      return buttonElement;
    })
    .toSource();
};
