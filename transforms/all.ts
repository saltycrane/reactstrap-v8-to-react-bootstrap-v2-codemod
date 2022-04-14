import * as types from "jscodeshift";

import { convertCssUtilities } from "./bs-util-classes";
import { convertButton } from "./rb-button";
import { convertForms } from "./rb-forms";
import { convertInputGroup } from "./rb-input-group";

export default function transformer(file: types.FileInfo, api: types.API) {
  return convertButton(
    convertInputGroup(
      convertForms(convertCssUtilities(file.source, api), api),
      api
    ),
    api
  );
}
