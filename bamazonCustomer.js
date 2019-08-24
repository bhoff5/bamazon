var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "bamazon"
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected.");
});

function validateInput(value) {
  var integer = Number.isInteger(parseFloat(value));
  var sign = Math.sign(value);

  if (integer && sign === 1) {
    return true;
  } else {
    return "Please enter a whole number greater than 0";
  }
}

var displayProducts = function() {
  var query = "Select * FROM products";
  connection.query(query, function(err, res) {
    if (err) throw err;
    var displayTable = new Table({
      head: ["Item ID", "Product Name", "Department", "Price", "Inventory"],
      colWidths: [10, 25, 25, 15, 15]
    });
    for (var i = 0; i < res.length; i++) {
      displayTable.push([
        res[i].item_id,
        res[i].product_name,
        res[i].department_name,
        res[i].price,
        res[i].stock_quantity
      ]);
    }
    console.log(displayTable.toString());
    purchasePrompt();
  });
};

function purchasePrompt() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "item_id",
        message: "Enter the Item ID you would like to purchase: ",
        validate: validateInput,
        filter: Number
      },
      {
        type: "input",
        name: "quantity",
        message: "Enter the quantity you would like to purchase: ",
        validate: validateInput,
        filter: Number
      }
    ])
    .then(function(input) {
      var item = input.item_id;
      var quantity = input.quantity;

      var queryStr = "SELECT * FROM products WHERE ?";

      connection.query(queryStr, { item_id: item }, function(err, data) {
        if (err) throw err;

        if (data.length === 0) {
          console.log("Error: Invalid Item ID.");
          displayProducts();
        } else {
          var productData = data[0];

          if (quantity <= productData.stock_quantity) {
            var updateQueryStr =
              "UPDATE products SET stock_quantity = " +
              (productData.stock_quantity - quantity) +
              " WHERE item_id = " +
              item;

            connection.query(updateQueryStr, function(err, data) {
              if (err) throw err;

              console.log(
                "Order placed! Your total is $" + productData.price * quantity
              );
              console.log("Thanks for shopping at Bamazon!");

              connection.end();
            });
          } else {
            console.log("Insufficient quantity! Please change your order.");

            displayProducts();
          }
        }
      });
    });
}

displayProducts();
