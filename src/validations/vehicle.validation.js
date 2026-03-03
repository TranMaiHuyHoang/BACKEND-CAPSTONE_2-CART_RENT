const { body } = require("express-validator");

const VEHICLE_TYPES = ["Sedan", "Bike", "Bicyle", "SUV", "Wagon", "Truck", "others"];
const CURRENCIES = ["VND", "USD"];
const CHARGES = ["minutes", "seconds", "hourly", "day", "negotiable"];
const STATUS = ["Available", "Maintenance", "Rented", "Reserved"];

class VehicleValidation {
    createVehicle = [
        body("vehicle_type").notEmpty().isIn(VEHICLE_TYPES),
        body("vehicle_brand").notEmpty().trim(),
        body("vehicle_model").notEmpty().trim(),
        body("vehicle_engine_number").notEmpty().trim(),
        body("vehicle_identification_number").notEmpty().trim(),
        body("vehicle_plate_number").notEmpty().trim(),

        body("vehicle_images_paths").optional().isArray().withMessage("vehicle_images_paths bắt buộc array"),
        body("vehicle_images_paths.*").optional().isURL().withMessage("vehicle_images_paths bắt buộc là url"),

        body("vehicle_hire_rate_in_figures").optional().isFloat({ gt: 0 }),
        body("vehicle_hire_rate_currency").optional().isIn(CURRENCIES),

        body("vehicle_hire_charge_per_timing").optional().isIn(CHARGES),

        body("maximum_allowable_distance").optional().trim(),
        body("status").optional().isIn(STATUS),

        body("company_owned").optional().isBoolean(),
        body("active").optional().isBoolean(),
    ]
}

module.exports = new VehicleValidation();
