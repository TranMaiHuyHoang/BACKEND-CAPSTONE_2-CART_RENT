
const express = require('express');
const profileController = require('../controllers/profile.controller');
const router = express.Router();
const profileValidation = require('../validations/profile.validation');
const validate = require('../middlewares/validate.middleware');
const authorizeRoles = require('../middlewares/authorize.middleware');
const authMiddleware = require('../middlewares/auth.middleware');


router.get(
  '/getProfileById/:userId',
  profileValidation.getProfileById,
  validate,
  authMiddleware,
  authorizeRoles('admin'), //tránh lấy profile người khác ngoài quyền admin
  profileController.getProfileById
);

// Lấy danh sách profiles
router.post(
  '/getListProfiles',
  profileValidation.getListProfiles,
  validate,
  authMiddleware, 
  authorizeRoles('admin'),
  profileController.getListProfiles
);

// Cập nhật profile
router.put(
  '/updateProfile/:userId',
  profileValidation.updateProfile,
  validate,
  authMiddleware,
  authorizeRoles('admin'),
  profileController.updateProfile
);

// Xóa profile theo id
router.delete(
  '/deleteProfileById/:userId',
  profileValidation.deleteProfileById,
  validate,
  authMiddleware,
  authorizeRoles('admin'),
  profileController.deleteProfileById
);

router.get('/getMyProfile', authMiddleware, profileController.getMyProfile);
router.patch('/updateMyProfile', authMiddleware, profileValidation.updateMyProfile, validate, profileController.updateMyProfile);


module.exports = router;