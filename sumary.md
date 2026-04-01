# Tóm tắt hệ thống backend (`src`) — DoAnCaptone2

Tài liệu mô tả kiến trúc, luồng dữ liệu, API, model MongoDB và các lưu ý kỹ thuật của thư mục `src` (REST API Node.js + Express + Mongoose).

---

## 1. Tổng quan stack & khởi động

| Thành phần | Công nghệ |
|------------|-----------|
| Runtime | Node.js (CommonJS, `type: commonjs`) |
| Framework | Express **5.x** |
| CSDL | MongoDB qua **Mongoose 9.x** |
| Xác thực | **JWT** (`jsonwebtoken`), mật khẩu hash **bcryptjs** |
| Validation | **express-validator** (body/param), upload ảnh kiểm tra thủ công sau multer |
| Upload ảnh | **multer** (memory), upload lên **Cloudinary** |
| Logging HTTP | **morgan** (`dev`) |
| Tiện ích | **lodash** (`pick`), **dotenv** (load ở `server.js`) |

**Điểm vào ứng dụng**

- `server.js`: `dotenv.config()` → `connectDB()` → `app.listen(PORT)`.
- `src/app.js`: cấu hình middleware toàn cục, gắn route prefix `/api/...`, `errorHandler` cuối cùng.

**Biến môi trường (tham khảo)**

- `MONGO_URI` — kết nối MongoDB.
- `PORT` — cổng (mặc định 3000).
- `JWT_SECRET`, `JWT_EXPIRES_IN` (mặc định token `7d`).
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

---

## 2. Kiến trúc thư mục `src`

Luồng điển hình: **Routes** → **Validation** (`express-validator` + `validate.middleware`) → **Controller** → **Service** → **Model** (Mongoose).

```
src/
├── app.js                 # Ứng dụng Express, đăng ký route
├── config/
│   └── db.js              # connectDB (mongoose.connect)
├── controllers/           # Xử lý HTTP, gọi service
├── middlewares/
│   ├── auth.middleware.js
│   ├── authorize.middleware.js
│   ├── validate.middleware.js
│   └── errorHandler.js
├── models/                # Schema Mongoose
├── routes/                # Định nghĩa endpoint
├── services/              # Logic nghiệp vụ + BaseService (phân trang/sort)
├── utils/
│   ├── jwt.js
│   └── throwError.js
└── validations/           # Rule express-validator
```

---

## 3. Middleware toàn cục

### 3.1 `express.json()`

Parse body JSON cho các route POST/PATCH có `Content-Type: application/json`.

### 3.2 `auth.middleware.js`

- Đọc header `Authorization: Bearer <token>`.
- `verifyAccessToken` → lấy `userId`, tra `User` trong DB.
- Gắn `req.user = { userId, role, email, name }`.
- Lỗi → **401** JSON (`Unauthorized` / `Missing or invalid Authorization header` / `User not found`).

### 3.3 `authorize.middleware.js`

- Factory `authorizeRoles(...roles)`: so khớp `req.user.role` với danh sách role.
- Không có `req.user` → **401**; sai role → **403** `Forbidden : insufficient permissions`.

### 3.4 `validate.middleware.js`

- Dùng `validationResult(req)` từ express-validator.
- Lỗi → **422** `{ message: "Validation error", errors: [{ field, msg }] }`.

### 3.5 `errorHandler.js`

- Middleware 4 tham số: trả về `statusCode` từ `err.statusCode` hoặc **500**, `message` từ `err.message`.

---

## 4. JWT (`utils/jwt.js`)

- `signAccessToken(payload)` — ký với `JWT_SECRET`, `expiresIn` từ env hoặc `7d`.
- `verifyAccessToken(token)` — verify và trả payload (vd. `userId`, `role`).

---

## 5. Model dữ liệu (Mongoose)

### 5.1 `User`

- Trường: `name`, `email` (unique, required), `password` (required, minlength 6), `role` enum `user | showroom | admin` (default `user`), `is_active` (default true), `age` (optional).
- Hook `pre("save")`: nếu `password` đổi thì hash bcrypt (salt 10).
- Method `comparePassword(plain)`.

### 5.2 `Vehicle`

- Thông tin xe: `vehicle_type`, `brand`/`model`/`year`, `transmission`, `fuel_type`, `description`, …
- Trường đăng ký chi tiết: `vehicle_brand`, `vehicle_model`, `vehicle_engine_number`, `vehicle_identification_number`, `vehicle_plate_number`, `vehicle_images_paths`, `images`, giá thuê, đơn vị thời gian thuê, trạng thái `status`, `verified`, `company_owned`, `active`.
- `added_by` → ref `User` (bắt buộc).
- Enum quan trọng: `vehicle_type` (gồm `Bicycle` trong model), `vehicle_hire_rate_currency` (`VND`|`USD`), `vehicle_hire_charge_per_timing`, `status`.

### 5.3 `VehicleLocation`

- `address`, `latitude`, `longitude`, `plus_code` (kiểu String trong schema), `vehicle` ref `Vehicle` (required).

### 5.4 `Review`

- `user` ref `User`, `vehicle_id` ref `Vehicle`, `rating` 1–5, `comment`.

### 5.5 `Favorite`

- `user_id`, `vehicle_id`; **unique index** `(user_id, vehicle_id)` để không trùng yêu thích.

### 5.6 `Booking` — **chỉ có model, chưa có route/controller trong `src`**

- `user_id`, `showroom_id`, `vehicle_id`, `start_date`, `end_date`, `total_price`, `status` (nhiều trạng thái booking), `note`.

### 5.7 `Payment` — **chỉ có model**

- `booking_id`, `amount`, `currency`, `payment_method`, `payment_status`, Stripe intent, `transaction_code`, `paid_at`, `paid_by`.

### 5.8 `ContactUs` — **chỉ có model**

- `title` (max 30), `body` (max 100), `name`, `email`.

---

## 6. BaseService (`services/base.service.js`)

- `DEFAULT_PAGE = 1`, `DEFAULT_LIMIT = 10`, `MAX_LIMIT = 100`.
- `parsePagination`: `page`, `limit`, `skip`.
- `parseSortDirection`: chỉ chấp nhận `-1` hoặc `1`, ngược lại `null`.
- `findPaginated(Model, filter, sort, { page, limit, skip })`: `find` + `countDocuments`, trả `{ data, pagination: { total, page, limit, totalPages } }`.

---

## 7. API theo module (prefix từ `app.js`)

### 7.1 Auth — `/api/auth`

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| POST | `/register` | Không | Đăng ký; kiểm tra email trùng |
| POST | `/login` | Không | Đăng nhập; trả `{ user, token }` |

**Validation đăng ký:** `name`, `email`, `password` (≥6), `role` optional trong `user|showroom|admin`, `is_active` optional boolean, `age` optional 0–150.

**Service:** `register` tạo user; `login` so password, `pick` user an toàn, ký JWT.

**Lưu ý:** `login` dùng `.select("+password")` nhưng schema password không set `select: false` — vẫn lấy được password để so sánh.

---

### 7.2 Upload — `/api/uploads`

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| POST | `/image/files` | Không (hiện tại) | Multipart field `files`, tối đa 5 file, memory storage |

**Luồng:** `multer.array("files", 5)` → `validateImageUpload` (ít nhất 1 file, mimetype `image/*`) → `UploadService.uploadBuffer` → Cloudinary (encode base64 data URI).

**Phản hồi:** `{ message, data: [{ url, publicId }, ...] }`.

---

### 7.3 Vehicles — `/api/vehicles`

| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| POST | `/create` | **Bearer JWT** | Tạo xe, `added_by` = `req.user.userId` |
| POST | `/getListVehicles` | Không | Danh sách có lọc, sort, phân trang (body JSON) |
| GET | `/getVehicleById/:vehicleId` | Không | Chi tiết theo id |
| DELETE | `/deleteVehicleById/:vehicleId` | Không | Xóa theo id (**không kiểm tra ownership**) |

**`getListVehicles` (body):**

- `search`: regex không phân biệt hoa thường trên `vehicle_brand`, `vehicle_model` (`$or`).
- `vehicle_type`, `added_by` (MongoId).
- `sort_by`: `-1` | `1` → `createdAt` (mặc định sort `createdAt: -1` nếu không hợp lệ).
- `sort_by_price`: `-1` | `1` → `vehicle_hire_rate_in_figures`.
- `page`, `limit` (qua `BaseService`).

---

### 7.4 Vehicle location — `/api/vehicle_location`

Toàn bộ route dùng `router.use(authMiddleware)` — **bắt buộc JWT**.  
`authorizeRoles("showroom")` đang **comment**, nên mọi user đăng nhập đều có thể gọi (nếu có token).

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/createVehicleLocation/:vehicleId` | Tạo bản ghi vị trí mới cho `vehicleId` |
| GET | `/getVehicleLocationByVehicleId/:vehicleId` | `findOne({ vehicle })` — một vị trí |
| PUT | `/vehicle/:vehicleId` | Upsert vị trí: cập nhật hoặc tạo nếu chưa có; **service nhận `showroomId` từ `req.user` nhưng không dùng để kiểm tra quyền sở hữu xe** |

**Validation `updateCurrentLocation`:** `latitude`, `longitude` bắt buộc; `address`, `plus_code` optional.

---

### 7.5 Reviews — `/api/reviews`

| Method | Path | Auth / Role | Mô tả |
|--------|------|-------------|--------|
| POST | `/get-by-vehicle` | Không | Danh sách review theo `vehicle_id` (body), có phân trang |
| POST | `/create` | JWT + **role `user`** | Tạo review |
| PATCH | `/update` | JWT + **role `user`** | Cập nhật review của chính user (`review_id`) |

**`getReviewsByVehicleId`:** populate `user` trường `name`; sort `createdAt` desc.

---

### 7.6 Favorites — `/api/favorites`

Toàn bộ: JWT + **role `user`**.

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/toggle` | Nếu đã yêu thích thì xóa, chưa thì tạo; unique index tránh trùng |
| POST | `/my-favorites` | Danh sách favorite của user, populate một số trường `Vehicle` |

**Phản hồi toggle:** khi thêm `{ favorite: true, vehicle_id }`, khi bỏ `{ favorited: false, vehicle_id }` — **tên field không thống nhất** (`favorite` vs `favorited`).

---

## 8. Xử lý lỗi nghiệp vụ

- `throwError(message, statusCode)` tạo `Error` và gắn `statusCode` (mặc định 404), ném ra để `errorHandler` trả JSON.

Các service dùng cho: email trùng (qua middleware route không — auth service tự throw), xe/review không tồn tại, review update không tìm thấy bản ghi của user, v.v.

---

## 9. Lưu ý kỹ thuật & chỗ còn thiếu

1. **`src/config/db.js`:** trong `catch` dùng `console.error(err)` trong khi biến là `error` — có thể gây **ReferenceError** khi kết nối DB thất bại.
2. **Validation vs Model `vehicle_type`:** trong `vehicle.validation.js` có giá trị `"Bicyle"` (sai chính tả), trong `vehicle.model.js` là `"Bicycle"` — request có thể bị từ chối 422 hoặc không khớp enum nếu sửa không đồng bộ.
3. **Bảo mật / quyền:** xóa xe, sửa vị trí, tạo vị trí không kiểm tra `added_by` hay role showroom; upload ảnh không yêu cầu JWT — cần cân nhắc cho production.
4. **Model chưa expose API:** `Booking`, `Payment`, `ContactUs` chưa có route tương ứng trong `src`.
5. **`upload.service.js`:** import `model` từ `mongoose` không dùng — dead code.
6. **HTTP status:** một số GET/delete vehicle trả **201** thay vì **200**/**204** — không sai chức năng nhưng không chuẩn REST.

---

## 10. Bảng tóm tắt endpoint

| Prefix | Endpoints chính |
|--------|------------------|
| `/api/auth` | `POST /register`, `POST /login` |
| `/api/uploads` | `POST /image/files` |
| `/api/vehicles` | `POST /create`, `POST /getListVehicles`, `GET /getVehicleById/:id`, `DELETE /deleteVehicleById/:id` |
| `/api/vehicle_location` | `POST .../createVehicleLocation/:vehicleId`, `GET .../getVehicleLocationByVehicleId/:vehicleId`, `PUT .../vehicle/:vehicleId` |
| `/api/reviews` | `POST /get-by-vehicle`, `POST /create`, `PATCH /update` |
| `/api/favorites` | `POST /toggle`, `POST /my-favorites` |

---

*Tài liệu được tạo từ mã nguồn trong `src` và `server.js` / `package.json` của repository.*
