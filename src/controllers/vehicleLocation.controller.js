const vehicleLocationService = require("../services/vehicleLocation.service");

class VehicleLocationController {
    async createVehicleLocation(req, res, next) {
        try {
            const vehicleId = req.params.vehicleId;
            const location = req.body;
            const result = await vehicleLocationService.createVehicleLocation(location, vehicleId);
            return res.status(201).json({ message: "Vehicle location created successfully ", data: result });
        } catch (error) {
            next(error)
        }
    }

    async getVehicleLocationByVehicleId(req, res, next) {
        try {
            const vehicleId = req.params.vehicleId;
            const location = req.body;
            const result = await vehicleLocationService.getVehicleLocationByVehicleId(vehicleId, location);
            return res.status(200).json({ message: "User location received successfully", data: result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new VehicleLocationController();
