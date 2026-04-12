
const express = require('express');
const userLocationController = require('../controllers/userLocation.controller');
const router = express.Router();

router.post('/createUserLocation',
    userLocationController.createUserLocation
);

// Lấy danh sách tất cả địa chỉ của user
router.post('/getListUserLocations',
    userLocationController.getListUserLocations
);

// Lấy chi tiết một địa chỉ theo ID
router.get('/getUserLocationById/:locationId',
    userLocationController.getUserLocationById
);

// Cập nhật địa chỉ khi thay đổi (ví dụ đường đổi tên)
router.put('/updateUserLocationById/:locationId',
    userLocationController.updateUserLocationById
);

// Xoá một địa chỉ theo ID
router.delete('/deleteUserLocationById/:locationId',
    userLocationController.deleteUserLocationById
);

module.exports = router;