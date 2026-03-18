## API Review – Postman Body Examples

### 1. Lấy danh sách review theo xe

- **Method**: `POST`
- **URL**: `/api/review/get-by-vehicle` *(hoặc base URL + `/review/get-by-vehicle`, tùy cách bạn mount router trong `app.js`)*
- **Auth**: Không yêu cầu (không dùng `authMiddleware` cho route này)

**Yêu cầu body (JSON)**:

- **vehicle_id**: bắt buộc, kiểu MongoId hợp lệ
- **page**: tùy chọn, số nguyên \(\>= 1\)
- **limit**: tùy chọn, số nguyên \(\>= 1\) và \(\<= 100\)

**Ví dụ body Postman**:

```json
{
  "vehicle_id": "6648c4c2e0a1c231b8c9f123",
  "page": 1,
  "limit": 10
}
```

**Response (200 – ví dụ)**:

```json
{
  "message": "Reviews received successfully",
  "data": [
    {
      "_id": "6650a4d5f2b3a11234567890",
      "user_id": {
        "_id": "6648c4c2e0a1c231b8c9aaaa",
        "name": "User A",
        "email": "usera@example.com"
      },
      "vehicle_id": "6648c4c2e0a1c231b8c9f123",
      "rating": 5,
      "comment": "Xe chạy rất tốt",
      "createdAt": "2024-05-28T10:15:00.000Z",
      "updatedAt": "2024-05-28T10:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 2. Tạo review cho xe

- **Method**: `POST`
- **URL**: `/api/review/create`
- **Auth**: Bearer Token (user)

**Body (JSON)**: `vehicle_id` (MongoId), `rating` (1–5), `comment` (tùy chọn, tối đa 1000 ký tự).

- Nếu user đã có review cho xe đó → **409** (`Bạn đã đánh giá xe này rồi`).

```json
{
  "vehicle_id": "6648c4c2e0a1c231b8c9f123",
  "rating": 5,
  "comment": "Xe rất tốt, tài xế thân thiện."
}
```

**Response (201)**:

```json
{
  "message": "Review created successfully",
  "data": {
    "_id": "6650a4d5f2b3a11234567890",
    "user": "6648c4c2e0a1c231b8c9aaaa",
    "vehicle_id": "6648c4c2e0a1c231b8c9f123",
    "rating": 5,
    "comment": "Xe rất tốt, tài xế thân thiện.",
    "createdAt": "2024-05-28T10:15:00.000Z",
    "updatedAt": "2024-05-28T10:15:00.000Z"
  }
}
```

---

### 3. Cập nhật review đã có

- **Method**: `PATCH`
- **URL**: `/api/review/update`
- **Auth**: Bearer Token (user)

**Body (JSON)**: giống create — `vehicle_id`, `rating`, `comment` (tùy chọn).

- Chưa có review cho xe đó → **404** (`Chưa có đánh giá cho xe này để cập nhật`).

```json
{
  "vehicle_id": "6648c4c2e0a1c231b8c9f123",
  "rating": 4,
  "comment": "Sau vài chuyến vẫn ổn nhưng cần bảo dưỡng thêm."
}
```

**Response (200)**:

```json
{
  "message": "Review updated successfully",
  "data": {
    "_id": "6650a4d5f2b3a11234567890",
    "user": "6648c4c2e0a1c231b8c9aaaa",
    "vehicle_id": "6648c4c2e0a1c231b8c9f123",
    "rating": 4,
    "comment": "Sau vài chuyến vẫn ổn nhưng cần bảo dưỡng thêm.",
    "createdAt": "2024-05-28T10:15:00.000Z",
    "updatedAt": "2024-05-28T11:00:00.000Z"
  }
}
```

> **Lưu ý**: Giá trị `vehicle_id`, `_id`, `user`… chỉ là ví dụ; thay bằng dữ liệu thực tế.

