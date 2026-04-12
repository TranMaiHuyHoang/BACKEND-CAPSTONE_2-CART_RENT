// controllers/userLocationController.js
const userLocationService = require('../services/userLocation.service');

class UserLocationController {
  async createUserLocation(req, res, next) {
    try {
      const location = await userLocationService.createUserLocation(req.body);
      res.status(201).json({
        message: 'Tạo địa chỉ thành công',
        data: location
      });
    } catch (error) {
      next(error);
    }
  }

  async getListUserLocations(req, res, next) {
    try {
      const body = req.body;
      const result = await userLocationService.getListUserLocations();
      res.status(200).json({
        message: 'Lấy danh sách địa chỉ thành công',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserLocationById(req, res, next) {
    try {
      const location = await userLocationService.getUserLocationById(req.params.locationId);
      if (!location) {
        return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
      }
      res.status(200).json({
        message: 'Lấy địa chỉ thành công',
        data: location
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserLocationById(req, res, next) {
    try {
      const location = await userLocationService.updateUserLocationById(req.params.locationId, req.body);
      if (!location) {
        return res.status(404).json({ message: 'Không tìm thấy địa chỉ để cập nhật' });
      }
      res.status(200).json({
        message: 'Cập nhật địa chỉ thành công',
        data: location
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUserLocationById(req, res, next) {
    try {
      const location = await userLocationService.deleteUserLocationById(req.params.locationId);
      if (!location) {
        return res.status(404).json({ message: 'Không tìm thấy địa chỉ để xoá' });
      }
      res.status(200).json({
        message: 'Xoá địa chỉ thành công',
        data: location
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserLocationController();
