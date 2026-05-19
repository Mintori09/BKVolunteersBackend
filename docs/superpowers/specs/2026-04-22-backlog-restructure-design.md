# Backlog Restructure Design

> Date: 2026-04-22
> Scope: Restructure `PRODUCT_BACKLOG.md` and `TASKS.md` so they become the backend source of truth for scope and execution

## Goal

Rà soát backlog backend hiện tại để phát hiện các thiếu sót ảnh hưởng đến trải nghiệm người dùng hoặc khả năng phát triển, sau đó tái cấu trúc:

- `PRODUCT_BACKLOG.md` thành nguồn sự thật cho scope backend
- `TASKS.md` thành implementation checklist có thể giao việc ngay

Thiết kế này không triển khai code. Nó xác định cách đánh giá khoảng trống, cách tái cấu trúc backlog, và nguyên tắc chuyển các thiếu sót thành task thực thi.

## Context

Tài liệu hiện tại có ba vấn đề chính:

1. `PRODUCT_BACKLOG.md` thiên về user story gắn endpoint, nhưng chưa phản ánh đầy đủ các enabler, bugfix, quality gap, và các luồng feedback cần cho trải nghiệm người dùng.
2. `TASKS.md` đang trộn nhiều vai trò: trạng thái dự án, lịch sử triển khai, task sống, checklist triển khai, và ghi chú kỹ thuật.
3. Một số mục được đánh dấu hoàn thành theo góc nhìn endpoint, nhưng chưa chắc đã đủ theo góc nhìn journey, testability, reliability, hoặc operability.

## Approved Decisions

- Chỉ phản ánh `backend scope` của repo này.
- Ưu tiên trước các thiếu sót chặn trải nghiệm người dùng, sau đó mới đến hạng mục kỹ thuật và vận hành.
- Được phép thêm `feature`, `enabler`, `bugfix`, và `refactor` nếu chúng ảnh hưởng thực tế đến khả năng ship hoặc độ tin cậy.
- Được phép tái cấu trúc backlog mạnh: tách, gộp, đổi ID, đổi ưu tiên khi cấu trúc cũ gây hiểu sai.
- `TASKS.md` phải đạt mức `implementation checklist`, đủ chi tiết để giao cho dev/test/docs ngay.

## Functional Scope

### 1. Backlog Review

Rà toàn bộ backlog backend hiện tại để phát hiện:

- thiếu luồng nghiệp vụ hoặc trạng thái quan trọng
- thiếu feedback cho actor liên quan
- thiếu permission, audit, history, retry, filter, hoặc detail view cần thiết
- acceptance criteria chỉ có happy path hoặc chỉ bám vào endpoint
- story quá lớn, quá gộp, hoặc quá kỹ thuật để còn hữu ích cho ưu tiên

### 2. Product Backlog Restructure

`PRODUCT_BACKLOG.md` sẽ được viết lại theo hướng capability-driven thay vì endpoint-driven thuần túy. Mỗi epic có thể chứa các loại item sau:

- `User Story`: outcome backend mang giá trị trực tiếp cho actor nghiệp vụ
- `Enabler`: hạng mục kỹ thuật hoặc nền tảng bắt buộc để ship ổn định
- `Bugfix / Risk Gap`: lỗ hổng có thể làm sai dữ liệu, thiếu kiểm soát, hoặc làm UX không trọn vẹn

Mỗi item sống trong backlog phải có tối thiểu:

- mã định danh
- loại item
- actor hoặc đối tượng hưởng lợi
- mô tả giá trị
- ưu tiên
- phụ thuộc chính
- module hoặc API liên quan
- definition of done ngắn

### 3. Task List Restructure

`TASKS.md` sẽ trở thành execution document thay vì project diary. Nó sẽ được tổ chức thành:

- `Now`: task chặn trải nghiệm hoặc chặn release
- `Next`: task quan trọng nhưng chưa chặn luồng chính
- `Later`: hardening và tối ưu hóa
- `Archived` hoặc phần lịch sử ngắn gọn để tham chiếu

Mỗi task phải có:

- `Task ID`
- backlog item liên kết
- loại task
- ưu tiên
- phụ thuộc
- module hoặc file phạm vi chính
- definition of done
- verification
- trạng thái

## Gap Analysis Framework

Các khoảng trống sẽ được đánh giá theo bốn lăng kính:

### 1. UX Blockers

Xác định các thiếu sót khiến actor không thể hoàn thành luồng chính hoặc không có phản hồi cần thiết sau hành động quan trọng. Ví dụ:

- không có notification hoặc history khi trạng thái thay đổi
- thiếu danh sách, chi tiết, hoặc bộ lọc để người dùng tự kiểm tra kết quả
- thiếu trạng thái trung gian hoặc lý do thất bại

### 2. Delivery Blockers

Xác định các thiếu sót khiến team không thể phát triển, kiểm thử, hoặc bàn giao an toàn. Ví dụ:

- acceptance criteria mơ hồ
- thiếu integration test cho flow chính
- thiếu contract docs hoặc verification step
- thiếu dữ liệu seed hoặc fixture hỗ trợ kiểm thử

### 3. Reliability And Control Gaps

Xác định các điểm dễ gây lỗi vận hành, sai dữ liệu, hoặc khó kiểm soát. Ví dụ:

- permission chưa rõ
- thiếu audit trail cho action quản trị
- pagination hoặc filter không nhất quán
- thiếu idempotency hoặc bảo vệ trước cập nhật lặp
- thiếu rate limit, upload constraints, monitoring tối thiểu

### 4. Backlog Structure Gaps

Xác định các story hoặc epic hiện tại đang che khuất công việc thật. Ví dụ:

- story chỉ mô tả endpoint chứ không mô tả outcome
- một story chứa nhiều actor hoặc nhiều outcome
- task đánh dấu hoàn thành nhưng side effects quan trọng vẫn thiếu

## Restructure Rules

### Split Rules

Tách item khi:

- một story chứa nhiều outcome khác nhau
- một story có nhiều actor với quyền hoặc feedback khác nhau
- một flow quan trọng đang bị nén vào một endpoint duy nhất
- definition of done không thể ước lượng hoặc kiểm thử độc lập

### Merge Rules

Gộp item khi:

- nhiều story chỉ là biến thể nhỏ của cùng một capability
- việc giữ riêng không giúp ưu tiên hoặc giao việc rõ hơn
- acceptance criteria và phạm vi triển khai gần như trùng nhau

### Priority Rules

Tăng ưu tiên nếu item:

- chặn journey chính
- có thể làm dữ liệu sai hoặc thiếu tin cậy
- làm actor không nhận được phản hồi nghiệp vụ cần thiết
- làm dev/test không kiểm chứng được feature cốt lõi

Giảm ưu tiên nếu item chỉ là tối ưu hoặc hardening không ảnh hưởng shipping path trước mắt.

### Archive Rules

Loại khỏi backlog sống hoặc chuyển sang phần lưu trữ nếu item:

- đã hoàn thành ổn định và không còn quyết định mở
- chỉ là ghi chú lịch sử
- trùng lặp với item khác
- không còn hành động được

## Data And Documentation Boundaries

- Không mở rộng sang frontend hoặc mobile scope.
- Chỉ thêm hạng mục ngoài backend nếu nó là dependency trực tiếp để mô tả contract backend.
- Không coi mọi bug nội bộ là backlog item. Chỉ đưa vào backlog khi nó ảnh hưởng shipability, UX, hoặc reliability đáng kể.
- Các endpoint/API docs có thể được dùng làm nguồn đối chiếu, nhưng `PRODUCT_BACKLOG.md` sau tái cấu trúc mới là nguồn sự thật về scope.

## Output Expectations

Sau khi áp dụng thiết kế này:

- `PRODUCT_BACKLOG.md` trả lời được backend còn phải xây gì và vì sao.
- `TASKS.md` trả lời được phải làm gì tiếp theo, theo thứ tự nào, và kiểm chứng ra sao.
- Team có thể nhìn backlog để biết mục nào là feature, mục nào là enabler, mục nào là risk gap.
- Team có thể nhìn task list để nhận việc ngay mà không phải đọc lại toàn bộ lịch sử tài liệu.

## Testing And Verification Expectations

Việc chỉnh backlog phải dẫn tới task verification rõ ràng, tối thiểu cho các flow quan trọng:

- unit tests hoặc service tests cho nghiệp vụ chính
- integration tests cho journey nhiều bước
- contract docs hoặc API docs cập nhật nếu endpoint hoặc behavior thay đổi
- checklist xác minh thủ công cho các luồng khó tự động hóa

## Out Of Scope

- Viết implementation plan chi tiết theo file hoặc module
- Sửa code backend
- Thiết kế frontend, mobile, hoặc dashboard UX
- Thêm các mục product marketing, training, hoặc stakeholder communication
