const bookingService = require("../services/booking.service");

class BookingController {
  async createBooking(req, res, next) {
    try {
      const userId = req.user.userId;
      const data = req.body;
      const result = await bookingService.createBooking(data, userId);
      return res.status(201).json({
        message: "Tạo đặt chỗ thành công",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllBookings(req, res, next) {
    try {
        const filters = req.query;
        const result = await bookingService.getAllBookings(filters);

        return res.status(200).json({
            message: "Lấy danh sách đặt chỗ thành công",
            ...result
        });
    } catch (error) {
        next(error);
    }
}


  async getBookingById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await bookingService.getBookingById(id);
      if (!result) {
        return res.status(404).json({
          message: "Không tìm thấy đặt chỗ",
        });
      }
      return res.status(200).json({
        message: "Lấy thông tin đặt chỗ thành công",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBookingStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({
          message: "Trạng thái không được để trống",
        });
      }
      const result = await bookingService.updateBookingStatus(id, status);
      if (!result) {
        return res.status(404).json({
          message: "Không tìm thấy đặt chỗ để cập nhật",
        });
      }
      
      return res.status(200).json({
        message: "Cập nhật trạng thái đặt chỗ thành công",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBooking(req, res, next) {
    try {
      const { id } = req.params;
      const result = await bookingService.deleteBooking(id);
      if (!result) {
        return res.status(404).json({
          message: "Không tìm thấy đặt chỗ để xóa",
        });
      }
      return res.status(200).json({
        message: "Xóa đặt chỗ thành công",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingController();