// --- DUSTTALE BACKEND (one-file edition) ---
import express from "express";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();
// Render.com sẽ tự động cung cấp cổng qua 'process.env.PORT'
const PORT = process.env.PORT || 8080;
const DATA_FILE = "aus.json";

// --- SỬA LỖI CORS BẮT ĐẦU ---

// Địa chỉ trang web Production (nơi trang web của bạn đang chạy)
// Lưu ý: Nó phải bao gồm cả tên kho lưu trữ /My-Aus-Wiki/
const PROD_ORIGIN = "https://divine-dustsans-404.github.io";

// Địa chỉ trang web Development (khi bạn chạy thử trên máy)
const DEV_ORIGIN = "http://localhost:2435";

// Danh sách các địa chỉ được phép gửi yêu cầu
// Chúng ta sẽ cho phép cả hai
const ALLOWED_ORIGINS = [PROD_ORIGIN, DEV_ORIGIN, "https://divine-dustsans-404.github.io/My-Aus-Wiki"];

app.use(cors({ origin: ALLOWED_ORIGINS }));

// --- SỬA LỖI CORS KẾT THÚC ---

app.use(helmet());
app.use(morgan("tiny"));
app.use(express.json()); // Cho phép máy chủ đọc JSON từ req.body

// Đọc dữ liệu có sẵn từ tệp
let aus = [];
try {
  if (fs.existsSync(DATA_FILE)) {
    aus = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }
} catch (err) {
  console.error("Không thể đọc tệp aus.json:", err);
}

// Route 1: Lấy danh sách tất cả AU
app.get("/aus", (req, res) => {
  res.json(aus);
});

// Route 2: Gửi (POST) một AU mới
app.post("/aus", (req, res) => {
  const { name, author, desc, link } = req.body;
  
  // Kiểm tra dữ liệu đầu vào
  if (!name || !author || !desc) {
    return res.status(400).json({ message: "Thiếu dữ liệu Tên AU, Tác giả, hoặc Mô tả." });
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
  
  // Lưu vào tệp
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(aus, null, 2));
    res.status(201).json({ message: "Đã lưu AU thành công!", au: newAU });
  } catch (err) {
    console.error("Không thể ghi tệp aus.json:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi đang cố lưu tệp." });
  }
});

// Route 3: Route gốc (Dùng để kiểm tra xem máy chủ có chạy không)
// Đây là route khắc phục lỗi "Not Found" trong ảnh 161.jpg
app.get("/", (req, res) => {
  res.send(`<h2>DUSTTALE Backend đang chạy.</h2>
  <p>Gửi POST đến /aus để thêm AU mới.</p>`);
});

// Khởi động máy chủ
app.listen(PORT, () => {
  console.log(`Server hoạt động tại cổng ${PORT}`);
  console.log(`Đang chấp nhận yêu cầu từ: ${ALLOWED_ORIGINS.join(', ')}`);
});
