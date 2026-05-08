const { body, param, query } = require("express-validator");

class ContactUsValidation {
    
    validateListField = (field) => [
        query(field)
            .optional()
            .isString().withMessage(`${field} phải là chuỗi`)
            .trim()
            .escape(),
        body(field)
            .optional()
            .isString().withMessage(`${field} phải là chuỗi`)
            .trim()
            .escape()
    ];

    // 1. Tạo mới yêu cầu liên hệ
    createContact = [
        body("title")
            .notEmpty().withMessage("Tiêu đề không được để trống")
            .isString().withMessage("Tiêu đề phải là chuỗi")
            .bail()
            .isLength({ min: 5 }).withMessage("Tiêu đề tối thiểu 5 ký tự")
            .isLength({ max: 100 }).withMessage("Tiêu đề tối đa 100 ký tự")
            .trim()
            .escape(),
        body("body")
            .notEmpty().withMessage("Nội dung không được để trống")
            .isString().withMessage("Nội dung phải là chuỗi")
            .bail()
            .isLength({ max: 255 }).withMessage("Nội dung tối đa 255 ký tự")
            .trim()
            .escape(),
        body("name")
            .notEmpty().withMessage("Tên không được để trống")
            .isString().withMessage("Tên phải là chuỗi")
            .bail()
            .isLength({ min: 2, max: 50 }).withMessage("Tên từ 2 đến 50 ký tự")
            .trim()
            .escape(),
        body("email")
            .notEmpty().withMessage("Email không được để trống")
            .isString().withMessage("Email phải là chuỗi")
            .bail()
            .isEmail().withMessage("Email không đúng định dạng")
            .normalizeEmail(),
    ];

    // 2. Lấy danh sách (Dùng POST body theo cấu trúc router của bạn)
    getListContacts = [
        ...this.validateListField("search"),
        query("page")
            .optional()
            .isInt({ min: 1 }).withMessage("Trang phải là số nguyên >= 1")
            .toInt(),
        body("page")
            .optional()
            .isInt({ min: 1 }).withMessage("Trang phải là số nguyên >= 1")
            .toInt(),
        query("limit")
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage("Số lượng mỗi trang từ 1 đến 100")
            .toInt(),
        body("limit")
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage("Số lượng mỗi trang từ 1 đến 100")
            .toInt(),
        query("sort_by")
            .optional()
            .isInt().withMessage("Sắp xếp phải là số nguyên")
            .toInt()
            .isIn([-1, 1]).withMessage("Sắp xếp phải là -1 (giảm dần) hoặc 1 (tăng dần)"),
        body("sort_by")
            .optional()
            .isInt().withMessage("Sắp xếp phải là số nguyên")
            .toInt()
            .isIn([-1, 1]).withMessage("Sắp xếp phải là -1 (giảm dần) hoặc 1 (tăng dần)"),
        ...this.validateListField("name"),
        query("email").optional().isEmail().withMessage("Email lọc không hợp lệ").normalizeEmail(),
        body("email").optional().isEmail().withMessage("Email lọc không hợp lệ").normalizeEmail(),
    ];

    // 3. Lấy chi tiết/Xóa theo ID
    getContactById = [
        param("id")
            .notEmpty().withMessage("ID liên hệ là bắt buộc")
            .isMongoId().withMessage("ID không đúng định dạng hệ thống"),
    ];
}

module.exports = new ContactUsValidation();