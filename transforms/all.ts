import * as types from "jscodeshift";

import { convertCssUtilities } from "./bs-util-classes";
import { globalForLogging } from "./logging";
import { convertAlert } from "./rb-alert";
import { convertBadge } from "./rb-badge";
import { convertButton } from "./rb-button";
import { convertButtonGroup } from "./rb-button-group";
import { convertCards } from "./rb-cards";
import { convertCollapse } from "./rb-collapse";
import { convertForms } from "./rb-forms";
import { convertInputGroup } from "./rb-input-group";
import { convertLayout } from "./rb-layout";
import { convertListGroup } from "./rb-list-group";
import { convertNavbars } from "./rb-navbars";
import { convertNavs } from "./rb-navs";
import { convertSpinner } from "./rb-spinner";
import { convertTable } from "./rb-table";

export default function transformer(file: types.FileInfo, api: types.API) {
  globalForLogging.filepath = file.path;

  return convertAlert(
    convertBadge(
      convertButton(
        convertButtonGroup(
          convertCards(
            convertCollapse(
              convertInputGroup(
                convertForms(
                  convertLayout(
                    convertListGroup(
                      convertNavbars(
                        convertNavs(
                          convertSpinner(
                            convertTable(
                              convertCssUtilities(file.source, api),
                              api,
                            ),
                            api,
                          ),
                          api,
                        ),
                        api,
                      ),
                      api,
                    ),
                    api,
                  ),
                  api,
                ),
                api,
              ),
              api,
            ),
            api,
          ),
          api,
        ),
        api,
      ),
      api,
    ),
    api,
  );
}
