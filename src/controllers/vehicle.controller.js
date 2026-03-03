const vehicleService = require("../services/vehicle.service");

class VeHicleController {
    async createVehicle(req, res, next) {
        try {
            const userId = req.user.userId;
            const vehicle = req.body;
            const result = await vehicleService.createVehicle(vehicle, userId);
            return res.status(201).json({ message: "Vehicle created successfully", data: result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new VeHicleController();
