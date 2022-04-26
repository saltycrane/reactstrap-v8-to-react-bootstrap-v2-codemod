import * as types from "jscodeshift";

import updateImports from "./updateImports";
import { matchElement, renameAttribute, renameElement } from "./util";

/**
 *
 */
export const convertCards = (fileSource: string, api: types.API) => {
  let hasImports: boolean;
  [fileSource, hasImports] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "Card",
    rsComponentsToRemove: [
      "Card",
      "CardBody",
      "CardFooter",
      "CardHeader",
      "CardImg",
      "CardImgOverlay",
      "CardLink",
      "CardSubtitle",
      "CardText",
      "CardTitle",
    ],
  });
  let hasImports2: boolean;
  [fileSource, hasImports2] = updateImports({
    api,
    fileSource,
    rbComponentToAdd: "CardGroup",
    rsComponentsToRemove: ["CardGroup"],
  });
  if (!hasImports && !hasImports2) {
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
      const cardElement = matchElement(path.value, ["Card"]);

      renameAttribute(cardElement, "color", "bg");

      // rename `tag` prop -> `as`
      const subElement = matchElement(path.value, [
        "CardBody",
        "CardFooter",
        "CardHeader",
        "CardImg",
        "CardImgOverlay",
        "CardLink",
        "CardSubtitle",
        "CardText",
        "CardTitle",
      ]);
      renameAttribute(subElement, "tag", "as");

      // rename other elements
      renameElement(path.value, "CardBody", "Card.Body");
      renameElement(path.value, "CardFooter", "Card.Footer");
      renameElement(path.value, "CardHeader", "Card.Header");
      renameElement(path.value, "CardImg", "Card.Img");
      renameElement(path.value, "CardImgOverlay", "Card.ImgOverlay");
      renameElement(path.value, "CardLink", "Card.Link");
      renameElement(path.value, "CardSubtitle", "Card.Subtitle");
      renameElement(path.value, "CardText", "Card.Text");
      renameElement(path.value, "CardTitle", "Card.Title");
    })
    .toSource();
};
