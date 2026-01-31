const express = require("express");
const router = express.Router();
const multer = require("multer");
const c = require("../controllers/product.controller");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/products", c.list);

router.get("/products/add", c.showAdd);
router.post("/products/add", upload.single("image"), c.create);

router.get("/products/edit/:id", c.showEdit);
router.put("/products/edit/:id", upload.single("image"), c.update);

router.delete("/products/delete/:id", c.remove);

module.exports = router;
