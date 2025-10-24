// --- DUSTTALE BACKEND (Phiên bản nâng cấp MONGO) ---
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose"; // <-- CÔNG CỤ MỚI

// --- SỬA LỖI CORS (Giữ nguyên) ---
const PROD_ORIGIN = "https://divine-dustsans-404.github.io";
const DEV_ORIGIN = "http://localhost:2435";
const ALLOWED_ORIGINS = [PROD_ORIGIN, DEV_ORIGIN, "https://divine-dustsans-404.github.io/My-Aus-Wiki"];

// --- CÀI ĐẶT MÁY CHỦ ---
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(helmet());
app.use(morgan("tiny"));
app.use(express.json());

// --- BƯỚC 1: LẤY CHUỖI KẾT NỐI BÍ MẬT ---
// Chúng ta sẽ lấy chuỗi kết nối từ Biến Môi trường (Environment Variable) trên Render
// Nó an toàn hơn là dán trực tiếp vào code
const DB_CONNECTION_STRING = process.env.DATABASE_URI;

// --- BƯỚC 2: TẠO "KHUÔN MẪU" CHO DỮ LIỆU (SCHEMA) ---
// Định nghĩa xem một "AU" sẽ trông như thế nào trong cơ sở dữ liệu
const auSchema = new mongoose.Schema({
  name: String,
  author: String,
  desc: String,
  link: String,
  created: { type: Date, default: Date.now }
});

// Tạo một "Model" (Mô hình) từ Schema.
// Đây là công cụ chính để chúng ta tìm, tạo, xóa AUs.
const AuModel = mongoose.model("AU", auSchema);

// --- BƯỚC 3: KẾT NỐI VỚI CƠ SỞ DỮ LIỆU ---
mongoose.connect(DB_CONNECTION_STRING)
  .then(() => {
    console.log("Đã kết nối thành công với MongoDB!");
  })
  .catch((err) => {
    console.error("LỖI KẾT NỐI MONGODB:", err);
    process.exit(1); // Thoát nếu không kết nối được
  });

// --- BƯỚC 4: CẬP NHẬT CÁC ROUTE (API) ---

// Route 1: Lấy danh sách tất cả AU
app.get("/aus", async (req, res) => {
  try {
    // Thay vì đọc tệp, chúng ta dùng Model để TÌM TẤT CẢ
    const aus = await AuModel.find({}).sort({ created: -1 }); // Sắp xếp mới nhất lên đầu
    res.json(aus);
  } catch (err) {
    console.error("Lỗi khi lấy AUs:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy dữ liệu." });
  }
});

// Route 2: Gửi (POST) một AU mới
app.post("/aus", async (req, res) => {
  const { name, author, desc, link } = req.body;
  
  if (!name || !author || !desc) {
    return res.status(400).json({ message: "Thiếu dữ liệu Tên AU, Tác giả, hoặc Mô tả." });
  }

  try {
    // Tạo một AU mới bằng cách dùng "Khuôn mẫu"
    const newAU = new AuModel({
      name: name,
      author: author,
      desc: desc,
      link: link || "" // Lưu là chuỗi rỗng nếu không có link
    });

    // Thay vì ghi tệp, chúng ta LƯU (SAVE) nó vào cơ sở dữ liệu
    const savedAU = await newAU.save();
    
    res.status(201).json({ message: "Đã lưu AU thành công!", au: savedAU });
  } catch (err) {
    console.error("Lỗi khi lưu AU:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi đang cố lưu dữ liệu." });
  }
});

// Route 3: Route gốc (Giữ nguyên)
app.get("/", (req, res) => {
  res.send(`<h2>DUSTTALE Backend (Phiên bản MongoDB) đang chạy.</h2>`);
});

// Khởi động máy chủ
app.listen(PORT, () => {
  console.log(`Server hoạt động tại cổng ${PORT}`);
  console.log(`Đang chấp nhận yêu cầu từ: ${ALLOWED_ORIGINS.join(', ')}`);
});
