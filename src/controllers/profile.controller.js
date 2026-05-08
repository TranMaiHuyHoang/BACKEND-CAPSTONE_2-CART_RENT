const ProfileService = require('../services/profile.service');

class ProfileController {
  async getProfileById(req, res, next) {
    try {
      const user = await ProfileService.getProfileById(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });
      }
      res.status(200).json({ message: 'Lấy hồ sơ thành công', data: user });
    } catch (err) {
      next(err);
    }
  }

  async getListProfiles(req, res, next) {
    try {
      const result = await ProfileService.getListProfiles(req.body);
      res.status(200).json({ message: 'Lấy danh sách hồ sơ thành công', ...result });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.params.userId
      const body = req.body
      const updatedUser = await ProfileService.updateProfile(userId, body);
      if (!updatedUser) {
        return res.status(404).json({ message: 'Không tìm thấy hồ sơ để cập nhật' });
      }
      res.status(200).json({ message: 'Cập nhật hồ sơ thành công', data: updatedUser });
    } catch (err) {
      next(err);
    }
  }

  async getMyProfile(req, res, next) {
    try {
      const data = await ProfileService.getMyProfile(req.user.userId);
      return res.status(200).json({ message: "Lấy hồ sơ của tôi thành công", data });
    } catch (error) {
      next(error);
    }
  }

  async updateMyProfile(req, res, next) {
    try {
      const data = await ProfileService.updateMyProfile(req.user.userId, req.body);
      return res.status(200).json({ message: "Đã cập nhật hồ sơ của tôi", data });
    } catch (error) {
      next(error);
    }
  }

  async deleteProfileById(req, res, next) {
    try {
      const deletedUser = await ProfileService.deleteProfileById(req.params.userId);
      if (!deletedUser) {
        return res.status(404).json({ message: 'Không tìm thấy hồ sơ để xóa' });
      }
      res.status(200).json({ message: 'Xóa hồ sơ thành công' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProfileController();
