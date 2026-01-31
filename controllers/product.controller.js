const db = require("../config/db");
const {
  ScanCommand,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const s3 = require("../config/s3");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const TABLE = process.env.DYNAMODB_TABLE;

exports.list = async (req, res) => {
  const data = await db.send(new ScanCommand({ TableName: TABLE }));
  res.render("products", { products: data.Items || [] });
};

exports.showAdd = (req, res) => res.render("add");

exports.create = async (req, res) => {
  const { name, price, quantity } = req.body;

  if (!req.file) return res.send("Please choose an image");

  const key = `products/${Date.now()}-${req.file.originalname}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }),
  );

  const url_image = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  const item = {
    id: uuidv4(),
    name,
    price: Number(price),
    quantity: Number(quantity),
    url_image,
  };

  await db.send(new PutCommand({ TableName: TABLE, Item: item }));
  res.redirect("/products");
};

exports.showEdit = async (req, res) => {
  const { id } = req.params;

  const data = await db.send(new GetCommand({ TableName: TABLE, Key: { id } }));

  res.render("edit", { product: data.Item });
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, price, quantity } = req.body;

  let newUrl = null;

  if (req.file) {
    const key = `products/${Date.now()}-${req.file.originalname}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }),
    );

    newUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  const updateExp = newUrl
    ? "SET #n=:n, price=:p, quantity=:q, url_image=:img"
    : "SET #n=:n, price=:p, quantity=:q";

  const values = {
    ":n": name,
    ":p": Number(price),
    ":q": Number(quantity),
    ...(newUrl ? { ":img": newUrl } : {}),
  };

  await db.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { id },
      UpdateExpression: updateExp,
      ExpressionAttributeNames: { "#n": "name" },
      ExpressionAttributeValues: values,
    }),
  );

  res.redirect("/products");
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  await db.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
  res.redirect("/products");
};
