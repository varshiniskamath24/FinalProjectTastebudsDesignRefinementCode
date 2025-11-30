const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// ROUTES
app.use("/auth", require("./routes/auth"));
app.use("/donation", require("./routes/donation"));
app.use("/api", require("./routes/recommendation"));
app.use("/api/order", require("./routes/order"));
app.use("/api/restaurant", require("./routes/restaurant"));
app.use("/api/feedback", require("./routes/feedback"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✔️"))
  .catch(err => console.log("MongoDB Error ❌", err));

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on PORT: ${process.env.PORT}`)
);
