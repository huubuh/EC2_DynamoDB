require("dotenv").config();
const express = require("express");
const methodOverride = require("method-override");

const productRoutes = require("./routers/product.routes");

const app = express();
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(productRoutes);

app.listen(process.env.PORT, () => {
  console.log("Server running: http://localhost:3000/products");
});
