"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TherapySessionModel = void 0;
const mongoose_1 = require("mongoose");
const therapySessionSchema = new mongoose_1.Schema({
    bookingReferenceId: { type: String, required: true, unique: true, index: true },
    patientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'PatientProfile', required: true, index: true },
    therapistId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'TherapistProfile', required: true, index: true },
    dateTime: { type: Date, required: true, index: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending',
        index: true,
    },
    note: {
        encryptedContent: { type: String, default: null },
        iv: { type: String, default: null },
        authTag: { type: String, default: null },
        updatedAt: { type: Date, default: null },
        updatedByTherapistId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'TherapistProfile', default: null },
    },
    cancelledAt: { type: Date, default: null },
}, {
    timestamps: true,
    versionKey: false,
});
therapySessionSchema.index({ therapistId: 1, dateTime: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } } });
therapySessionSchema.index({ patientId: 1, dateTime: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } } });
therapySessionSchema.index({ patientId: 1, status: 1, dateTime: -1 });
exports.TherapySessionModel = (0, mongoose_1.model)('TherapySession', therapySessionSchema);
exports.default = exports.TherapySessionModel;
