// --- DUSTTALE BACKEND (Phiên bản nâng cấp MONGO + DELETE) ---
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
const DB_CONNECTION_STRING = process.env.DATABASE_URI;

// --- BƯỚC 2: TẠO "KHUÔN MẪU" CHO DỮ LIỆU (SCHEMA) ---
const auSchema = new mongoose.Schema({
  name: String,
  author: String,
  desc: String,
  link: String,
  created: { type: Date, default: Date.now }
});

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

// Route 1: Lấy danh sách tất cả AU (Giữ nguyên)
app.get("/aus", async (req, res) => {
  try {
    const aus = await AuModel.find({}).sort({ created: -1 });
    res.json(aus);
  } catch (err) {
    console.error("Lỗi khi lấy AUs:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy dữ liệu." });
  }
});

// Route 2: Gửi (POST) một AU mới (Giữ nguyên)
app.post("/aus", async (req, res) => {
  const { name, author, desc, link } = req.body;
  
  if (!name || !author || !desc) {
    return res.status(400).json({ message: "Thiếu dữ liệu Tên AU, Tác giả, hoặc Mô tả." });
  }

  try {
    const newAU = new AuModel({
      name: name,
      author: author,
      desc: desc,
      link: link || ""
    });

    const savedAU = await newAU.save();
    res.status(201).json({ message: "Đã lưu AU thành công!", au: savedAU });
  } catch (err) {
    console.error("Lỗi khi lưu AU:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi đang cố lưu dữ liệu." });
  }
});

// --- (THÊM MỚI) ROUTE 4: XÓA (DELETE) MỘT AU ---
// :id là một biến, nó sẽ là ID của AU cần xóa
app.delete("/aus/:id", async (req, res) => {
  // 1. Lấy "chìa khóa" mà người dùng gửi
  // (Chúng ta sẽ gửi nó trong một thứ gọi là "header")
  const token = req.headers['authorization'];
  
  // 2. Lấy "chìa khóa" bí mật lưu trên Render
  const SECRET_TOKEN = process.env.ADMIN_TOKEN;

  // 3. Kiểm tra chìa khóa
  if (!token || token !== SECRET_TOKEN) {
    // Nếu không có chìa khóa, hoặc chìa khóa sai -> CẤM!
    return res.status(403).json({ message: "Không có quyền! Sai mật khẩu Admin." });
  }

  // 4. Nếu chìa khóa đúng -> Tiến hành xóa
  try {
    const auId = req.params.id; // Lấy ID từ đường dẫn (URL)
    
    // Tìm AU bằng ID và xóa nó
    const deletedAU = await AuModel.findByIdAndDelete(auId);

    if (!deletedAU) {
      // Nếu không tìm thấy AU có ID đó
      return res.status(404).json({ message: "Không tìm thấy AU để xóa." });
    }

    // Gửi thông báo thành công
    res.status(200).json({ message: "Đã xóa AU thành công!", au: deletedAU });

  } catch (err) {
    console.error("Lỗi khi xóa AU:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi đang cố xóa." });
  }
});
// --- KẾT THÚC THÊM MỚI ---


// Route 3: Route gốc (Giữ nguyên)
app.get("/", (req, res) => {
  res.send(`<h2>DUSTTALE Backend (Phiên bản MongoDB) đang chạy.</h2>`);
});

// Khởi động máy chủ
app.listen(PORT, () => {
  console.log(`Server hoạt động tại cổng ${PORT}`);
  console.log(`Đang chấp nhận yêu cầu từ: ${ALLOWED_ORIGINS.join(', ')}`);
});
