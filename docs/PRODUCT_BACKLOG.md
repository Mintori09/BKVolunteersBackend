# PRODUCT BACKLOG - BKVolunteers

> **Ngày cập nhật:** 2026-04-22
> **Phạm vi:** Backend only
> **Nguồn sự thật:** Tài liệu này mô tả toàn bộ scope backend còn sống. `TASKS.md` là checklist thực thi tương ứng.

---

## 1. MỤC TIÊU TÀI LIỆU

- Ghi nhận scope backend theo outcome thay vì chỉ theo endpoint
- Tách rõ `User Story`, `Enabler`, và `Risk Gap`
- Giúp team biết mục nào chặn trải nghiệm, mục nào chặn phát triển, mục nào là hardening

## 2. CÁCH ĐỌC BACKLOG

| Trường | Ý nghĩa |
| ------ | ------- |
| Item ID | Mã định danh duy nhất (`US`, `EN`, `RG`) |
| Type | Loại item: User Story, Enabler, Risk Gap |
| Actor | Vai trò hưởng lợi hoặc chịu tác động chính |
| Outcome | Kết quả backend phải hỗ trợ |
| Priority | HIGH / MED / LOW |
| Dependencies | Phụ thuộc chính nếu có |
| Modules / APIs | Module hoặc API contract liên quan |
| Definition of Done | Điều kiện đủ để item được xem là hoàn thành |

## 3. NGUYÊN TẮC ƯU TIÊN

- `HIGH`: chặn journey chính, dữ liệu sai, hoặc thiếu feedback nghiệp vụ
- `MED`: chưa chặn release nhưng ảnh hưởng mạnh tới tính nhất quán hoặc khả năng phát triển
- `LOW`: tối ưu hóa, hardening, hoặc mở rộng không chặn shipping path trước mắt

## 4. EPIC TỔNG QUÁT

| Epic ID | Tên Epic | Mục tiêu backend |
| ------- | -------- | ---------------- |
| E-01 | Authentication & Authorization | Xác thực, cấp quyền, và quản lý phiên truy cập |
| E-02 | Faculty Management | Dữ liệu khoa và suy luận khoa từ MSSV |
| E-03 | Campaign Management | Quản lý vòng đời chiến dịch và hồ sơ phê duyệt |
| E-04 | Donation Processing | Giai đoạn quyên góp tiền và hiện vật, xác thực, phản hồi |
| E-05 | Event Participation | Đăng ký, duyệt, check-in, chứng nhận |
| E-06 | Student Progress & Gamification | Điểm, danh hiệu, hồ sơ sinh viên, feedback thành tựu |
| E-07 | Club & User Administration | CLB, user provisioning, phân quyền vận hành |
| E-08 | Notification & Activity Feedback | Inbox notification và phản hồi trạng thái |
| E-09 | Statistics & Reporting | Thống kê chiến dịch, khoa, hệ thống |
| E-10 | File & Document Handling | Upload, ràng buộc file, và liên kết tài liệu |
| E-11 | Delivery & Reliability Foundations | Audit, testability, consistency, operability |
