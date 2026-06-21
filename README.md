# Quản lý công việc — Phòng Kinh tế, Hạ tầng và Đô thị, phường Thống Nhất

Trang web quản lý, theo dõi và phân công công việc của Phòng Kinh tế, Hạ tầng và Đô thị phường Thống Nhất.

Ứng dụng chạy hoàn toàn trên trình duyệt (HTML/CSS/JavaScript thuần), **không cần máy chủ**, **không cần cài đặt**. Dữ liệu được lưu cục bộ trong trình duyệt (`localStorage`) và có thể **Xuất / Nhập file** để sao lưu hoặc chia sẻ giữa các máy.

## Tính năng

- **📊 Tổng quan**: số liệu nhanh (tổng việc, đang làm, hoàn thành, quá hạn), biểu đồ theo lĩnh vực và trạng thái, cảnh báo việc sắp đến hạn / quá hạn.
- **📋 Đầu việc**: thêm / sửa / xóa công việc; phân theo lĩnh vực, cán bộ phụ trách, mức ưu tiên, hạn xử lý, tiến độ %, trạng thái; tìm kiếm và lọc.
- **📅 Lịch & hạn**: phân nhóm việc theo Quá hạn / Trong 7 ngày / Sau 7 ngày / Chưa đặt hạn.
- **👥 Cán bộ**: danh sách cán bộ và số việc đang đảm nhận, số việc quá hạn của từng người.
- **📥 Nhập từ Văn bản đến**: đọc file Excel/CSV kết xuất từ hệ Quản lý văn bản (Văn bản đến), tự nhận diện cột (Trích yếu, Lĩnh vực, Hạn xử lý, Số đến, Số ký hiệu, Cơ quan ban hành...) và biến mỗi văn bản thành một đầu việc. Có bước xem trước và ánh xạ cột, tự bỏ qua văn bản trùng.
- **⬇⬆ Sao lưu**: Xuất ra file `.json` và Nhập lại để khôi phục / chuyển máy.

## Nhập danh sách công việc từ hệ Văn bản đến

Hệ Quản lý văn bản của tỉnh (cổng có đăng nhập) **không** kết nối trực tiếp được vào trang web tĩnh này (do yêu cầu đăng nhập và chính sách bảo mật của cổng). Thay vào đó, dùng luồng **kết xuất → nhập**:

1. Đăng nhập cổng Quản lý văn bản, mở danh sách **Văn bản đến**.
2. Bấm **Kết xuất / Xuất Excel** để tải danh sách về máy.
3. Trong trang web này, vào tab **Đầu việc → 📥 Nhập từ Văn bản đến**, chọn file vừa tải.
4. Kiểm tra phần **ánh xạ cột** (web tự đoán sẵn), chọn lĩnh vực mặc định, rồi bấm **Nhập**.

## Cách dùng

Mở trực tiếp file `index.html` bằng trình duyệt là dùng được ngay. Hoặc truy cập bản đăng trên GitHub Pages (xem bên dưới).

> ⚠️ Dữ liệu lưu trên trình duyệt của từng máy. Hãy bấm **Xuất file** định kỳ để sao lưu, và **Nhập file** khi muốn dùng lại trên máy khác.

## Đăng lên GitHub Pages

1. Đẩy mã nguồn lên một repository GitHub (ví dụ `web-quan-ly-cong-viec`).
2. Vào **Settings → Pages**.
3. Mục **Source** chọn nhánh `main`, thư mục `/ (root)`, bấm **Save**.
4. Sau ít phút, web sẽ chạy tại địa chỉ `https://<tên-tài-khoản>.github.io/<tên-repo>/`.

## Công nghệ

HTML5 · CSS3 · JavaScript (vanilla) · localStorage. Không phụ thuộc thư viện ngoài.

---
*Phát triển nội bộ phục vụ công tác quản lý của Phòng Kinh tế, Hạ tầng và Đô thị phường Thống Nhất.*
