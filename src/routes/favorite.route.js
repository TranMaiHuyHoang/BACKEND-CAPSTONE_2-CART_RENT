const express = require("express");
const favoriteController = require("../controllers/favorite.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorizeRoles = require("../middlewares/authorize.middleware");


const router = express.Router();
router.use(authMiddleware);
router.use(authorizeRoles("user"));

router.post(
    "/toggle",
    favoriteController.toggleFavorite
);

router.post(
    "/my-favorites",
    favoriteController.getMyFavorites
);

module.exports = router;
