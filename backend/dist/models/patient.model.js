"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientMoodEntryModel = exports.PatientAssessmentModel = exports.PatientProfileModel = void 0;
const mongoose_1 = require("mongoose");
const emergencyContactSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    relation: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
}, { _id: false });
const patientProfileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    age: { type: Number, required: true, min: 1, max: 120 },
    gender: { type: String, required: true, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    medicalHistory: { type: String, default: null, trim: true, maxlength: 2000 },
    emergencyContact: { type: emergencyContactSchema, required: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
    versionKey: false,
});
const patientAssessmentSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'PatientProfile',
        required: true,
        index: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['PHQ-9', 'GAD-7'],
    },
    answers: {
        type: [Number],
        required: true,
        validate: {
            validator: (values) => values.every((value) => Number.isInteger(value) && value >= 0 && value <= 3),
            message: 'answers must contain integer values between 0 and 3',
        },
    },
    totalScore: { type: Number, required: true, min: 0 },
    severityLevel: { type: String, required: true },
}, {
    timestamps: true,
    versionKey: false,
});
const patientMoodEntrySchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'PatientProfile',
        required: true,
        index: true,
    },
    moodScore: { type: Number, required: true, min: 1, max: 10 },
    note: { type: String, default: null, trim: true, maxlength: 1000 },
    date: { type: Date, required: true, index: true },
}, {
    timestamps: true,
    versionKey: false,
});
patientMoodEntrySchema.index({ patientId: 1, date: -1 });
patientAssessmentSchema.index({ patientId: 1, createdAt: -1 });
const applyNotDeletedFilter = function () {
    const options = this.getOptions();
    if (options.withDeleted === true) {
        return;
    }
    const filter = this.getFilter();
    if (Object.prototype.hasOwnProperty.call(filter, 'isDeleted')) {
        return;
    }
    this.setQuery({
        ...filter,
        isDeleted: false,
    });
};
patientProfileSchema.pre('find', applyNotDeletedFilter);
patientProfileSchema.pre('findOne', applyNotDeletedFilter);
patientProfileSchema.pre('findOneAndUpdate', applyNotDeletedFilter);
patientProfileSchema.pre('countDocuments', applyNotDeletedFilter);
exports.PatientProfileModel = (0, mongoose_1.model)('PatientProfile', patientProfileSchema);
exports.PatientAssessmentModel = (0, mongoose_1.model)('PatientAssessment', patientAssessmentSchema);
exports.PatientMoodEntryModel = (0, mongoose_1.model)('PatientMoodEntry', patientMoodEntrySchema);
exports.default = exports.PatientProfileModel;
