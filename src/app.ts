import express from "express";
const port = process.env.PORT || 1313;
const app = express();

app.get("/", (_, res) => {
  res.send("hello");
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
