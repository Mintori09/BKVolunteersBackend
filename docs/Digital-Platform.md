# Tổng Quan Dự Án: Xây Dựng Nền Tảng Số Hóa Các Chiến Dịch Tình Nguyện - Gây Quỹ Cho Liên Chi Đoàn Và Câu Lạc Bộ Trong Trường Đại Học Bách Khoa - Đại Học Đà Nẵng

---

## I. Đối Tượng Người Dùng

Dự án phục vụ **3 đối tượng chính**:

| Đối tượng             | Mô tả                                                              | Vai trò chính                                          |
| --------------------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Sinh viên**         | Thuộc trường Đại học Bách khoa, Đại học Đà Nẵng                    | Tìm kiếm, đăng ký tham gia hoạt động tình nguyện       |
| **BCH LCĐ & BCN CLB** | Ban Chấp hành Liên Chi đoàn các khoa, Ban Chủ nhiệm các Câu lạc bộ | Tổ chức các hình thức tình nguyện khác nhau            |
| **Đoàn Trường**       | Đơn vị quản lý cấp cao                                             | Sơ duyệt, phê duyệt kế hoạch, sao lưu dữ liệu, báo cáo |

> **Lưu ý:** Đoàn Trường có đầy đủ chức năng của BCH LCĐ và BCN CLB, có thể tự tổ chức chiến dịch.

---

## II. Chức Năng Hệ Thống

### 1. Chức Năng Chung

#### a) Đăng nhập và xác thực người dùng

Cung cấp cơ chế xác thực đa chiều nhằm cung cấp quyền cũng như phạm vi truy cập hệ thống:

- **Đối với sinh viên:** Tích hợp **Single Sign-On** thông qua email sinh viên do nhà trường cấp (`@sv1.dut.udn.vn`)
- **Đối với BCH LCĐ/CLB và Đoàn Trường:** Hệ thống cung cấp tài khoản quản trị riêng biệt với cơ chế **phân quyền**
- **Giao diện đăng nhập:**
    - Không cần phân quyện trước
    - Sinh viên có thể đăng nhập bằng **username và password là mã số sinh viên** (thay thế SSO nếu muốn)
    - **Không có chức năng đăng ký** tài khoản mới
- **Cấp tài khoản:**
    - Sinh viên: Tự động cấp
    - BCH LCĐ và BCN CLB: Do **Đoàn Trường cấp**

#### b) Tra cứu và xem thông tin chiến dịch

- Giao diện trực quan xem danh sách chiến dịch đã được **Đoàn Trường duyệt**
- **Tìm kiếm và lọc** theo tiêu chí đa dạng:
    - **Trạng thái:** Đang mở đăng ký / Sắp diễn ra
    - **Đơn vị tổ chức:** Khoa Công nghệ Thông tin, Khoa Điện, Câu lạc bộ ProTech...
    - **Loại hình hoạt động:** hiến máu, ủng hộ gây quỹ, quyên góp quần áo cũ...

---

### 2. Chức Năng Dành Cho Sinh Viên

| Chức năng                                  | Mô tả                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **Đăng ký tham gia Tình nguyện viên**      | Dành cho hoạt động yêu cầu **hiện diện vật lý**, giới hạn số lượng (tiếp sức mùa thi, hiến máu...)           |
| **Tham gia gây quỹ, quyên góp trực tuyến** | Không giới hạn không gian và số lượng; tích hợp **mã QR thanh toán** có nội dung chuyển khoản định danh      |
| **Quản lý lịch sử hoạt động**              | Lưu trữ toàn bộ lịch sử tham gia và đóng góp; xem tình trạng nhận GCN, biên lai giao dịch                    |
| **Quản lý hồ sơ cá nhân**                  | Cập nhật: số điện thoại, ảnh đại diện, mật khẩu; hệ thống **tự động lấy**: MSSV, họ tên, lớp sinh hoạt, khoa |

> **Lưu ý:** Kiểm tra sinh viên có tham gia CLB hay không — danh sách này do **BCH CLB phê duyệt, xóa, chỉnh sửa**.

---

### 3. Chức Năng Dành Cho BCH LCĐ / BCN CLB

| Chức năng                       | Mô tả                                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Quản lý chiến dịch**          | Tạo chiến dịch đa dạng theo từng Khoa/CLB; **lưu nháp** và chỉnh sửa trước khi gửi Đoàn Trường phê duyệt |
| **Quản lý sinh viên tham gia**  | Lọc và **duyệt hàng loạt** danh sách TVV; **xuất danh sách** theo mẫu báo cáo chuẩn                      |
| **Quản lý tài chính**           | Xem xét minh chứng chuyển khoản, duyệt và **công khai danh sách** ủng hộ                                 |
| **Cấp Giấy chứng nhận điện tử** | Upload mẫu GCN, **tự động chèn thông tin**; gửi email đính kèm; **thông báo qua tài khoản website**      |

---

### 4. Chức Năng Dành Cho Đoàn Trường

#### a) Quản lý toàn bộ chiến dịch

- **Xem toàn bộ** danh sách chiến dịch do các LCĐ/CLB khởi tạo
- **Cơ chế phê duyệt 2 bước bắt buộc:**

| Bước                 | Mô tả                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Sơ duyệt**         | Kiểm tra hồ sơ ban đầu, xem xét kế hoạch, để lại **nhận xét và chỉ đạo** trực tiếp trên hồ sơ                    |
| **Duyệt chính thức** | Chỉ kích hoạt sau khi đã sơ duyệt; chuyển trạng thái sang **"Công khai"** — cho phép sinh viên đăng ký/quyên góp |

- **Quy trình trạng thái chiến dịch:**

```
[Nháp] → [Chờ sơ duyệt] → [Yêu cầu chỉnh sửa] → [Đã sơ duyệt] → [Đang diễn ra] → [Đã kết thúc]
```

- **Lưu trữ sau khi kết thúc:** Kế hoạch ban đầu, biên bản đã duyệt, danh sách sinh viên, báo cáo tài chính — toàn bộ **lưu trữ trực tuyến**

#### b) Quản lý các Liên Chi đoàn và Câu lạc bộ

| Chức năng                  | Chi tiết                                                          |
| -------------------------- | ----------------------------------------------------------------- |
| **Phân cấp quản lý**       | Khởi tạo tài khoản, thiết lập thông tin định danh                 |
| **Quản lý quyền truy cập** | Cấp lại mật khẩu; **khóa tài khoản tạm thời** nếu vi phạm quy chế |
| **Báo cáo so sánh**        | Dựa trên dữ liệu tổng hợp từ các chiến dịch                       |

#### c) Quản lý sinh viên

- Xem và tra cứu hồ sơ sinh viên
- **"Hồ sơ tình nguyện" chi tiết:**
    - Số chiến dịch đã tham gia
    - Tổng số tiền đã đóng góp
    - Các GCN đã được cấp
- **Cảnh báo hoặc khóa tài khoản** sinh viên trên hệ thống

---

## III. Quy Trình Tạo Chiến Dịch (5 Phần)

> **Mẹo UX:** Thiết kế **progress bar** hiển thị 5 bước, cho phép lưu nháp và quay lại chỉnh sửa; giao diện **wizard-style** giúp người dùng không bị choáng ngợp.

### Phần 1: Thông tin cơ bản

| Trường thông tin        | Mô tả                          |
| ----------------------- | ------------------------------ |
| Tên chiến dịch          | Bắt buộc                       |
| Logo                    | Hình ảnh đại diện              |
| Thumbnail (ảnh bìa)     | Banner chiến dịch              |
| Slogan chiến dịch       | Ngắn gọn, ấn tượng             |
| Mô tả chiến dịch        | Nội dung chi tiết              |
| **Hình thức hoạt động** | Chọn 1 trong các loại bên dưới |

**Các hình thức hoạt động:**

| Loại                                  | Mô tả                                                  |
| ------------------------------------- | ------------------------------------------------------ |
| `hiến_máu`                            | Hoạt động hiến máu                                     |
| `tinh_nguyen_truc_tuyen`              | Hoạt động tình nguyện trực tuyến                       |
| `gay_quy`                             | Hoạt động gây quỹ                                      |
| `quyen_gop_hien_vat`                  | Hoạt động quyên góp hiện vật                           |
| `tinh_nguyen_co_gay_quy_va_quyen_gop` | Tình nguyện (gây quỹ + quyên góp hiện vật)             |
| `tinh_nguyen_hai_giai_doan`           | Giai đoạn 1: gây quỹ/quyên góp; Giai đoạn 2: tuyển TVV |

---

### Phần 2: Cấu hình theo loại hoạt động

#### ✅ Đối với hoạt động **hiến máu** / **tình nguyện trực tuyến**

- Chỉ nhập: **Số lượng tuyển TVV cần tham gia**
- **→ Chuyển trực tiếp sang Phần 5**

---

#### ✅ Đối với hoạt động **quyên góp hiện vật**

| Cấu hình            | Chi tiết                                                       |
| ------------------- | -------------------------------------------------------------- |
| Loại hiện vật       | Chọn từ danh sách                                              |
| Thời gian tiếp nhận | Từ ngày → đến ngày; HOẶC ngày cố định; HOẶC nhiều ngày rời rạc |
| Giờ tiếp nhận       | Từ giờ → đến giờ _(có thể bỏ qua)_                             |
| Địa điểm tiếp nhận  | Địa chỉ cụ thể                                                 |
| **Số lượng**        | **Không giới hạn** — chỉ đăng ký trước                         |
| **Ràng buộc**       | **Không** ràng buộc theo khoa, lớp — ai cũng tham gia được     |

- Quy trình: Sinh viên đăng ký → Ban tổ chức duyệt → **Thông báo về tài khoản sinh viên**
- **→ Chuyển trực tiếp sang Phần 5**

---

#### ✅ Đối với hoạt động **gây quỹ**

| Cấu hình            | Chi tiết                           |
| ------------------- | ---------------------------------- |
| Mã QR ngân hàng     | Upload file ảnh                    |
| Thông tin ngân hàng | Ngân hàng, số tài khoản            |
| Người nhận          | Họ tên người thụ hưởng             |
| Thời gian diễn ra   | Từ ngày → đến ngày                 |
| Số tiền mục tiêu    | Mục tiêu gây quỹ                   |
| **Số lượng**        | **Không giới hạn**                 |
| **Ràng buộc**       | **Không** ràng buộc theo khoa, lớp |

- **→ Chuyển trực tiếp sang Phần 5**

---

#### ✅ Đối với hoạt động **hai giai đoạn**

1. **Chọn giai đoạn đầu:** `gây_quy` hoặc `quyen_gop` (hoặc cả hai)
2. **→ Chuyển sang Phần 3** (nhập thông tin tương tự Phần 2)
3. Sau khi hoàn thành → **Chuyển sang Phần 4**

---

### Phần 3: Cấu hình giai đoạn đầu (chỉ cho hoạt động 2 giai đoạn)

- Thông tin tương tự **Phần 2** của hoạt động gây quỹ/quyên góp
- Sau hoàn thành → **Chuyển sang Phần 4**

---

### Phần 4: Cấu hình giai đoạn hai (tuyển TVV)

| Cấu hình                 | Chi tiết                                                |
| ------------------------ | ------------------------------------------------------- |
| Số lượng tuyển TVV       | Số lượng cần tuyển                                      |
| **Ràng buộc thành viên** | **BCH LCĐ:** Không ràng buộc / Chỉ sinh viên trong khoa |
|                          | **BCN CLB:** Không ràng buộc / Chỉ sinh viên trong CLB  |
| Các công việc cần làm    | Mô tả chi tiết nhiệm vụ                                 |

---

### Phần 5: Địa điểm và tài liệu

| Trường                  | Điều kiện                                                             |
| ----------------------- | --------------------------------------------------------------------- |
| Địa điểm diễn ra        | **Bắt buộc** cho hoạt động hiến máu, tình nguyện offline, 2 giai đoạn |
|                         | **Có thể bỏ qua** cho hoạt động trực tuyến, gây quỹ, quyên góp đơn lẻ |
| Upload kế hoạch, dự trù | File **PDF** do đơn vị tổ chức chuẩn bị                               |

> **Lưu ý:** Hoạt động 2 giai đoạn → chọn địa điểm dựa vào **giai đoạn 2**

---

## IV. Quy Trình Theo Dõi Và Kết Thúc Chiến Dịch

### Theo dõi trong quá trình diễn ra

- Theo dõi **từng giai động**
- Xem **số lượng và danh sách TVV** tham gia
- **Thao tác:** Xem → Duyệt → **Duyệt hàng loạt** → Xóa
- **Thông báo:** Sau duyệt/xóa → **Thông báo về tài khoản sinh viên**
- Nếu có gây quỹ: Xem và **phê duyệt danh sách ủng hộ**, **công khai** danh sách

### Khi chiến dịch kết thúc

| Hành động                    | Mô tả                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| Upload ảnh sự kiện           | Tài liệu hình ảnh minh chứng                                                                           |
| Mô tả công việc đã thực hiện | Kết quả đạt được                                                                                       |
| **Gửi chứng nhận**           | **Tự động gửi email** GCN cho từng TVV                                                                 |
| **Đánh dấu hoàn thành**      | Giao diện chuyển thành **"Đã hoàn thành"**                                                             |
| Hiển thị công khai           | Ảnh sự kiện, công việc đã làm, danh sách quyên góp/ủng hộ (nếu có), danh sách TVV giai đoạn 2 (nếu có) |

---

## V. Cơ Chế Phê Duyệt Đặc Biệt

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  BCH LCĐ/CLB    │────→│  Đoàn Trường    │────→│  BCH LCĐ/CLB    │
│  Tạo chiến dịch │     │  Sơ duyệt       │     │  Chỉnh sửa (nếu │
│  → Gửi duyệt    │     │  → Duyệt chính  │     │  cần) → Gửi lại │
└─────────────────┘     │  thức           │     └─────────────────┘
                        └─────────────────┘              ↓
                               ↓                  ┌─────────────┐
                        ┌─────────────────┐       │  Đã duyệt   │
                        │  THÔNG BÁO về   │←──────┘  → Chọn   │
                        │  đơn vị tổ chức │              thời    │
                        └─────────────────┘              điểm    │
                               ↓                    công khai  │
                        ┌─────────────────┐                      │
                        │  BCH LCĐ/CLB    │←───────────────────┘
                        │  ****CHỦ ĐỘNG****
                        │  chọn thời điểm  │
                        │  CÔNG KHAI      │
                        │  chiến dịch     │
                        └─────────────────┘
```

> **Quy tắc vàng:** Dù đã được Đoàn Trường phê duyệt, chiến dịch **vẫn chưa tự động công khai** — đơn vị tổ chức chủ động chọn thời điểm phù hợp.

---

## VI. Giải Mã Mã Số Sinh Viên

**Cấu trúc:** `9 chữ số` — `XXX YY ZZZZ`

**Ví dụ:** `105220050`

| Vị trí                | Ý nghĩa                             | Giá trị ví dụ     |
| --------------------- | ----------------------------------- | ----------------- |
| `XXX` (3 ký tự đầu)   | **Mã khoa** quản lý                 | `105` → Khoa Điện |
| `YY` (2 ký tự tiếp)   | **Năm tuyển sinh**                  | `22` → Khóa 2022  |
| `ZZZZ` (4 ký tự cuối) | **Số thứ tự** SV trong khoa, năm đó | `0050`            |

### Bảng mã Khoa

| Mã  | Khoa                         | Mã  | Khoa                              |
| :-: | ---------------------------- | :-: | --------------------------------- |
| 101 | Khoa Cơ khí                  | 109 | Khoa XD Cầu Đường                 |
| 102 | **Khoa Công nghệ Thông tin** | 110 | Khoa XD Dân dụng & Công nghiệp    |
| 103 | Khoa Cơ khí Giao thông       | 111 | Khoa XD Công trình thủy           |
| 104 | Khoa CN Nhiệt–Điện lạnh      | 117 | Khoa Môi trường                   |
| 105 | **Khoa Điện**                | 118 | Khoa Quản lý dự án                |
| 106 | Khoa Điện tử Viễn thông      | 121 | Khoa Kiến trúc                    |
| 107 | Khoa Hóa                     | 123 | Khoa Khoa học Công nghệ tiên tiến |

---

## VII. Mô Hình Tham Khảo & Yêu Cầu Thiết Kế

### a) Mô hình tham khảo

| Nền tảng         | Đặc điểm áp dụng                                |
| ---------------- | ----------------------------------------------- |
| **Kindmate**     | Quản lý chiến dịch, timeline, mục tiêu, tiến độ |
| **MoMo Heo Đất** | Gây quỹ cộng đồng, progress bar, tính minh bạch |

### b) Yêu cầu cốt lõi

```
┌─────────────────────────────────────────┐
│  🔑 KẾT HỢP: Kindmate + MoMo           │
├─────────────────────────────────────────┤
│  📌 TẬP TRUNG:                          │
│     • UX đơn giản (Simple UX)           │
│     • Niềm tin (Trust)                  │
│     • Minh bạch tài chính (Transparency)│
└─────────────────────────────────────────┘
```

### c) Tính năng bổ sung

| Tính năng             | Mô tả                                                          |
| --------------------- | -------------------------------------------------------------- |
| **Bản đồ chiến dịch** | Hiển thị vị trí các hoạt động trên bản đồ tương tác            |
| **Realtime progress** | Cập nhật tiến độ gây quỹ, số lượng đăng ký theo thời gian thực |
| **Social sharing**    | Chia sẻ chiến dịch lên mạng xã hội, kêu gọi ủng hộ             |

---

## VIII. Viết Tắt Thường Dùng

| Viết tắt    | Đầy đủ                      |
| ----------- | --------------------------- |
| **BCH LCĐ** | Ban Chấp hành Liên Chi đoàn |
| **BCN CLB** | Ban Chủ nhiệm Câu lạc bộ    |
| **LCĐ**     | Liên Chi đoàn               |
| **CLB**     | Câu lạc bộ                  |
| **TVV**     | Tình nguyện viên            |
| **GCN**     | Giấy chứng nhận             |

---

> **Tài liệu tổng quan — Dự án Nền tảng Số hóa Chiến dịch Tình nguyện**
> _Trường Đại học Bách khoa — Đại học Đà Nẵng_
