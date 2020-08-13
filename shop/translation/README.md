# Translations

Dshop translations are managed by [`fbt`](https://facebook.github.io/fbt/), an
npm module by Facebook.

Strings to be translated should be wrapped in an `<fbt>` tag, for example:

```html
<button>Submit</button>
```

Becomes:

```html
<button>
  <fbt desc="submit">Submit</fbt>
</button>
```

The `desc` property is a description of the text to be translated. In order to
be consistent throughout the codebase, we use the following conventions for
`desc`:

- Short words or common phrases can described as is, eg `Continue` or `Admin`
- For longer or very specific strings, use camel case and a prefix:
  - For pages, prefix with `pagePath.PageName` eg `admin.products.Edit`
  - For components, prefix with `component.ComponentName`
