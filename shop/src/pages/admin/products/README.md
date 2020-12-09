Types and relationships

---------------------------------------------

Edit.js:

'options' are of the type Array<string>
	Example: In a shop that sells clothes, 'options' could look like ["Size", "Color"]

'availableOptions' are of the type Array<Array<string>>
	Example: [["Small", "Medium", "Large"], ["Red", "Blue", "Green"]]
Note: The variable 'availableOptions' does not imply that the owner of the shop will have that option listed as "available" to their customer. The term just implies that the shop owner has added the items therein on the product management page. Please see the variants.available flag below, set when the shop owner intends to make a variant "available" to their customer.


'variants' are of the type Array<Object>. Each object within the array may have properties such as 'available', 'id', 'image', etc
	Example: [{available: true, id: 0, image: undefined, name: "Product 2 - Small / Red", option1: "Small", option2: "Red", options: ["Small", "Red"], price: "1.00", title: "Product 2 - Small / Red"}, {...}, {...}, {...}]

----------------------------------------------