const vehicleLocationModel = require("../models/vehicleLocation.model");

class VehicleLocationService {
    async createVehicleLocation(location, vehicleId) {
        return vehicleLocationModel.create({ ...location, vehicle: vehicleId });
    }

    async getVehicleLocationByVehicleId(vehicleId) {
        return vehicleLocationModel.findById({ vehicle: vehicleId});
    }
}

module.exports = new VehicleLocationService();
