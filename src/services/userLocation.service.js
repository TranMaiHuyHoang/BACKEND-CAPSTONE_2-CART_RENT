const UserLocation = require('../models/userLocation.model');
const BaseService = require('./base.service');
const QueryBuilder = require('../utils/queryBuilder');

class UserLocationService {
  async createUserLocation(body = {}) {
    const location = await UserLocation.create({ ...body });
    return location
  }

  async getListUserLocations(body = {}) {
    const {
      search,
      page,
      limit,
      sort_by,
      userId
    } = body;

    // Pagination
    const pagination = BaseService.parsePagination({ page, limit });

    // Search filter
    const searchFilter = QueryBuilder.buildSearchFilter(search, { address: true });

    // Exact field filter
    const fieldFilter = QueryBuilder.buildExactFieldFilter({ user: userId });

    // Combine filters
    const filter = { $and: [searchFilter, fieldFilter] };

    // Sort options
    const sortObj = QueryBuilder.buildSortOptions([
      { field: 'createdAt', value: sort_by },
    ]);

    // Query DB với lean để tối ưu
    return BaseService.findPaginated(UserLocation, filter, sortObj, pagination);
  }


  async getUserLocationById(locationId) {
    return await UserLocation.findById(locationId)
  }

  async updateUserLocationById(locationId, body={}) {
    return await UserLocation.findByIdAndUpdate(locationId, { ...body }, { new: true })
  }

  async deleteUserLocationById(locationId) {
    return await UserLocation.findByIdAndDelete(locationId)
  }
}

module.exports = new UserLocationService();