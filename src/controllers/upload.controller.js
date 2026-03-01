const UploadService = require('../services/upload.service')
const throwError = require('../utils/throwError')

class UploadController {
    async uploadImageFiles(req, res, next) {
        try {
            const files = req.files || []

            if (!files.length) {
                throwError("files are required (from-data", 400);
            }
            for (const file of files) {
                if (!file.mimetype?.startsWith('image/')) {
                    throwError(`${file.originalname} is not an image`, 400);
                }
            }
            const results = await Promise.all(
                files.map((file) => UploadService.uploadBuffer(file.buffer, file.originalname))
            );

            return res.status(200).json({ message: 'Upload successful', data: results })

        } catch (error) {
            next(error);
        }
    }
}
module.exports = new UploadController();
