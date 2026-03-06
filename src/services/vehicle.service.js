const vehicleModel = require("../models/vehicle.model");

class VeHicleService {
    async createVehicle(vehicle, userId) {
        return vehicleModel.create({ ...vehicle, added_by: userId });
    }

    async getListVehicles() {
        return vehicleModel.find({})
    }

    async getVehicleById(vehicleId) {
        return vehicleModel.findById(vehicleId);
    }

    async deleteVehicleById(vehicleId) {
        return vehicleModel.findByIdAndDelete(vehicleId);
    }
};

module.exports = new VeHicleService()
