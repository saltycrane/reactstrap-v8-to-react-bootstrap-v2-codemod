// Convert Bootstrap utility classes from v4 to v5
// https://getbootstrap.com/docs/5.0/migration/#utilities
//
import * as types from "jscodeshift";

/**
 *
 */
export default function transformer(file: types.FileInfo, api: types.API) {
  return convertCssUtilities(file.source, api);
}

/**
 *
 */
export const convertCssUtilities = (fileSource: string, api: types.API) => {
  return convertVariableDeclarators(
    convertAssignmentPatterns(convertJSXElements(fileSource, api), api),
    api,
  );
};

/**
 *
 */
const convertJSXElements = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;

  return j(fileSource)
    .find(j.JSXAttribute)
    .forEach((path) => {
      const attrName = path.value.name.name;
      if (typeof attrName !== "string") {
        return;
      }
      if (!attrName.includes("className") && !attrName.includes("ClassName")) {
        return;
      }
      j(path)
        .find(j.StringLiteral)
        .forEach((path2) => {
          path2.value.value = convertClassName(path2.value.value);
        });
      j(path)
        .find(j.TemplateElement)
        .forEach((path2) => {
          path2.value.value.raw = convertClassName(path2.value.value.raw);
        });
    })
    .toSource();
};

/**
 *
 */
const convertAssignmentPatterns = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;

  return j(fileSource)
    .find(j.AssignmentPattern)
    .forEach((path) => {
      const left = path.value.left;
      if (left.type !== "Identifier") {
        return;
      }
      if (
        !left.name.includes("className") &&
        !left.name.includes("ClassName")
      ) {
        return;
      }
      const right = path.value.right;
      if (right.type !== "StringLiteral") {
        return;
      }
      right.value = convertClassName(right.value);
    })
    .toSource();
};

/**
 *
 */
const convertVariableDeclarators = (fileSource: string, api: types.API) => {
  const j = api.jscodeshift;

  return j(fileSource)
    .find(j.VariableDeclarator)
    .forEach((path) => {
      if (path.value.id.type !== "Identifier") {
        return;
      }
      if (
        !path.value.id.name.includes("className") &&
        !path.value.id.name.includes("ClassName")
      ) {
        return;
      }
      j(path)
        .find(j.StringLiteral)
        .forEach((path2) => {
          path2.value.value = convertClassName(path2.value.value);
        });
      j(path)
        .find(j.TemplateElement)
        .forEach((path2) => {
          path2.value.value.raw = convertClassName(path2.value.value.raw);
        });
    })
    .toSource();
};

/**
 *
 */
const convertClassName = (className: string) => {
  // replace `ml-*` with `ms-*` and `pl-*` with `ps-*`
  className = className.replace(/(\b[mp])l-(\d|auto)\b/, "$1s-$2");

  // replace `mr-*` with `me-*` and `pr-*` with `pe-*`
  className = className.replace(/\b([mp])r-(\d|auto)\b/, "$1e-$2");

  // replace `font-weight-*` with `fw-*`
  className = className.replace(
    /\bfont-weight-(bold|bolder|normal|light|lighter)\b/,
    "fw-$1",
  );

  // replace `font-style-*` with `fst-*`
  className = className.replace(/\bfont-style-(italic|normal)\b/, "fst-$1");

  // `border-left` -> `border-start`
  className = className.replace(/\bborder-left\b/, "border-start");

  // `border-right` -> `border-end`
  className = className.replace(/\bborder-right\b/, "border-end");

  // `float-left` -> `float-start`
  className = className.replace(/\bfloat-left\b/, "float-start");

  // `float-right` -> `float-end`
  className = className.replace(/\bfloat-right\b/, "float-end");

  // `text-left` -> `text-start`
  className = className.replace(/\btext-left\b/, "text-start");

  // `text-right` -> `text-end`
  className = className.replace(/\btext-right\b/, "text-end");

  return className;
};
