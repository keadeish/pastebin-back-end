import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";
import path from "path" ;

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler
const filePath = (relativePath: string): string =>
  path.join(__dirname, relativePath);

const client = new Client(dbConfig);
client.connect();

app.get("/", (req, res) => {
  const pathToFile = filePath("./index.html");
  res.sendFile(pathToFile);
});

app.get("/pastes", async (req, res) => {
  const dbres = await client.query('select * from pastes_table');
  res.json(dbres.rows);
});

app.get("/pastes/recent10pastes", async (req, res) => {
  const dbres = await client.query('select pasteid, name, text, title, time from pastes_table order by time asc limit 10');
  res.json(dbres.rows);
});

app.post("/pastes", async (req, res) => {
  const pasteData = req.body;
  const text = "insert into pastes_table (name, text, title, time) values ($1, $2, $3, $4) returning *" ;
  const values = [pasteData.name, pasteData.text, pasteData.title, pasteData.time];
  const dbres = await client.query(text, values);
  res.json(dbres.rows);
});

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
