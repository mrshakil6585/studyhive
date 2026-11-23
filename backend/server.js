const express = require("express");

const app = express();
const PORT = 5000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "StudyHive backend is running!"
  });
});

app.listen(PORT, () => {
  console.log(`StudyHive backend running on port ${PORT}`);
});
