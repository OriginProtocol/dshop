# Configurable Fields

Configurable Fields make it easier to add dynamic content to your theme, that can include, but not limited to, logos, text, images and even color palettes.

To define these fields, you just have to update your theme's `theme.json` to define them and then use the `useThemeVars` hook to get and render your components based on the user-set values.

### Defining Sections

Configurable Fields are to be grouped under different sections. A section can be a page in your theme or a shared part/component across pages like `Header` or `Footer` components.

The `config` key in the `theme.json` accepts an array of objects defining sections.

A section definition should have the following properties:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| **id** | String | ✅ | A unique identifier for the section |
| **title** | String | ✅ | Section's name as it should appear on Theme Editor |
| **fields** | \[Field\] | ✅ | An array of field definition objects |

### Defining Fields

A field definition can have the following properties:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| **id** | String | ✅ | A unique identifier for the field |
| **title** | String | ✅ | Field's label as it should appear on Theme Editor |
| **type** | String | ✅ | The field type identifier |

At the moment, Dshop support the following field types:

| Field Type | ID | Description |
| :--- | :--- | :--- |
| **Text** | text | Renders a single or multi-line text input field |
| **Media** | media | Renders a image uploader component |
| **Products** **List** | products\_list | Renders a list of choosable products |
| **Collections List** | collections\_list | Renders a list of choosable collections |
| **Color Palettes** | color\_palettes | Shows a list of predefined color palettes |

### Type-specific properties

Some of the field types can also have additional properties in the definition:

#### Text

| Field | Type | Description |
| :--- | :--- | :--- |
| **multiline** | Boolean | Renders a multiline input when set to `true`. Defaults to `false`. |

#### Media

| Field | Type | Description |
| :--- | :--- | :--- |
| **multiple** | Boolean | Renders a multiline input when set to `true`. Defaults to `false`. |
| **count** | Boolean | Limits the number of images that user should/can upload. Always used with `multiple` property set to `true`.  |
| **description** | String\|\[String\] | A note or hint text that appears below the field title.  |

#### Color Palettes

| Field | Type | Description |
| :--- | :--- | :--- |
| **palettes** | \[PaletteObject\] | An  array of palette definition. See below |
| **colorLabels** | Object | An object with color ID as keys and the labels to use as values. |
| **fontLabels** | Object | An object with font ID as keys and the labels to use as values. |

#### PaletteObject definition

| Field | Type | Description |
| :--- | :--- | :--- |
| **id** | String | Palette's unique identifier |
| **title** | String | Name of the palette |
| **colors** | Object | An object with color ID as keys and their hex-code as values |
| **fonts** | Object | An object with font ID as keys and the font-family as values |



