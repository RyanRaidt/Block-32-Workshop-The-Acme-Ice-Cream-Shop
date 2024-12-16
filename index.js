require("dotenv").config();
const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL);
const express = require("express");
const app = express();

app.use(express.json());
app.use(require("morgan")("dev"));

//Read all flavors
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = /*sql*/ `
      SELECT * FROM flavors ORDER BY created_at DESC
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//Read single flavor
app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = /*sql*/ `
      SELECT * FROM flavors WHERE id = $1
    `;
    const response = await client.query(SQL, [req.params.id]);
    if (response.rows.length === 0)
      return res.status(404).send("Flavor not found");
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//Create a new flavor
app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = /*sql*/ `
      INSERT INTO flavors(name, is_favorite)
      VALUES($1, $2)
      RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
    ]);
    res.status(201).send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//Update an existing flavor
app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = /*sql*/ `
      UPDATE flavors
      SET name = $1, is_favorite = $2, updated_at = now()
      WHERE id = $3
      RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    if (response.rows.length === 0)
      return res.status(404).send("Flavor not found");
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//Delete a flavor
app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = /*sql*/ `
      DELETE FROM flavors
      WHERE id = $1
    `;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  await client.connect();

  let SQL = /*sql*/ `
    DROP TABLE IF EXISTS flavors;

CREATE TABLE flavors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`;
  await client.query(SQL);
  console.log("table created");

  SQL = /*sql*/ `
    INSERT INTO flavors (name, is_favorite) VALUES
('Vanilla', true),
('Chocolate', false),
('Strawberry', true),
('Mint Chocolate Chip', false),
('Cookies and Cream', true);
`;
  await client.query(SQL);
  console.log("data seeded");

  const port = process.env.PORT;
  app.listen(port, () => console.log(`listening on  port ${port}`));
};
init();
