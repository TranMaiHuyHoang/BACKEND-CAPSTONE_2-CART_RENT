const { body, param } = require("express-validator");

class VehicleLocationValidation {
    updateCurrentLocation = [
        param("vehicleId").notEmpty().withMessage("vehicleId là bắt buộc").isMongoId().withMessage("vehicleId phải là MongoId hợp lệ"),
        body("latitude").notEmpty().withMessage("latitude là bắt buộc").trim(),
        body("longitude").notEmpty().withMessage("longitude là bắt buộc").trim(),
        body("address").optional().trim(),
        body("plus_code").optional().trim(),
    ];
}

module.exports = new VehicleLocationValidation();
