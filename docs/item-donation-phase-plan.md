# Kế Hoạch Triển Khai Item Donation Phase

> Tài liệu lịch sử. Phần item phase/item donation hiện đã được triển khai; API docs chính thức nằm trong `docs/api/`.

## 1. TỔNG QUAN API

| US | Method | Endpoint | Description | Priority |
| --- | --- | --- | --- | --- |
| US-037 | POST | `/campaigns/:campaignId/item-phases` | Tạo giai đoạn quyên góp hiện vật | HIGH |
| US-038 | PUT | `/campaigns/:campaignId/item-phases/:phaseId` | Cập nhật giai đoạn | MED |
| US-039 | DELETE | `/campaigns/:campaignId/item-phases/:phaseId` | Xóa giai đoạn | LOW |
| US-041 | POST | `/donations/items` | Student đóng góp hiện vật | HIGH |
| US-043 | GET | `/item-phases/:phaseId/donations` | Xem danh sách đóng góp | MED |

---

## 2. CẤU TRÚC THƯ MỤC MỚI

```
src/features/
├── item-phase/
│   ├── index.ts                    # Export router
│   ├── item-phase.controller.ts    # US-037, 038, 039
│   ├── item-phase.service.ts       # Business logic
│   ├── item-phase.repository.ts    # Prisma queries
│   ├── item-phase.route.ts         # Routes definition
│   ├── item-phase.validation.ts    # Zod schemas
│   ├── types.ts                    # TypeScript types
│   └── tests/
│       └── item-phase.controller.test.ts
│
├── item-donation/
│   ├── index.ts
│   ├── item-donation.controller.ts # US-041, 043
│   ├── item-donation.service.ts
│   ├── item-donation.repository.ts
│   ├── item-donation.route.ts
│   ├── item-donation.validation.ts
│   ├── types.ts
│   └── tests/
│       └── item-donation.controller.test.ts
```

---

## 3. CHI TIẾT API

### US-037: POST `/campaigns/:campaignId/item-phases`

**Request:**

```json
{
  "acceptedItems": ["Áo quần cũ", "Sách vở", "Đồ dùng học tập"],
  "collectionAddress": "Phòng 101, Nhà A, Trường ĐH Bách Khoa",
  "startDate": "2025-05-01T00:00:00Z",
  "endDate": "2025-05-30T23:59:59Z"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Tạo giai đoạn quyên góp hiện vật thành công",
  "data": {
    "id": 1,
    "campaignId": "clx...",
    "acceptedItems": ["Áo quần cũ", "Sách vở"],
    "collectionAddress": "...",
    "startDate": "...",
    "endDate": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Validation:**

- `acceptedItems`: array tối thiểu 1 phần tử
- `startDate` < `endDate`
- Creator phải là owner của campaign
- Campaign chưa có itemPhase (one-to-one)

---

### US-038: PUT `/campaigns/:campaignId/item-phases/:phaseId`

**Request:** Same as POST (all fields optional)

**Response (200):** Updated item-phase

---

### US-039: DELETE `/campaigns/:campaignId/item-phases/:phaseId`

**Response (204):** No content

---

### US-041: POST `/donations/items`

**Request:**

```json
{
  "itemPhaseId": 1,
  "itemDescription": "5 chiếc áo sơ mi cũ, còn tốt",
  "proofImageUrl": "https://example.com/image.jpg"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Ghi nhận đóng góp thành công, chờ xác minh",
  "data": {
    "id": "clx...",
    "itemPhaseId": 1,
    "itemDescription": "...",
    "proofImageUrl": "...",
    "status": "PENDING",
    "createdAt": "..."
  }
}
```

---

### US-043: GET `/item-phases/:phaseId/donations`

**Query params:** `?status=PENDING&page=1&limit=10`

**Response (200):**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

## 4. TYPES DEFINITION

### `src/features/item-phase/types.ts`

```typescript
export interface CreateItemPhaseInput {
  acceptedItems: string[];
  collectionAddress?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateItemPhaseInput {
  acceptedItems?: string[];
  collectionAddress?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ItemPhaseOutput {
  id: number;
  campaignId: string;
  acceptedItems: string[];
  collectionAddress: string | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### `src/features/item-donation/types.ts`

```typescript
export interface CreateItemDonationInput {
  itemPhaseId: number;
  itemDescription: string;
  proofImageUrl?: string;
}

export interface ItemDonationOutput {
  id: string;
  studentId: string;
  itemPhaseId: number;
  itemDescription: string | null;
  proofImageUrl: string | null;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 5. MIDDLEWARE MỚI

### `src/common/middleware/isCreator.ts`

```typescript
// Check if user is creator (CLB, LCD, DOANTRUONG)
// Exclude SINHVIEN role
```

### `src/common/middleware/isStudent.ts`

```typescript
// Check if user is SINHVIEN role
```

---

## 6. THỨ TỰ TRIỂN KHAI

### Phase 1 (HIGH Priority):

- Tạo `src/features/item-phase/` (US-037)
- Tạo middleware `isCreator`
- Thêm routes vào `src/common/routes.ts`

### Phase 2 (HIGH Priority):

- Tạo `src/features/item-donation/` (US-041)
- Tạo middleware `isStudent`

### Phase 3 (MED Priority):

- US-038 (Update item-phase)
- US-043 (Get donations list)

### Phase 4 (LOW Priority):

- US-039 (Delete item-phase)
- Tests

---

## 7. LƯU Ý KỸ THUẬT

### Prisma Schema (đã có sẵn)

- `ItemDonationCampaign`: One-to-one với Campaign
- `acceptedItems`: Lưu dưới dạng JSON string trong TEXT field
- `Donation`: Có `itemPhaseId` để liên kết với item donation

### Business Rules

- Creator phải là owner của campaign mới được tạo/sửa/xóa item-phase
- Student chỉ có thể donate khi item-phase đang trong thời gian (startDate <= now <= endDate)
- Donation mới tạo có status = PENDING

### Security

- US-037, 038, 039: Yêu cầu isAuth + isCreator
- US-041: Yêu cầu isAuth + isStudent
- US-043: Yêu cầu isAuth + isCreator (owner của campaign)
