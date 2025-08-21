const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Sample route to test backend
app.get("/api/recipes", (req, res) => {
  res.json({ message: "Backend is working!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
