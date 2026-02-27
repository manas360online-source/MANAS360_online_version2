"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionModel = void 0;
const mongoose_1 = require("mongoose");
const subscriptionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        sparse: true,
        index: true,
    },
    planType: {
        type: String,
        enum: ['basic', 'premium', 'pro'],
        required: true,
        index: true,
    },
    planName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'paused'],
        default: 'active',
        index: true,
    },
    startDate: {
        type: Date,
        required: true,
        index: true,
    },
    expiryDate: {
        type: Date,
        required: true,
        index: true,
    },
    renewalDate: {
        type: Date,
        default: null,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
        max: 1000000,
    },
    currency: {
        type: String,
        enum: ['INR'],
        required: true,
        default: 'INR',
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'quarterly', 'annual'],
        required: true,
    },
    autoRenew: {
        type: Boolean,
        default: true,
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
    cancelledReason: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
    },
    paymentMethodId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'PaymentMethod',
        default: null,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});
// Indexes for efficient querying
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ planType: 1 });
subscriptionSchema.index({ startDate: 1, expiryDate: 1 });
subscriptionSchema.index({ status: 1, expiryDate: 1 });
subscriptionSchema.index({ planType: 1, status: 1 });
exports.SubscriptionModel = (0, mongoose_1.model)('Subscription', subscriptionSchema);
exports.default = exports.SubscriptionModel;
