import * as types from "jscodeshift";

// Rs/rs = reactstrap
// Rb/rb = react-bootstrap

/**
 *
 */
const isRsImport = (path: types.ASTPath<types.ImportDeclaration>) =>
  path.value.source.value === "reactstrap";

/**
 *
 */
const isRbImport = (path: types.ASTPath<types.ImportDeclaration>) =>
  path.value.source.value === "react-bootstrap";

/**
 *
 */
const isRbComponentToAdd = (
  specifier:
    | types.ImportDefaultSpecifier
    | types.ImportNamespaceSpecifier
    | types.ImportSpecifier,
  rbComponentToAdd: string,
) => {
  return (
    specifier.type === "ImportSpecifier" &&
    [rbComponentToAdd].includes(specifier.imported.name)
  );
};

/**
 *
 */
type TProps = {
  api: types.API;
  fileSource: string;
  rbComponentToAdd: string;
  rsComponentsToRemove: string[];
  skipHasRsImportsCheck?: boolean;
};

const updateImports = ({
  api,
  fileSource,
  rbComponentToAdd,
  rsComponentsToRemove,
  skipHasRsImportsCheck = false,
}: TProps) => {
  const j = api.jscodeshift;

  /**
   *
   */
  const isRsComponentToRemove = (
    specifier:
      | types.ImportDefaultSpecifier
      | types.ImportNamespaceSpecifier
      | types.ImportSpecifier,
  ) => {
    const isMatch =
      specifier.type === "ImportSpecifier" &&
      rsComponentsToRemove.includes(specifier.imported.name);
    if (
      isMatch &&
      specifier.local &&
      specifier.imported.name !== specifier.local.name
    ) {
      throw Error(
        `Import aliases are not supported (${specifier.imported.name} -> ${specifier.local.name})`,
      );
    }
    return isMatch;
  };

  /**
   * Check if there are "reactstrap" imports to remove, and if not, skip this file
   */
  const hasRsImportsToRemove = j(fileSource)
    .find(j.ImportDeclaration)
    .some((path) => {
      const hasImportsToRemove = (path.value.specifiers ?? []).some(
        isRsComponentToRemove,
      );
      return isRsImport(path) && hasImportsToRemove;
    });

  if (!hasRsImportsToRemove && !skipHasRsImportsCheck) {
    return [fileSource, hasRsImportsToRemove] as const;
  }

  /**
   * updateRsImports - update "reactstrap" imports
   *
   * NOTE: run this before `addOrUpdateRbImports` to avoid duplicate import
   * declarations which causes an error
   */
  const updateRsImports = (fileSource: string) =>
    j(fileSource)
      .find(j.ImportDeclaration)
      .forEach((path) => {
        if (!isRsImport(path)) {
          return;
        }
        if (!path.value.specifiers) {
          return;
        }
        const componentsToKeep = path.value.specifiers.filter(
          (specifier) => !isRsComponentToRemove(specifier),
        );
        if (componentsToKeep.length === 0) {
          // remove the import if there are no non-form components to import
          j(path).remove();
        } else {
          // else update the import to import only the non-form components
          path.value.specifiers = componentsToKeep;
        }
      })
      .toSource();

  /**
   * addOrUpdateRbImports
   */
  const addOrUpdateRbImports = (fileSource: string) => {
    const importDeclarations = j(fileSource).find(j.ImportDeclaration);
    const rbImports = importDeclarations.filter(isRbImport);
    if (rbImports.length === 0) {
      const newRbImport = j.importDeclaration(
        [j.importSpecifier(j.identifier(rbComponentToAdd))],
        j.stringLiteral("react-bootstrap"),
      );
      if (importDeclarations.length === 0) {
        // insert new import at top of the file if there are no imports
        const root = j(fileSource);
        root.get().node.program.body.unshift(newRbImport);
        return root.toSource();
      }
      // add new import after all the existing imports
      return importDeclarations.at(-1).insertAfter(newRbImport).toSource();
    }
    if (rbImports.length === 1) {
      return rbImports
        .forEach((path) => {
          if (!path.value.specifiers) {
            return;
          }
          const hasComponentToAdd = path.value.specifiers.some((specifier) =>
            isRbComponentToAdd(specifier, rbComponentToAdd),
          );
          if (hasComponentToAdd) {
            // If the component to add is already imported from "react-bootstrap"
            // there is nothing to do
            return;
          }
          // Add the component to the existing "react-bootstrap" import
          path.value.specifiers.push(
            j.importSpecifier(j.identifier(rbComponentToAdd)),
          );
        })
        .toSource();
    }
    throw Error(
      'There were multiple "react-bootstrap" import lines. Combine them into a single import line before continuing.',
    );
  };

  return [
    addOrUpdateRbImports(updateRsImports(fileSource)),
    hasRsImportsToRemove,
  ] as const;
};

export default updateImports;
