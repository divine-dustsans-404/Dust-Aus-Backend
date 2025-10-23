
// --- DUSTTALE BACKEND (one-file edition) ---
import express from "express";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_FILE = "aus.json";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://divine-dustsans-404.github.io";
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(helmet());
app.use(morgan("tiny"));
app.use(express.json());

let aus = [];
if (fs.existsSync(DATA_FILE)) {
  aus = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

app.get("/aus", (req, res) => {
  res.json(aus);
});

app.post("/aus", (req, res) => {
  const { name, author, desc, link } = req.body;
  if (!name || !author || !desc) {
    return res.status(400).json({ message: "Thiếu dữ liệu." });
  }
  const newAU = {
    id: Date.now(),
    name,
    author,
    desc,
    link: link || "Không có",
    created: new Date().toISOString()
  };
  aus.push(newAU);
  fs.writeFileSync(DATA_FILE, JSON.stringify(aus, null, 2));
  res.status(201).json({ message: "Đã lưu AU thành công!", au: newAU });
});

app.get("/", (req, res) => {
  res.send(`<h2>DUSTTALE Backend đang chạy.</h2>
  <p>Gửi POST đến /aus để thêm AU mới.</p>`);
});

app.listen(PORT, () => console.log(`Server hoạt động tại cổng ${PORT}`));
