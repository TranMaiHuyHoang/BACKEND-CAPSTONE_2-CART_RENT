# API Contact Us – Hướng dẫn Postman (chi tiết)

Base URL ví dụ: `http://localhost:3000` (thay bằng port server của bạn).

Tất cả route Contact Us mount tại **`/api/contact-us`** (`app.js`).

---

## 1. Chuẩn bị trong Postman (quan trọng)

### 1.1. Biến môi trường (khuyến nghị)

1. Tạo Environment (ví dụ `Local`).
2. Thêm biến:
   - **`baseUrl`**: `http://localhost:3000`
   - **`access_token`**: để trống trước, sau khi **login** sẽ dán token vào đây.

Khi gọi API, URL dùng: `{{baseUrl}}/api/contact-us/...`

### 1.2. Lấy token (bắt buộc cho Contact Us)

Hai API bên dưới đều cần **đăng nhập** với role **`user`**:

1. Gọi `POST {{baseUrl}}/api/auth/login` với body JSON:
   ```json
   { "email": "...", "password": "..." }
   ```
2. Copy giá trị `data.token` trong response.
3. Trong Postman tab **Authorization**:
   - Type: **Bearer Token**
   - Token: dán token vừa copy  
   Hoặc header thủ công: `Authorization: Bearer <token>`

> Nếu thiếu token hoặc token hết hạn → **401 Unauthorized**.

---

## 2. Gửi liên hệ — `POST /api/contact-us/create`

### 2.1. Mục đích

User đã đăng nhập gửi một tin nhắn liên hệ (tiêu đề, nội dung, tên hiển thị, email). Server lưu kèm **`user`** = ID user trong token (bạn không cần gửi `user` trong body).

### 2.2. Cấu hình Postman

| Mục | Giá trị |
|-----|---------|
| Method | **POST** |
| URL | `{{baseUrl}}/api/contact-us/create` |
| Authorization | **Bearer Token** (token sau login) |
| Headers | `Content-Type: application/json` (Postman thường tự thêm khi chọn Body → raw → JSON) |

### 2.3. Body (JSON) — ý nghĩa từng field

| Field | Bắt buộc / tùy chọn | Giới hạn (validator) | Ý nghĩa |
|--------|---------------------|----------------------|---------|
| `title` | Nên có nội dung hợp lý | Tối đa **30** ký tự (sau `trim`) | Tiêu đề ngắn (ví dụ: "Hỏi giá thuê xe") |
| `body` | **Có** (sau trim không rỗng) | **1–100** ký tự | Nội dung liên hệ chính |
| `name` | Nên có | Tối đa **200** ký tự | Tên người liên hệ hiển thị |
| `email` | **Có** (đúng format email) | Email hợp lệ | Email để phản hồi |

### 2.4. Ví dụ body Postman

```json
{
  "title": "Hỏi về thuê xe 7 chỗ",
  "body": "Cho em hỏi giá thuê Toyota Innova trong tuần tới ạ.",
  "name": "Tran Thi B",
  "email": "tranthib@example.com"
}
```

### 2.5. Response thành công — **201 Created**

```json
{
  "message": "Contact message submitted successfully",
  "data": {
    "_id": "674a1b2c3d4e5f6789abcdef",
    "user": "6648c4c2e0a1c231b8c9aaaa",
    "title": "Hỏi về thuê xe 7 chỗ",
    "body": "Cho em hỏi giá thuê Toyota Innova trong tuần tới ạ.",
    "name": "Tran Thi B",
    "email": "tranthib@example.com",
    "createdAt": "2025-03-30T08:00:00.000Z",
    "updatedAt": "2025-03-30T08:00:00.000Z"
  }
}
```

- **`data.user`**: ID user đã gửi (lấy từ token, không do client tự gửi).
- **`data._id`**: ID bản ghi liên hệ — dùng để đối chiếu khi xem lại trong **danh sách** (API bên dưới).

### 2.6. Lỗi thường gặp

- **422 Validation error**: sai độ dài `body`, email sai format, v.v. — xem mảng `errors` trong response.
- **401**: chưa gửi Bearer hoặc token không hợp lệ.
- **403**: user không có role `user` (middleware `authorizeRoles("user")`).

---

## 3. Lấy danh sách liên hệ — `POST /api/contact-us/list` (Get List Contact)

### 3.1. Mục đích

Lấy **danh sách các tin liên hệ mà chính tài khoản đang đăng nhập đã gửi**, sắp xếp **mới nhất trước** (`createdAt` giảm dần), có **phân trang** để không tải hết DB một lúc.

> **Không** trả về tin của user khác — chỉ filter theo `user` trong token.

### 3.2. Cấu hình Postman (từng bước)

1. **Method**: chọn **POST**.
2. **URL**: nhập  
   `{{baseUrl}}/api/contact-us/list`
3. **Authorization**: giống API create — **Bearer Token** (cùng user đã tạo liên hệ trước đó).
4. Tab **Body** → chọn **raw** → **JSON**.

### 3.3. Body (JSON) — phân trang

| Field | Bắt buộc | Ý nghĩa |
|--------|----------|---------|
| `page` | Không | Trang thứ mấy, số nguyên **≥ 1**. Không gửi → mặc định **1**. |
| `limit` | Không | Số bản ghi mỗi trang, **1–100**. Không gửi → mặc định **10**. |

**Ví dụ 1 — trang đầu, mặc định 10 bản ghi:**

```json
{}
```

**Ví dụ 2 — trang 2, mỗi trang 5 bản ghi:**

```json
{
  "page": 2,
  "limit": 5
}
```

### 3.4. Response thành công — **200 OK**

```json
{
  "message": "Contact list received successfully",
  "data": [
    {
      "_id": "674a1b2c3d4e5f6789abcdef",
      "user": "6648c4c2e0a1c231b8c9aaaa",
      "title": "Hỏi về thuê xe 7 chỗ",
      "body": "Cho em hỏi giá thuê Toyota Innova trong tuần tới ạ.",
      "name": "Tran Thi B",
      "email": "tranthib@example.com",
      "createdAt": "2025-03-30T08:00:00.000Z",
      "updatedAt": "2025-03-30T08:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

### 3.5. Giải thích response (để làm frontend / báo cáo)

| Phần | Ý nghĩa |
|------|---------|
| **`data`** | Mảng các object liên hệ của user hiện tại trên **trang này**. |
| **`pagination.total`** | Tổng số bản ghi liên hệ của user (tất cả trang). |
| **`pagination.page`** | Trang đang xem (khớp `page` trong body hoặc mặc định 1). |
| **`pagination.limit`** | Số bản ghi tối đa trên trang này. |
| **`pagination.totalPages`** | Tổng số trang = `ceil(total / limit)` (0 nếu không có dữ liệu). |

**Cách “lật trang” trong Postman / app:**

- Trang 1: `{ "page": 1, "limit": 10 }`
- Trang 2: `{ "page": 2, "limit": 10 }`
- … cho đến khi `page` > `totalPages` thì `data` thường là mảng rỗng.

### 3.6. Lỗi thường gặp

- **422**: `page` hoặc `limit` không phải số / vượt quy tắc (ví dụ `limit` > 100).
- **401 / 403**: giống API create.

---

## 4. Bảng tóm tắt nhanh

| STT | Mục đích | Method | URL | Body JSON |
|-----|----------|--------|-----|-----------|
| 1 | Gửi liên hệ | POST | `/api/contact-us/create` | `title`, `body`, `name`, `email` (theo validator) |
| 2 | **Get list** — danh sách liên hệ của tôi | POST | `/api/contact-us/list` | `{}` hoặc `{ "page", "limit" }` |

**Chung:** Header `Authorization: Bearer <token>`, role **`user`**.

---

## 5. Gợi ý thứ tự test trong Postman

1. **Login** → lưu token.
2. **POST …/create** → kiểm tra **201** và `data._id`.
3. **POST …/list** với `{}` → thấy bản ghi vừa tạo trong `data`, kiểm tra `pagination.total` ≥ 1.

Nếu cần mở rộng sau này (admin xem tất cả liên hệ), sẽ cần thêm route + role `admin` — hiện tại chỉ có **list theo user đăng nhập** như trên.
