"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TherapistDocumentModel = void 0;
const mongoose_1 = require("mongoose");
const therapistDocumentSchema = new mongoose_1.Schema({
    therapistId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'TherapistProfile',
        required: true,
        index: true,
    },
    fileUrl: { type: String, required: true, trim: true },
    objectKey: { type: String, required: true, trim: true, index: true },
    type: {
        type: String,
        required: true,
        enum: ['license', 'degree', 'certificate'],
        index: true,
    },
    mimeType: { type: String, required: true, trim: true },
    sizeBytes: { type: Number, required: true, min: 1 },
    uploadedAt: { type: Date, required: true, default: Date.now },
}, {
    timestamps: true,
    versionKey: false,
});
therapistDocumentSchema.index({ therapistId: 1, type: 1, uploadedAt: -1 });
exports.TherapistDocumentModel = (0, mongoose_1.model)('TherapistDocument', therapistDocumentSchema);
exports.default = exports.TherapistDocumentModel;
