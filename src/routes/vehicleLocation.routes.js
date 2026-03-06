const express = require("express");
const vehicleLocationController = require("../controllers/vehicleLocation.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();

router.post('/createVehicleLocation/:vehicleId', authMiddleware, vehicleLocationController.createVehicleLocation);

router.get('/getVehicleLocationByVehicleId/:vehicleId', authMiddleware, vehicleLocationController.getVehicleLocationByVehicleId);

module.exports = router;
