"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TherapistProfileModel = void 0;
const mongoose_1 = require("mongoose");
const therapistAvailabilitySlotSchema = new mongoose_1.Schema({
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startMinute: { type: Number, required: true, min: 0, max: 1439 },
    endMinute: { type: Number, required: true, min: 1, max: 1440 },
    isAvailable: { type: Boolean, default: true },
}, { _id: false });
const therapistProfileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 100 },
    bio: { type: String, default: null, trim: true, maxlength: 2000 },
    specializations: { type: [String], required: true, default: [] },
    languages: { type: [String], required: true, default: [] },
    availabilitySlots: { type: [therapistAvailabilitySlotSchema], default: [] },
    yearsOfExperience: { type: Number, default: 0, min: 0, max: 60 },
    consultationFee: { type: Number, default: 0, min: 0, max: 100000 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    maxConcurrentPatients: { type: Number, default: 20, min: 1, max: 200 },
    currentActivePatients: { type: Number, default: 0, min: 0, max: 200 },
    isVerified: { type: Boolean, default: false, index: true },
    verifiedAt: { type: Date, default: null },
    verifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    deletedAt: { type: Date, default: null },
}, {
    timestamps: true,
    versionKey: false,
});
therapistProfileSchema.index({ specializations: 1 });
therapistProfileSchema.index({ languages: 1 });
therapistProfileSchema.index({ 'availabilitySlots.dayOfWeek': 1, 'availabilitySlots.startMinute': 1 });
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
therapistProfileSchema.pre('find', applyNotDeletedFilter);
therapistProfileSchema.pre('findOne', applyNotDeletedFilter);
therapistProfileSchema.pre('findOneAndUpdate', applyNotDeletedFilter);
therapistProfileSchema.pre('countDocuments', applyNotDeletedFilter);
exports.TherapistProfileModel = (0, mongoose_1.model)('TherapistProfile', therapistProfileSchema);
exports.default = exports.TherapistProfileModel;
