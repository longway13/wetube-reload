import mongoose from "mongoose";

mongoose.connect(process.env.DB_URL);
mongoose.set("strictQuery", false);
mongoose.Schema.Types.String.checkRequired((v) => typeof v === "string");
// mongodb://127.0.0.1:27017/
const db = mongoose.connection;
const handleOpen = () => {
  console.log("✅Connected to DB");
};
db.on("error", (error) => console.log("DB Error", error));
db.once("open", handleOpen);
