# Creating a Theme

{% hint style="warning" %}
As of now, Themes aren't decoupled from Dshop's repository on GitHub. But they would be split up soon. For the time being, you need to clone [Dshop's repository](https://github.com/OriginProtocol/dshop) and use that to work on your themes
{% endhint %}

### Setting up a new theme

**Step 1:** Create a new directory under `shop/src/themes` directory with the name of your theme. This is where your theme and all its related files will reside

**Step 2:** Create a JSON file `theme.json` under the new directory. The file could have the following fields:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| id | String | ✅ | A unique identifier of your theme. Usually same as the directory created in Step 1. |
| name | String | ✅ | The name of your theme as it should appear in Dshop Dashboard |
| config | Array |  | [Configurable fields](https://app.gitbook.com/@originprotocol/s/dshop/config-fields) of your theme, if any.  |

A `theme.json` file of a theme with a customisable logo should look similar to this:

{% code title="theme.json" %}
```bash
{
  "id": "mytheme",
  "name": "My Custom Theme",
  "config": [
    {
      "id": "header",
      "title": "Header",
      "fields": [
        {
          "id": "logo",
          "title": "Header Logo",
          "type": "media"
        }
      ]
    }
  ]
}
```
{% endcode %}

**Step 3:** Create a screenshot image of the theme and add it under the theme directory with the name `screenshot.png`.

**Step 4:** Add an `index.js` file. This will be starting point of your theme's code. It's required to wrap your root App component with `DshopProvider` component. This will give you access to the Dshop's current state.

A simple `index.js` file will look like this:

{% code title="index.js" %}
```bash
import React from 'react'
import ReactDOM from 'react-dom'

import DshopProvider from 'components/DshopProvider'

const MyCustomThemeApp = () => {
  return (
    <DshopProvider>
      {/* Root component of your theme here */}
    </DshopProvider>
  )
}

ReactDOM.render(<MyCustomThemeApp />, document.getElementById('app'))
```
{% endcode %}

**Step 5:** Create a Tailwind config file `tailwind.config.js` and configure it to your preference. Dshop Themes require Tailwind CSS for styling. 

That's it. Your custom theme is set up, now you can work on your Dshop theme and then build and publish it.

### Building Themes

After you have set up your theme, you have to build the theme before it appears on the Dshop Admin dashboard. 

To build a theme:

```bash
$ cd shop
$ sh buildThemes.sh your-theme-name
```

You can also build a theme and watch for any changes to rebuild. This is particularly useful during development. To do this:

```bash
$ cd shop
$ sh buildThemeDev.sh your-theme-name
```

Once you have built your theme, it should appear under Dshop's Admin Dashboard. 

