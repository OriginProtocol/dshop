# Translation
Note: Most of the code related to translation is (shamelessly) copied over from [origin repo](https://github.com/originprotocol/origin).

## Adding a new language

1. Update `shop/scripts/crowdinToFbt.js` file, line number 9, to add the new locale to the `locales` array
2. Create a new file `shop/translation/crowding/all-messages_{{NEW_LOCALE_HERE}}.json` with the contents of `shop/translation/crowding/all-messages.json` 
3. Run `npm run translate`
