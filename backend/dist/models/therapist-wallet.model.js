"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TherapistWalletModel = void 0;
const mongoose_1 = require("mongoose");
const therapistWalletSchema = new mongoose_1.Schema({
    therapistId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'TherapistProfile',
        required: true,
        unique: true,
        index: true,
    },
    currency: {
        type: String,
        required: true,
        default: 'INR',
        enum: ['INR'],
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.TherapistWalletModel = (0, mongoose_1.model)('TherapistWallet', therapistWalletSchema);
exports.default = exports.TherapistWalletModel;
