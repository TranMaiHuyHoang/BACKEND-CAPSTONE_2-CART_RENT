const vehicleModel = require("../models/vehicle.model");
const BaseService = require("./base.service");

/** Trường dùng để search theo tên (regex) */
const SEARCH_FIELDS = ["vehicle_brand", "vehicle_model"];

class VehicleService {
    async createVehicle(vehicle, userId) {
        return vehicleModel.create({ ...vehicle, added_by: userId });
    }

    /**
     * Build filter: search (regex trên SEARCH_FIELDS), vehicle_type, added_by.
     */
    _buildFilter(query) {
        const { search, vehicle_type, added_by } = query;
        const filter = {};

        if (search && String(search).trim()) {
            const regex = new RegExp(String(search).trim(), "i");
            filter.$or = SEARCH_FIELDS.map((field) => ({ [field]: regex }));
        }
        if (vehicle_type) filter.vehicle_type = vehicle_type;
        if (added_by) filter.added_by = added_by;

        return filter;
    }

    /**
     * sort_by: -1 mới nhất, 1 cũ nhất (createdAt).
     * sort_by_price: -1 cao→thấp, 1 thấp→cao.
     * Ưu tiên sort_by_price làm sort chính nếu có.
     */
    _buildSort(query) {
        const sortBy = BaseService.parseSortDirection(query.sort_by);
        const sortByPrice = BaseService.parseSortDirection(query.sort_by_price);

        if (sortByPrice !== null) {
            return {
                vehicle_hire_rate_in_figures: sortByPrice,
                createdAt: sortBy !== null ? sortBy : -1,
            };
        }
        return {
            createdAt: sortBy !== null ? sortBy : -1,
        };
    }

    async getListVehicles(query = {}) {
        const filter = this._buildFilter(query);
        const sort = this._buildSort(query);
        const pagination = BaseService.parsePagination(query);

        return BaseService.findPaginated(vehicleModel, filter, sort, pagination);
    }

    async getVehicleById(vehicleId) {
        return vehicleModel.findById(vehicleId);
    }

    async deleteVehicleById(vehicleId) {
        return vehicleModel.findByIdAndDelete(vehicleId);
    }
}

module.exports = new VehicleService();
