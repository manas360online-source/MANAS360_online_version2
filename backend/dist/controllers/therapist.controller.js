"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMyTherapistDocumentController = exports.getMyTherapistProfileController = exports.createTherapistProfileController = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const response_1 = require("../utils/response");
const therapist_service_1 = require("../services/therapist.service");
const getAuthUserId = (req) => {
    const userId = req.auth?.userId;
    if (!userId) {
        throw new error_middleware_1.AppError('Authentication required', 401);
    }
    return userId;
};
const createTherapistProfileController = async (req, res) => {
    const userId = getAuthUserId(req);
    if (!req.validatedTherapistProfilePayload) {
        throw new error_middleware_1.AppError('Invalid therapist profile payload', 400);
    }
    const profile = await (0, therapist_service_1.createTherapistProfile)(userId, req.validatedTherapistProfilePayload);
    (0, response_1.sendSuccess)(res, profile, 'Therapist profile created', 201);
};
exports.createTherapistProfileController = createTherapistProfileController;
const getMyTherapistProfileController = async (req, res) => {
    const userId = getAuthUserId(req);
    const profile = await (0, therapist_service_1.getMyTherapistProfile)(userId);
    (0, response_1.sendSuccess)(res, profile, 'Therapist profile fetched');
};
exports.getMyTherapistProfileController = getMyTherapistProfileController;
const uploadMyTherapistDocumentController = async (req, res) => {
    const userId = getAuthUserId(req);
    if (!req.validatedTherapistDocumentPayload) {
        throw new error_middleware_1.AppError('Invalid therapist document payload', 400);
    }
    if (!req.file) {
        throw new error_middleware_1.AppError('Document file is required', 400);
    }
    const result = await (0, therapist_service_1.uploadMyTherapistDocument)(userId, req.validatedTherapistDocumentPayload, {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        size: req.file.size,
    });
    (0, response_1.sendSuccess)(res, result, 'Therapist document uploaded', 201);
};
exports.uploadMyTherapistDocumentController = uploadMyTherapistDocumentController;
