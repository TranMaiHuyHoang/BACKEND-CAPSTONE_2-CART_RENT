const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
    {
        vehicle_type: {
            type: String,
            required: true,
            enum: ['Sedan', 'Bike', 'Bicyle', 'SUV', 'Wagon', 'Truck', 'others'],
            default: 'Sedan'
        },

        vehicle_brand: { type: String, required: true },
        vehicle_model: { type: String, required: true },
        vehicle_engine_number: { type: String, required: true },
        vehicle_identification_number: { type: String, required: true },
        vehicle_plate_number: { type: String, required: true },
        vehicle_images_paths: { type: [String], default: '' },
        vehicle_hire_rate_in_figures: Number,
        vehicle_hire_rate_currency: {
            type: String,
            required: true,
            enum: ['VND', 'USD'],
            default: 'VND'
        },

        vehicle_hire_charge_per_timing: {
            type: String,
            required: true,
            enum: ['minutes', 'seconds', ' hourly', 'day', 'negotiable'],
            default: 'minutes'
        },

        maximum_allowable_distance: String,
        status: {
            type: String,
            required: true,
            enum: ['Available', 'Maintenance', 'Rented', 'Reserved'],
            default: 'Available'
        },

        ratings: {
            type: Map,
            of: String,
            default: {}
        },

        comments: {
            type: Map,
            of: String,
            default: {}
        },

        verified: { type: Date },
        company_owned: { type: Boolean, default: false },
        added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        active: { type: Boolean, default: true },
        deleted_at: String
    },
    { timestamps: true }
);


module.exports = mongoose.model('Vehicle', vehicleSchema);
