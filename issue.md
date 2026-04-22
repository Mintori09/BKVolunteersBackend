## 🔴 DEEP CODE REVIEW - BKVol Backend

### 1. BẢO MẬT (SECURITY) - CRITICAL

#### 1.1 User Enumeration Attack trong Forgot Password

**File:** `forgotPassword.controller.ts:28-33`

```typescript
if (!user) {
    throw new ApiError(
        HttpStatus.NOT_FOUND,
        'Email không tồn tại trong hệ thống!'
    )
}
```

- **Tại sao không hợp lý:** Trả về lỗi khác nhau khi email tồn tại/không tồn tại cho phép attacker dò tìm danh sách user hợp lệ.
- **Hệ quả tiềm ẩn:** Attacker có thể xác định email nào đã đăng ký trong hệ thống.
- **Refactored:**

```typescript
export const handleForgotPassword = catchAsync(
    async (
        req: TypedRequest<ForgotPasswordInput, ResetPasswordParams>,
        res: Response
    ) => {
        const { email } = req.body
        const user = await authService.getUserByEmail(email)
        if (user) {
            await forgotPasswordService.createResetToken(user.id, email)
        }
        return ApiResponse.success(
            res,
            null,
            'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi!'
        )
    }
)
```

---

#### 1.2 Email gửi bất đồng bộ không xử lý lỗi

**File:** `forgotPassword.service.ts:18`

```typescript
sendResetEmail(email, resetToken)
return resetToken
```

- **Tại sao không hợp lý:** Gửi email async mà không `await` hoặc handle error. Nếu email fail, token đã được tạo trong DB nhưng user không nhận được.
- **Hệ quả tiềm ẩn:** User bị khóa flow reset password, token lãng phí trong DB.
- **Refactored:**

```typescript
export const createResetToken = async (userId: string, email: string) => {
    const resetToken = randomUUID()
    const expiresAt = new Date(Date.now() + 3600000)
    await prismaClient.resetToken.create({
        data: { token: resetToken, expiresAt, userId },
    })
    try {
        await sendResetEmail(email, resetToken)
    } catch (error) {
        await prismaClient.resetToken.delete({ where: { token: resetToken } })
        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'Không thể gửi email'
        )
    }
    return resetToken
}
```

---

#### 1.3 Reset Password không hỗ trợ SINHVIEN

**File:** `forgotPassword.service.ts:37-44`

```typescript
await prismaClient.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
})
await prismaClient.resetToken.deleteMany({ where: { userId } })
await prismaClient.refreshToken.deleteMany({ where: { userId } })
```

- **Tại sao không hợp lý:** Sinh viên có table riêng (`student`, `studentRefreshToken`), nhưng code chỉ xử lý `user` table.
- **Hệ quả tiềm ẩn:** Sinh viên không thể reset password, gây crash hoặc không hiệu lực.
- **Refactored:**

```typescript
export const resetUserPassword = async (
    userId: string,
    newPassword: string,
    userType: 'user' | 'student'
) => {
    const hashedPassword = await argon2.hash(newPassword)
    if (userType === 'student') {
        await prismaClient.student.update({
            where: { id: userId },
            data: { password: hashedPassword },
        })
        await prismaClient.resetToken.deleteMany({
            where: { studentId: userId },
        })
        await prismaClient.studentRefreshToken.deleteMany({
            where: { studentId: userId },
        })
    } else {
        await prismaClient.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        })
        await prismaClient.resetToken.deleteMany({ where: { userId } })
        await prismaClient.refreshToken.deleteMany({ where: { userId } })
    }
}
```

---

#### 1.4 Thông báo lỗi timing attack trong Login

**File:** `auth.controller.ts:43-50`

```typescript
const isPasswordValid = await argon2.verify(user.password, password)
if (!isPasswordValid) {
    throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        'Email hoặc mật khẩu không hợp lệ'
    )
}
```

- **Tại sao không hợp lý:** Argon2 verify có thể leak thông tin qua timing. Tốt hơn nên sử dụng method an toàn hơn.
- **Hệ quả tiềm ẩn:** Timing attack có thể giúp attacker dò password.
- **Refactored:** Sử dụng `argon2.verify` với option `type: argon2.argon2id` và đảm bảo không có early return trước verify.

---

### 2. LỖI LOGIC & EDGE CASES

#### 2.1 Duplicate query trong Service - Campaign

**File:** `campaign.service.ts:68,83`

```typescript
export const updateCampaign = async (...) => {
    const campaign = await getCampaignById(id)  // Query 1
    // ...
}
export const deleteCampaign = async (...) => {
    const campaign = await getCampaignById(id)  // Query 1 (duplicate)
    // ...
}
```

- **Tại sao không hợp lý:** `getCampaignById` đã throw error nếu not found, nhưng tất cả hàm đều gọi lại.
- **Hệ quả tiềm ẩn:** Nếu `getCampaignById` thay đổi logic, tất cả sẽ bị ảnh hưởng. Không tối ưu cho cache.

---

#### 2.2 Logic sai trong findAvailableCampaigns

**File:** `campaign.repository.ts:201-203`

```typescript
if (userRole !== 'DOANTRUONG' && userFacultyId) {
    where.OR = [{ scope: 'TRUONG' }, { scope: 'KHOA' }]
}
```

- **Tại sao không hợp lý:** Logic không filter theo faculty. User thuộc khoa vẫn thấy campaign của khoa khác.
- **Hệ quả tiềm ẩn:** Sinh viên khoa A có thể thấy campaign khoa B (nếu scope = KHOA).
- **Refactored:**

```typescript
if (userRole === 'SINHVIEN' || userRole === 'CLB' || userRole === 'LCD') {
    where.OR = [
        { scope: 'TRUONG' },
        { scope: 'KHOA', creator: { facultyId: userFacultyId } },
    ]
}
```

---

#### 2.3 Transaction thiếu rollback trong verifyDonation

**File:** `donation.repository.ts:74-98`

```typescript
export const verifyDonation = async (id: string, verifiedAmount: number) => {
    return prismaClient.$transaction(async (tx) => {
        const donation = await tx.donation.update(...)
        if (donation.moneyPhase) {
            await tx.moneyDonationCampaign.update(...)
        }
        return donation
    })
}
```

- **Tại sao không hợp lý:** Nếu `gamificationService.awardPoints` fail (ngoài transaction), donation đã verify nhưng không có điểm.
- **Hệ quả tiềm ẩn:** Data inconsistency - donation verified nhưng không có điểm thưởng.
- **Refactored trong service:**

```typescript
export const verifyDonation = async (...) => {
    const updatedDonation = await donationRepository.verifyDonation(donationId, verifiedAmount)
    try {
        if (pointsToAward > 0) {
            await gamificationService.awardPoints(...)
        }
    } catch (error) {
        await donationRepository.revertDonationVerification(donationId)
        throw error
    }
    return updatedDonation
}
```

---

#### 2.4 Input validation thiếu kiểm tra newPassword !== oldPassword

**File:** `auth.validation.ts:32-51`

- **Tại sao không hợp lý:** Cho phép đặt `newPassword` giống `oldPassword`.
- **Hệ quả tiềm ẩn:** User "đổi" password nhưng thực chất không thay đổi gì.
- **Refactored:**

```typescript
export const changePasswordSchema: RequestValidationSchema = {
    body: z
        .object({
            oldPassword: z.string().min(8).max(150),
            newPassword: z.string().min(8).max(150),
            newPasswordConfirm: z.string().min(8).max(150),
        })
        .refine((data) => data.newPassword === data.newPasswordConfirm, {
            message: 'Mật khẩu xác nhận không khớp',
            path: ['newPasswordConfirm'],
        })
        .refine((data) => data.newPassword !== data.oldPassword, {
            message: 'Mật khẩu mới phải khác mật khẩu cũ',
            path: ['newPassword'],
        }),
}
```

---

### 3. CODE SMELLS & ANTI-PATTERNS

#### 3.1 Type assertion không an toàn với as any

**File:** `campaign.service.ts:35,73,114`, `donation.service.ts:35,73,114`, `money-donation.service.ts:33,88,140`

```typescript
const permissionCheck = canSubmitDonation(moneyPhase.campaign as any)
```

- **Tại sao không hợp lý:** `as any` bypass hoàn toàn type checking của TypeScript.
- **Hệ quả tiềm ẩn:** Runtime errors nếu structure thay đổi, không được IDE hỗ trợ.
- **Refactored:** Định nghĩa proper types:
  `type CampaignForPermission = Pick<Campaign, 'id' | 'status' | 'creatorId' | 'scope'>`

---

#### 3.2 Duplicate code pattern trong Auth Repository

**File:** `auth.repository.ts`

```typescript
export const getUserById = async (userId: string, role: UserRole) => {
    if (role === 'SINHVIEN') {
        return prismaClient.student.findUnique({ where: { id: userId } })
    }
    return prismaClient.user.findUnique({ where: { id: userId } })
}
// Tương tự cho deleteRefreshToken, deleteAllUserRefreshTokens, createRefreshToken, updatePassword
```

- **Tại sao không hợp lý:** Pattern `if (role === 'SINHVIEN')` lặp lại 5 lần - vi phạm DRY.
- **Refactored:**

```typescript
const getRepository = (role: UserRole) => {
    return role === 'SINHVIEN'
        ? {
              user: prismaClient.student,
              token: prismaClient.studentRefreshToken,
              userIdField: 'studentId',
          }
        : {
              user: prismaClient.user,
              token: prismaClient.refreshToken,
              userIdField: 'userId',
          }
}

export const getUserById = async (userId: string, role: UserRole) => {
    const { user } = getRepository(role)
    return user.findUnique({ where: { id: userId } })
}
```

---

#### 3.3 Biến không sử dụng và naming

**File:** `auth.service.ts:65`

```typescript
let facultyId: string | number | null | undefined = undefined
```

- **Tại sao không hợp lý:** Khởi tạo `undefined` rồi gán lại, có thể khởi tạo trực tiếp.

---

#### 3.4 Validation trùng lặp Controller vs Validation layer

**File:** `auth.controller.ts:27-31`

```typescript
if (!username || !password) {
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Email và mật khẩu là bắt buộc!')
}
```

- **Tại sao không hợp lý:** Validation schema đã defined trong `auth.validation.ts`, controller không nên validate lại.
- **Hệ quả tiềm ẩn:** Duplicate validation, harder to maintain.

---

### 4. HIỆU NĂNG (PERFORMANCE)

#### 4.1 N+1 Query trong findDonationsForAdmin

**File:** `donation.repository.ts:202-241`

- **Tại sao không hợp lý:** Include nhiều relations có thể gây performance issue với dữ liệu lớn.
- **Hệ quả tiềm ẩn:** Slow query với table lớn.
- **Refactored:** Sử dụng `select` thay vì `include` để chỉ lấy fields cần thiết (đã làm nhưng cần review indexing).

---

#### 4.2 Thiếu database indexing

**File:** `campaign.repository.ts:143-145`

```typescript
const where: Prisma.CampaignWhereInput = {
    deletedAt: null,
}
```

- **Tại sao không hợp lý:** Query `deletedAt: null` cần index.
- **Hệ quả tiềm ẩn:** Full table scan với dữ liệu lớn.
- **Recommendation:** Thêm index trong Prisma schema:

```prisma
model Campaign {
    @@index([deletedAt])
    @@index([status, deletedAt])
}
```

---

#### 4.3 Double query trong getRefreshTokenByToken

**File:** `auth.repository.ts:23-39`

```typescript
export const getRefreshTokenByToken = async (token: string) => {
    const userToken = await prismaClient.refreshToken.findUnique({
        where: { token },
    })
    if (userToken) return { ...userToken, userType: 'user' as const }
    const studentToken = await prismaClient.studentRefreshToken.findUnique({
        where: { token },
    })
    if (studentToken) return { ...studentToken, userType: 'student' as const }
    return null
}
```

- **Tại sao không hợp lý:** 2 queries sequential trong trường hợp token là student token.
- **Refactored:** Parallel queries:

```typescript
export const getRefreshTokenByToken = async (token: string) => {
    const [userToken, studentToken] = await Promise.all([
        prismaClient.refreshToken.findUnique({ where: { token } }),
        prismaClient.studentRefreshToken.findUnique({ where: { token } }),
    ])
    if (userToken) return { ...userToken, userType: 'user' as const }
    if (studentToken) return { ...studentToken, userType: 'student' as const }
    return null
}
```

---

### 5. TÓM TẮT CÁC VẤN ĐỀ NGHIÊM TRỌNG

| Severity        | Issue                                     | File                           | Line    |
| :-------------- | :---------------------------------------- | :----------------------------- | :------ |
| 🔴 **Critical** | User Enumeration                          | `forgotPassword.controller.ts` | 28-33   |
| 🔴 **Critical** | Reset password không hỗ trợ Student       | `forgotPassword.service.ts`    | 37-44   |
| 🟠 **High**     | Email async không handle error            | `forgotPassword.service.ts`    | 18      |
| 🟠 **High**     | Transaction không atomic với gamification | `donation.service.ts`          | 125-143 |
| 🟠 **High**     | Logic sai filter campaign theo khoa       | `campaign.repository.ts`       | 201-203 |
| 🟡 **Medium**   | Type assertion as any                     | Multiple files                 | -       |
| 🟡 **Medium**   | Double query refresh token                | `auth.repository.ts`           | 23-39   |
| 🟡 **Medium**   | Duplicate validation                      | `auth.controller.ts`           | 27-31   |
| 🟢 **Low**      | Missing newPassword !== oldPassword check | `auth.validation.ts`           | 32-51   |
