const Booking = require('../models/booking.model');
const BaseService = require('./base.service');
const throwError = require('../utils/throwError');


class BookingQueryBuilder {
  static buildFieldFilter({ status, user_id, showroom_id, min_price, max_price }) {
    const filter = {};

    // Exact match filters
    const exactFields = { status, user_id, showroom_id };
    for (const [key, value] of Object.entries(exactFields)) {
      if (value) filter[key] = value;
    }

    // Range filters
    if (min_price || max_price) {
      filter.total_price = {};
      if (min_price) filter.total_price.$gte = Number(min_price);
      if (max_price) filter.total_price.$lte = Number(max_price);
    }

    return filter;
  }

  static buildSearchFilter(search, fields = []) {
    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim(), 'i');
      return {
        $or: fields.map((field) => ({ [field]: regex }))
      };
    }
    return {};
  }

  static buildSort({ sort_by, sort_by_price }) {
    const sort = {
      createdAt: BaseService.parseSortDirection(sort_by) ?? -1,
    };

    const totalPriceSort = BaseService.parseSortDirection(sort_by_price);
    if (totalPriceSort !== null) sort.total_price = totalPriceSort;

    return sort;
  }
}


class BookingService {

  static async createBooking(data) {
    const booking = new Booking(data);
    return booking.save();
  }

  static async getAllBookings(query) {
    const { search, status, user_id, showroom_id, sort_by, sort_by_price, page, limit, min_price, max_price, } = query;

    const pagination = BaseService.parsePagination({ page, limit });

    const searchFilter = BookingQueryBuilder.buildSearchFilter(search, ['note', 'status']);
    const fieldFilter = BookingQueryBuilder.buildFieldFilter({ status, user_id, showroom_id, min_price, max_price });

    const filter = { ...searchFilter, ...fieldFilter };
    const sort = BookingQueryBuilder.buildSort({ sort_by, sort_by_price });

    // Find paginated
    return BaseService.findPaginated(Booking, filter, sort, pagination);
  }

  static async getBookingById(id) {
    return Booking.findById(id)
      .populate('user_id')
      .populate('vehicle_id')
      .populate('showroom_id')
      .lean();
  }

  static async updateBookingStatus(id, status) {
    const booking = await Booking.findById(id);
    if (!booking) throwError('Booking không tồn tại');

    const validStatuses = Booking.schema.path('status').enumValues;

    
    if (!validStatuses.includes(status)) {
      throwError(`Trạng thái "${status}" không hợp lệ`);
    }
    // dùng log để audit hoặc giải quyết tranh chấp nếu cần

    booking.status = status;
    return booking.save();
  }


  static async deleteBooking(id) {
    return Booking.findByIdAndDelete(id);
  }
}

module.exports = BookingService;