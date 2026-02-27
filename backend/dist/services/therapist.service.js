"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMyTherapistDocument = exports.getMyTherapistProfile = exports.createTherapistProfile = void 0;
const therapist_model_1 = __importDefault(require("../models/therapist.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const error_middleware_1 = require("../middleware/error.middleware");
const therapist_document_model_1 = __importDefault(require("../models/therapist-document.model"));
const s3_service_1 = require("./s3.service");
const normalizeArray = (values) => {
    const normalized = values
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    return Array.from(new Set(normalized));
};
const minuteToTime = (minute) => {
    const hours = Math.floor(minute / 60)
        .toString()
        .padStart(2, '0');
    const mins = (minute % 60).toString().padStart(2, '0');
    return `${hours}:${mins}`;
};
const assertTherapistUser = async (userId) => {
    const user = await user_model_1.default.findById(userId).select('_id role isDeleted name').lean();
    if (!user) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    if (user.isDeleted) {
        throw new error_middleware_1.AppError('User account is deleted', 410);
    }
    if (user.role !== 'therapist') {
        throw new error_middleware_1.AppError('Therapist role required', 403);
    }
    return user;
};
const toSafeProfile = (profile) => ({
    id: profile._id.toString(),
    displayName: profile.displayName,
    bio: profile.bio ?? null,
    specializations: profile.specializations,
    languages: profile.languages,
    yearsOfExperience: profile.yearsOfExperience,
    consultationFee: profile.consultationFee,
    availabilitySlots: profile.availabilitySlots.map((slot) => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: minuteToTime(slot.startMinute),
        endTime: minuteToTime(slot.endMinute),
        isAvailable: slot.isAvailable,
    })),
    averageRating: profile.averageRating,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
});
const createTherapistProfile = async (userId, input) => {
    const user = await assertTherapistUser(userId);
    const existingProfile = await therapist_model_1.default.findOne({ userId }).select('_id').lean();
    if (existingProfile) {
        throw new error_middleware_1.AppError('Therapist profile already exists', 409);
    }
    const created = await therapist_model_1.default.create({
        userId,
        displayName: user.name?.trim() || 'Therapist',
        bio: input.bio.trim(),
        specializations: normalizeArray(input.specializations),
        languages: normalizeArray(input.languages),
        yearsOfExperience: input.yearsOfExperience,
        consultationFee: input.consultationFee,
        availabilitySlots: input.availabilitySlots,
    });
    const profile = await therapist_model_1.default.findById(created._id)
        .select({
        displayName: 1,
        bio: 1,
        specializations: 1,
        languages: 1,
        yearsOfExperience: 1,
        consultationFee: 1,
        availabilitySlots: 1,
        averageRating: 1,
        createdAt: 1,
        updatedAt: 1,
    })
        .lean();
    if (!profile) {
        throw new error_middleware_1.AppError('Therapist profile not found', 404);
    }
    return toSafeProfile(profile);
};
exports.createTherapistProfile = createTherapistProfile;
const getMyTherapistProfile = async (userId) => {
    await assertTherapistUser(userId);
    const profile = await therapist_model_1.default.findOne({ userId })
        .select({
        displayName: 1,
        bio: 1,
        specializations: 1,
        languages: 1,
        yearsOfExperience: 1,
        consultationFee: 1,
        availabilitySlots: 1,
        averageRating: 1,
        createdAt: 1,
        updatedAt: 1,
    })
        .lean();
    if (!profile) {
        throw new error_middleware_1.AppError('Therapist profile not found', 404);
    }
    return toSafeProfile(profile);
};
exports.getMyTherapistProfile = getMyTherapistProfile;
const uploadMyTherapistDocument = async (userId, payload, file) => {
    await assertTherapistUser(userId);
    const therapistProfile = await therapist_model_1.default.findOne({ userId }).select('_id').lean();
    if (!therapistProfile) {
        throw new error_middleware_1.AppError('Therapist profile not found. Please create profile first.', 404);
    }
    const uploadResult = await (0, s3_service_1.uploadTherapistDocumentToS3)({
        therapistUserId: userId,
        documentType: payload.type,
        buffer: file.buffer,
        mimeType: file.mimetype,
    });
    const document = await therapist_document_model_1.default.create({
        therapistId: therapistProfile._id,
        fileUrl: uploadResult.objectUrl,
        objectKey: uploadResult.objectKey,
        type: payload.type,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedAt: new Date(),
    });
    const signedUrl = await (0, s3_service_1.getSignedTherapistDocumentUrl)(uploadResult.objectKey);
    return {
        documentId: String(document._id),
        type: document.type,
        fileUrl: document.fileUrl,
        signedUrl,
        uploadedAt: document.uploadedAt,
    };
};
exports.uploadMyTherapistDocument = uploadMyTherapistDocument;
