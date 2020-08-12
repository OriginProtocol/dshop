const fs = require('fs')

const rawTranslations = fs.readFileSync(`${__dirname}/../.translated_fbts.json`)
const translations = JSON.parse(rawTranslations)
const translationsDir = `${__dirname}/../public/translations`

fs.mkdirSync(translationsDir, { recursive: true })
Object.keys(translations).forEach((lang) => {
  fs.writeFileSync(
    `${translationsDir}/${lang}.json`,
    JSON.stringify(translations[lang], null, 2)
  )
})
