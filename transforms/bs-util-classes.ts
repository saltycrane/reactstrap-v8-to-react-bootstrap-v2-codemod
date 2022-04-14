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
  const j = api.jscodeshift;

  return j(fileSource)
    .find(j.JSXAttribute)
    .forEach((path) => {
      const attrName = path.value.name.name;
      if (attrName !== "className") {
        return;
      }
      if (path.value.value?.type !== "StringLiteral") {
        return;
      }
      let className = path.value.value.value;

      // replace `ml-*` with `ms-*` and `pl-*` with `ps-*`
      className = className.replace(/(\b[mp])l-(\d|auto)\b/, "$1s-$2");

      // replace `mr-*` with `me-*` and `pr-*` with `pe-*`
      className = className.replace(/\b([mp])r-(\d|auto)\b/, "$1e-$2");

      // replace `font-weight-*` with `fw-*`
      className = className.replace(
        /\bfont-weight-(bold|bolder|normal|light|lighter)\b/,
        "fw-$1"
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

      path.value.value.value = className;
    })
    .toSource();
};
