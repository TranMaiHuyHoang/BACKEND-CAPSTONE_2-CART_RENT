const express = require('express');
const vehicleController = require('../controllers/vehicle.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const vehicleValidation = require('../validations/vehicle.validation');
const validate = require('../middlewares/validate.middleware');
const router = express.Router();

router.post('/create',
    authMiddleware,
    vehicleValidation.createVehicle, validate,
    vehicleController.createVehicle
);

router.get('/getListVehicles', vehicleController.getListVehicles);

router.get('/getVehicleById/:vehicleId', vehicleController.getVehicleById);

router.delete('/deleteVehicleById/:vehicleId', vehicleController.deleteVehicleById);


module.exports = router;

