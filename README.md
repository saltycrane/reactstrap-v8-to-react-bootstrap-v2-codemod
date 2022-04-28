# reactstrap-v8-to-react-bootstrap-v2-codemod

- jscodeshift codemods
  - for converting from Bootstrap v4 CSS utility classes to v5
  - for converting from `reactstrap` v8 (Forms mostly) to `react-bootstrap` v2
- written in TypeScript for use on TypeScript source code
- incomplete

## Convert from `reactstrap@8` to `react-bootstrap@2`

``` sh
npm install
npm run all -- <path>
```

## Convert Bootstrap utility classes ONLY

Convert Bootstrap utility classes from v4 to v5. Incomplete. See https://getbootstrap.com/docs/5.0/migration/#utilities

``` sh
npm install
npm run bs-util-classes -- <path>
```
