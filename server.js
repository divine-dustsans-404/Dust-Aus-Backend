import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());

// Cấu hình CORS
const ALLOWED_ORIGINS = [
  "https://divine-dustsans-404.github.io",
  "https://divine-dustsans-404.github.io/My-Aus-Wiki"
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
    else callback(new Error("Blocked by CORS policy"));
  }
}));

// Kết nối MongoDB
mongoose.connect(process.env.DATABASE_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB error:", err));

// Mô hình dữ liệu AU
const AUSchema = new mongoose.Schema({
  name: String,
  author: String,
  desc: String,
  link: String,
  date: { type: Date, default: Date.now }
});
const AU = mongoose.model("AU", AUSchema);

// API: Lấy danh sách AU
app.get("/aus", async (req, res) => {
  const aus = await AU.find().sort({ date: -1 });
  res.json(aus);
});

// API: Thêm AU mới
app.post("/aus", async (req, res) => {
  const { name, author, desc, link } = req.body;
  if (!name || !author || !desc)
    return res.status(400).json({ message: "Thiếu dữ liệu cần thiết." });

  const newAU = new AU({ name, author, desc, link });
  await newAU.save();
  res.status(201).json({ message: "AU đã được thêm thành công." });
});

// API: Xóa AU (chỉ Admin)
app.delete("/aus/:id", async (req, res) => {
  const token = req.headers["x-admin-token"];
  if (token !== process.env.ADMIN_TOKEN)
    return res.status(403).json({ message: "Sai token." });

  await AU.findByIdAndDelete(req.params.id);
  res.json({ message: "Đã xóa AU." });
});

// Server hoạt động
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server chạy ở cổng ${PORT}`));
