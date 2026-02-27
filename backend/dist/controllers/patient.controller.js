"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyTherapistMatchesController = exports.getMyMoodHistoryController = exports.getMyPatientAssessmentHistoryController = exports.createPatientAssessmentController = exports.getMyPatientProfileController = exports.createPatientProfileController = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const patient_service_1 = require("../services/patient.service");
const response_1 = require("../utils/response");
const getAuthUserId = (req) => {
    const userId = req.auth?.userId;
    if (!userId) {
        throw new error_middleware_1.AppError('Authentication required', 401);
    }
    return userId;
};
const createPatientProfileController = async (req, res) => {
    const userId = getAuthUserId(req);
    if (!req.validatedPatientProfile) {
        throw new error_middleware_1.AppError('Invalid patient profile payload', 400);
    }
    const profile = await (0, patient_service_1.createPatientProfile)(userId, req.validatedPatientProfile);
    (0, response_1.sendSuccess)(res, profile, 'Patient profile created', 201);
};
exports.createPatientProfileController = createPatientProfileController;
const getMyPatientProfileController = async (req, res) => {
    const userId = getAuthUserId(req);
    const profile = await (0, patient_service_1.getMyPatientProfile)(userId);
    (0, response_1.sendSuccess)(res, profile, 'Patient profile fetched');
};
exports.getMyPatientProfileController = getMyPatientProfileController;
const createPatientAssessmentController = async (req, res) => {
    const userId = getAuthUserId(req);
    if (!req.validatedPatientAssessment) {
        throw new error_middleware_1.AppError('Invalid assessment payload', 400);
    }
    const assessment = await (0, patient_service_1.createPatientAssessment)(userId, req.validatedPatientAssessment);
    (0, response_1.sendSuccess)(res, assessment, 'Assessment submitted', 201);
};
exports.createPatientAssessmentController = createPatientAssessmentController;
const getMyPatientAssessmentHistoryController = async (req, res) => {
    const userId = getAuthUserId(req);
    if (!req.validatedPatientAssessmentHistoryQuery) {
        throw new error_middleware_1.AppError('Invalid assessment history query', 400);
    }
    const result = await (0, patient_service_1.getMyPatientAssessmentHistory)(userId, req.validatedPatientAssessmentHistoryQuery);
    (0, response_1.sendSuccess)(res, result, 'Assessment history fetched');
};
exports.getMyPatientAssessmentHistoryController = getMyPatientAssessmentHistoryController;
const getMyMoodHistoryController = async (req, res) => {
    const userId = getAuthUserId(req);
    const query = req.validatedPatientMoodHistoryQuery ?? {};
    const moodHistory = await (0, patient_service_1.getMyMoodHistory)(userId, query);
    (0, response_1.sendSuccess)(res, moodHistory, 'Mood history fetched');
};
exports.getMyMoodHistoryController = getMyMoodHistoryController;
const getMyTherapistMatchesController = async (req, res) => {
    const userId = getAuthUserId(req);
    if (!req.validatedTherapistMatchQuery) {
        throw new error_middleware_1.AppError('Invalid therapist match query', 400);
    }
    const matches = await (0, patient_service_1.getMyTherapistMatches)(userId, req.validatedTherapistMatchQuery);
    (0, response_1.sendSuccess)(res, matches, 'Therapist matches fetched');
};
exports.getMyTherapistMatchesController = getMyTherapistMatchesController;
