const { body, param } = require("express-validator");

class ProfileValidation {

    commonUpdatedFields = [
        body("name")
            .optional()
            .isString().withMessage("name phải là chuỗi")
            .trim()
            .isLength({ min: 2, max: 100 }).withMessage("name phải từ 2-100 ký tự"),

        body("email")
            .optional()
            .isEmail().withMessage("email không hợp lệ")
            .normalizeEmail()
            .isLength({ max: 255 }),

        body("phone")
            .optional()
            .isMobilePhone('any').withMessage("phone không đúng định dạng"),

        body("address")
            .optional()
            .isString().withMessage("address phải là chuỗi")
            .trim()
            .isLength({ max: 500 }).withMessage("address tối đa 500 ký tự"),
    ];

    getProfileById = [
        param("userId")
            .notEmpty().withMessage("userId là bắt buộc")
            .bail()
            .isMongoId().withMessage("userId phải là một ObjectId hợp lệ (24 ký tự hex)"),
    ];

    getListProfiles = [
        body("page")
            .optional({ nullable: true })
            .isInt({ min: 1 }).withMessage("page phải là số nguyên lớn hơn hoặc bằng 1")
            .toInt(),

        body("limit")
            .optional({ nullable: true })
            .isInt({ min: 1, max: 100 }).withMessage("limit phải nằm trong khoảng 1-100")
            .toInt(),

        body("search")
            .optional({ nullable: true })
            .isString().withMessage("search phải là chuỗi")
            .trim()
            .isLength({ max: 100 }).withMessage("search tối đa 100 ký tự"),

        body("sort_by")
            .optional({ nullable: true })
            .isIn([1, -1])
            .withMessage("sort_by chỉ chấp nhận 1 (tăng dần) hoặc -1 (giảm dần theo createdAt)"),

        body("sort_by_name")
            .optional({ nullable: true })
            .isIn([1, -1]).withMessage("sort_by_name chỉ chấp nhận 1 (tăng dần) hoặc -1 (giảm dần)"),
    ];

    updateProfile = [
    param("userId")
      .notEmpty().withMessage("userId là bắt buộc")
      .bail()
      .isMongoId().withMessage("userId phải là một ObjectId hợp lệ"),
    ...this.commonUpdatedFields,
  ];

    deleteProfileById = [
        param("userId")
            .notEmpty().withMessage("userId là bắt buộc")
            .bail()
            .isMongoId().withMessage("userId phải là một ObjectId hợp lệ (24 ký tự hex)")
            .bail(),
    ];

    updateMyProfile = [
        ...this.commonUpdatedFields
        // Showroom
        // body('business_name').optional().trim().isLength({ max: 200 }),
        // body('public_address').optional().trim().isLength({ max: 500 }),
        // body('opening_hours').optional().trim().isLength({ max: 200 }),
        // body('policy_text').optional().trim().isLength({ max: 20000 }),
        // body('logo_url').optional().trim().isLength({ max: 500 }).isURL(),
        // body('showroom_description').optional().trim().isLength({ max: 5000 }),
        // body('showroom_representative_name').optional().trim().isLength({ max: 120 }),
        // body('showroom_license_public').optional().trim().isLength({ max: 200 }),
    ];

}

module.exports = new ProfileValidation();