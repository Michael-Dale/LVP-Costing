// Import necessary modules
const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require('path');


//import routes
const auditRoute = require("./routes/auditRoute");
const projectRoute = require("./routes/projectRoute");
const budgetRoute = require("./routes/budgetRoute");
const orderRoute = require("./routes/orderRoute");
const invocieRoute = require("./routes/invoiceRoute");

// Initialize express app
const app = express();

// Serve static files from node_modules
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Set default port or use environment variable
const port = process.env.PORT || 3000;

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // For JSON data

// Set EJS as the view engine for rendering views
app.set("view engine", "ejs");

// Serve static files from the 'public' directory
app.use('/node_modules', express.static(__dirname + '/node_modules'));
app.use(express.static('public'));


// Database setup
global.db = new sqlite3.Database("./mainCostDB.db", function (err) {
    if (err) {
      console.error(err.message);
      process.exit(1);
    } else {
      console.log("Database connected");
      global.db.run("PRAGMA foreign_keys=ON"); // Enable foreign key constraints
    }
  });


  // Use purchaseRoutes for handling routes starting with "/"
app.use("/", auditRoute);
app.use("/project", projectRoute);
app.use("/budget", budgetRoute);
app.use("/order", orderRoute);
app.use("/invoice", invocieRoute);


// Start the server
app.listen(port,'0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });