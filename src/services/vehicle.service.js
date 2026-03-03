const vehicleModel = require("../models/vehicle.model");

class VeHicleService {
    async createVehicle(vehicle, userId) {
        return vehicleModel.create({ ...vehicle, added_by: userId });
    }
};

module.exports = new VeHicleService()
