# Translations

Dshop translations are managed by [`fbt`](https://facebook.github.io/fbt/), an
npm module by Facebook.

Strings to be translated should be wrapped in an `<fbt>` tag, for example:

    <button>Submit</button>

Becomes:

    <button>
      <fbt desc="submit">Submit</fbt>
    </button>

The `desc` property is a description of the text to be translated. In order to
be consistent throughout the codebase, we use the following conventions for `desc`:

- Use camelCase
- Prefix pages with `pagePath.PageName` eg `admin.products.Edit`
- Prefix components with `component.ComponentName`
- Short words or very common phrases can described as is, eg `Continue` or
  `Admin`
