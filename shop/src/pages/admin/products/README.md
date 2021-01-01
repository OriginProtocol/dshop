### Types and relationships

---

#### Edit.js:

- _options_ are of the type <Array<string>>  Example: In a shop that sells
  clothes, _options_ could look like ["Size", "Color"]

- _individualOpts_ are of the type <Array<string>>  Generated when a shop admin
  edits a product's _options_, these arrays eventually make up
  _availableOptions_. See \_EditOption.js for more. Examples:

  - ["Small", "Medium", "Large"]
  - ["Red", "Blue", "Green"]

- _availableOptions_ are of the type <Array<Array<string>>>  Example: [["Small",
  "Medium", "Large"], ["Red", "Blue", "Green"]] Note: The variable
  _availableOptions_ does not imply that the owner of the shop will have that
  option listed as "available" to their customer. The term just implies that the
  shop owner has added the items therein on the product management page. Please
  see the variants.available flag below, set when the shop owner intends to make
  a variant "available" to their customer.

- _variants_ are of the type <Array<Object>>  Each object within the array may
  have properties such as 'available', 'id', 'image', etc. Example: [{available:
  true, id: 0, image: undefined, name: "Product 2 - Small / Red", option1:
  "Small", option2: "Red", options: ["Small", "Red"], price: "1.00", title:
  "Product 2 - Small / Red"}, {...}, {...}, {...}]

---
