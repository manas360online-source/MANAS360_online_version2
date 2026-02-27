"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletTransactionModel = void 0;
const mongoose_1 = require("mongoose");
const walletTransactionSchema = new mongoose_1.Schema({
    walletId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'TherapistWallet',
        required: true,
        index: true,
    },
    therapistId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'TherapistProfile',
        required: true,
        index: true,
    },
    leadId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'TherapistLead',
        required: true,
        index: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['lead_purchase'],
        default: 'lead_purchase',
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        required: true,
        default: 'INR',
        enum: ['INR'],
    },
    status: {
        type: String,
        required: true,
        enum: ['success'],
        default: 'success',
    },
    referenceId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    description: {
        type: String,
        default: null,
        trim: true,
        maxlength: 500,
    },
}, {
    timestamps: true,
    versionKey: false,
});
walletTransactionSchema.index({ therapistId: 1, createdAt: -1 });
exports.WalletTransactionModel = (0, mongoose_1.model)('WalletTransaction', walletTransactionSchema);
exports.default = exports.WalletTransactionModel;
