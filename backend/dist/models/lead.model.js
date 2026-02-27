"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TherapistLeadModel = void 0;
const mongoose_1 = require("mongoose");
const therapistLeadSchema = new mongoose_1.Schema({
    therapistId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'TherapistProfile',
        required: true,
        index: true,
    },
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'PatientProfile',
        required: true,
        index: true,
    },
    issueType: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
    },
    assessmentSeverity: {
        type: String,
        required: true,
        enum: ['minimal', 'mild', 'moderate', 'moderately_severe', 'severe'],
        index: true,
    },
    leadPrice: {
        type: Number,
        required: true,
        min: 0,
        max: 100000,
    },
    status: {
        type: String,
        required: true,
        enum: ['available', 'purchased'],
        default: 'available',
        index: true,
    },
    matchedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    purchasedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});
therapistLeadSchema.index({ therapistId: 1, status: 1, matchedAt: -1 });
therapistLeadSchema.index({ therapistId: 1, patientId: 1, issueType: 1 });
exports.TherapistLeadModel = (0, mongoose_1.model)('TherapistLead', therapistLeadSchema);
exports.default = exports.TherapistLeadModel;
