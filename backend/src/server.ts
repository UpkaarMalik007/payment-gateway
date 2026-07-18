import dotenv from "dotenv";
import app from "./app";
import "./workers/notificationWorker";

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});