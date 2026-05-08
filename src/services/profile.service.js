const UserModel = require('../models/user.model');

const BaseService = require('./base.service');
const QueryBuilder = require('../utils/queryBuilder');
const throwError = require('../utils/throwError')

class ProfileService {
    async getProfileById(userId) {
        return await UserModel.findById(userId).select('-password');
    }

    async getListProfiles(body = {}) {
        const { search, role, email, sort_by, sort_by_name, page, limit } = body;

        // Pagination
        const pagination = BaseService.parsePagination({ page, limit });
        const searchFilter = QueryBuilder.buildSearchFilter(search, { name: 1, email });
        const fieldFilter = QueryBuilder.buildExactFieldFilter({ role, email });

        const filter = { $and: [searchFilter, fieldFilter] };

        const sortOptions = QueryBuilder.buildSortOptions([
            { field: 'name', value: sort_by_name },
            { field: 'createdAt', value: sort_by }
        ]);

        const result = await BaseService.findPaginated(UserModel, filter, sortOptions, pagination);
        const safeData = {
            ...result,
            data: result.data.map(({ password, __v, ...rest }) => rest)
        };
        return safeData;
    }

    async updateProfile(userId, data) {
        // Các field KHÔNG được phép chỉnh sửa
        const notAllowedFields = ['password'];

        const updates = {};
        Object.keys(data).forEach(field => {
            if (!notAllowedFields.includes(field)) {
                updates[field] = data[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            throwError("Không có dữ liệu cập nhật hợp lệ", 400);
        }

        return await UserModel.findByIdAndUpdate(userId, updates, { new: true })
            .select('-password');
    }

    async getMyProfile(userId) {
        const user = await UserModel.findById(userId).select('-password');
        if (!user) throwError("Không tìm thấy người dùng", 404);
        const safeUser = user.toObject();
        delete safeUser.__v;
        return safeUser;
    }

    async updateMyProfile(userId, payload) {
        const user = await UserModel.findById(userId).select('-password');
        if (!user) throwError("Không tìm thấy người dùng", 404);
        const commonFields = ["name", "email", "phone", "age", "address"];

        // Các field showroom (tạm comment để tránh xung đột)
        /*
        const showroomFields = [
          "business_name",
          "public_address",
          "opening_hours",
          "policy_text",
          "logo_url",
          "showroom_description",
          "showroom_representative_name",
          "showroom_license_public",
        ];
        */

        // Nếu chưa cần showroom thì chỉ dùng commonFields
        const allowedFields = commonFields;
        // Nếu sau này cần showroom thì mở comment và nối vào:
        // const allowedFields = user.role === "showroom"
        //   ? [...commonFields, ...showroomFields]
        //   : commonFields;

        let hasUpdate = false;
        allowedFields.forEach(key => {
            if (payload[key] !== undefined) {
                user[key] = payload[key];
                hasUpdate = true;
            }
        });

        if (!hasUpdate) throwError("Không có dữ liệu cập nhật", 400);

        await user.save();

        const safeUser = user.toObject();
        delete safeUser._v;
        return safeUser;
    }


    async deleteProfileById(userId) {
        return await UserModel.findByIdAndDelete(userId);
    }
}

module.exports = new ProfileService();