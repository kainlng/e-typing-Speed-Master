# ⚡ e-typing Speed Master Pro - Chrome Extension

Chrome Extension (Manifest V3) chuyên dụng tự động đọc DOM và mô phỏng gõ phím hoàn thành các bài kiểm tra tốc độ gõ tiếng Nhật (phiên âm Romaji) trên trang web [e-typing.ne.jp](https://www.e-typing.ne.jp/).

---

## 🌟 Tính Năng Nổi Bật

1. **Đọc DOM Trực Tiếp (Direct DOM Extraction):**
   - Tự động nhận diện chuỗi phiên âm Romaji (ví dụ: `AKATYANNNOHADAHASUBESUBEDA`) loại trừ hoàn toàn chữ Kanji/Kana.
   - Sử dụng `MutationObserver` kết hợp cơ chế quét vòng lặp phụ (60ms) nhận biết ngay lập tức khi người dùng vừa gõ xong một đoạn và bài test chuyển sang câu tiếp theo (khoảng 15 câu).
2. **Mô Phỏng Phím Chân Thực (KeyboardEvent Dispatcher):**
   - Giả lập đầy đủ chuỗi sự kiện `keydown -> keypress -> keyup` với đầy đủ `code`, `keyCode`, `which` tương thích 100% với cơ chế bắt phím của e-typing.
   - Hỗ trợ tự động bấm phím **Spacebar** để bắt đầu bài test.
3. **Điều Chỉnh Tốc Độ Gõ (WPM - Words Per Minute):**
   - Tùy biến từ **30 WPM đến 600+ WPM** (tương đương 150 đến 3000+ CPM).
   - Tích hợp tính năng **Humanize (±15% Jitter)**: Biến thiên nhịp gõ ngẫu nhiên để giống người thật, tránh lỗi hệ thống hoặc bị nghi ngờ gian lận.
   - Tự động ngắt nghỉ ngắn (150ms - 300ms) giữa các câu mô phỏng mắt người đọc đoạn mới.
4. **Tùy Chỉnh Độ Chính Xác (Accuracy & Typo Engine):**
   - Thiết lập độ chính xác từ **80% đến 100%**.
   - Khi mô phỏng gõ sai: Thuật toán tự động chọn **phím lân cận trên bàn phím QWERTY** (như muốn gõ `K` thì bấm nhầm `J` hoặc `L`), tạm dừng khoảng 60-120ms (phản xạ nhận biết lỗi), sau đó gõ lại phím đúng để tiếp tục tiến trình.
5. **Giao Diện Điều Khiển Kép Tiện Lợi:**
   - **Bảng điều khiển nổi (Floating Widget):** Hiển thị ngay trên trang web e-typing, có thể kéo thả tự do, thu nhỏ thành bóng tròn nổi (bubble).
   - **Popup Extension:** Bấm vào biểu tượng extension trên thanh công cụ trình duyệt để điều khiển.
   - **Phím tắt nhanh:** Nhấn **`[F8]`** hoặc **`[Ctrl + Shift + X]`** để Bắt đầu / Tạm dừng gõ tức thì.

---

## 📂 Cấu Trúc Thư Mục

```
E typing/
├── manifest.json            # Cấu hình Chrome Extension (Manifest V3)
├── content/
│   ├── dispatcher.js        # Module phát sự kiện bàn phím (KeyboardEvent)
│   ├── extractor.js         # Module quét DOM, trích xuất Romaji & theo dõi đổi câu
│   ├── engine.js            # Module điều phối WPM, độ chính xác (Accuracy) & nhịp gõ
│   ├── widget.js            # Giao diện bảng điều khiển nổi trực tiếp trên trang
│   ├── widget.css           # Giao diện Dark Glassmorphism cho Widget
│   └── content.js           # Script bootstrap và liên kết giữa Top Window & Iframes
├── popup/
│   ├── popup.html           # Giao diện Popup trên thanh công cụ
│   ├── popup.css            # Định kiểu Popup
│   └── popup.js             # Logic xử lý của Popup
├── assets/
│   └── icons/               # Biểu tượng 16px, 48px, 128px
└── README.md                # Tài liệu hướng dẫn sử dụng
```

---

## 🚀 Hướng Dẫn Cài Đặt Vào Trình Duyệt Chrome / Cốc Cốc / Edge

1. Mở trình duyệt Chrome (hoặc Edge / Cốc Cốc / Brave).
2. Truy cập vào trang quản lý tiện ích bằng cách nhập đường dẫn:
   ```
   chrome://extensions/
   ```
3. Bật công tắc **"Chế độ dành cho nhà phát triển" (Developer mode)** ở góc trên cùng bên phải.
4. Nhấn vào nút **"Tải tiện ích đã giải nén" (Load unpacked)** ở góc trên bên trái.
5. Chọn thư mục dự án:
   ```
   E:\Download\Wayground-Quizizz-Cheat-main\E typing
   ```
6. Tiện ích **e-typing Speed Master Pro** sẽ xuất hiện trên danh sách tiện ích của bạn!
7. *(Khuyên dùng)* Ghim biểu tượng ⚡ của extension lên thanh công cụ trình duyệt để tiện theo dõi.

---

## 🎮 Hướng Dẫn Sử Dụng Chi Tiết

1. Truy cập vào bài kiểm tra e-typing bất kỳ, ví dụ bài kiểm tra tay nghề:
   👉 [https://www.e-typing.ne.jp/roma/check/](https://www.e-typing.ne.jp/roma/check/)
2. Nhấn nút **"今すぐチェック！"** (Kiểm tra ngay) để mở cửa sổ bài test.
3. Ngay lập tức, bạn sẽ thấy **Bảng điều khiển nổi (Floating Widget)** màu xanh tối hiện ở góc màn hình:
   - **Vùng 1 (Điều khiển):** Bấm `▶ Bắt đầu (Auto)` để kích hoạt tự động. Nếu hệ thống đang ở màn hình chờ, bạn có thể bấm `␣ Nhấn Space` hoặc để bot tự động bấm Space.
   - **Vùng 2 (Tốc độ WPM):** Kéo thanh trượt hoặc chọn các mốc định sẵn:
     - `80 WPM`: Tốc độ gõ vừa phải (Hạng B - A).
     - `150 WPM`: Gõ nhanh (Hạng S).
     - `250 WPM`: Gõ rất nhanh (Hạng Good!).
     - `400+ WPM`: Đẳng cấp Thần tốc (Ninja / Fast).
   - **Vùng 3 (Độ chính xác):** 
     - Chọn `100%`: Hoàn hảo không mắc lỗi nào.
     - Chọn `98%` hoặc `95%`: Mô phỏng có vài lỗi gõ sai phím lân cận giúp điểm số trông tự nhiên và giống người thật nhất.
   - **Vùng 4 (Tiến độ):** Theo dõi trực tiếp số câu đã hoàn thành (1/15, 2/15...), số ký tự đã gõ và số lần gõ sai.
4. Bạn có thể nhấn phím tắt **`F8`** bất cứ lúc nào để Bật / Tạm dừng bot khẩn cấp.
5. Khi kết thúc bài test, bot sẽ tự nhận diện màn hình kết quả và chuyển sang trạng thái *Đã hoàn tất!*.
