"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyTherapistEarningsController = exports.postMyTherapistSessionNoteController = exports.patchMyTherapistSessionController = exports.getMyTherapistSessionsController = exports.getMySessionHistoryController = exports.bookMySessionController = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const response_1 = require("../utils/response");
const session_service_1 = require("../services/session.service");
const getAuthUserId = (req) => {
    const userId = req.auth?.userId;
    if (!userId) {
        throw new error_middleware_1.AppError('Authentication required', 401);
    }
    return userId;
};
const bookMySessionController = async (req, res) => {
    const userId = getAuthUserId(req);
    if (!req.validatedBookSessionPayload) {
        throw new error_middleware_1.AppError('Invalid booking payload', 400);
    }
    const session = await (0, session_service_1.bookPatientSession)(userId, req.validatedBookSessionPayload);
    (0, response_1.sendSuccess)(res, session, 'Session booked successfully', 201);
};
exports.bookMySessionController = bookMySessionController;
const getMySessionHistoryController = async (req, res) => {
    const userId = getAuthUserId(req);
    const query = req.validatedPatientSessionHistoryQuery ?? { page: 1, limit: 10 };
    const history = await (0, session_service_1.getMySessionHistory)(userId, query);
    (0, response_1.sendSuccess)(res, history, 'Session history fetched');
};
exports.getMySessionHistoryController = getMySessionHistoryController;
const getMyTherapistSessionsController = async (req, res) => {
    const userId = getAuthUserId(req);
    const query = req.validatedTherapistSessionHistoryQuery ?? { page: 1, limit: 10 };
    const sessions = await (0, session_service_1.getMyTherapistSessions)(userId, query);
    (0, response_1.sendSuccess)(res, sessions, 'Therapist sessions fetched');
};
exports.getMyTherapistSessionsController = getMyTherapistSessionsController;
const patchMyTherapistSessionController = async (req, res) => {
    const userId = getAuthUserId(req);
    if (!req.validatedTherapistSessionStatusPayload) {
        throw new error_middleware_1.AppError('Invalid session status payload', 400);
    }
    const updatedSession = await (0, session_service_1.updateMyTherapistSessionStatus)(userId, String(req.params.id), req.validatedTherapistSessionStatusPayload);
    (0, response_1.sendSuccess)(res, updatedSession, 'Therapist session updated');
};
exports.patchMyTherapistSessionController = patchMyTherapistSessionController;
const postMyTherapistSessionNoteController = async (req, res) => {
    const userId = getAuthUserId(req);
    if (!req.validatedTherapistSessionNotePayload) {
        throw new error_middleware_1.AppError('Invalid session note payload', 400);
    }
    const result = await (0, session_service_1.saveMyTherapistSessionNote)(userId, String(req.params.id), req.validatedTherapistSessionNotePayload);
    (0, response_1.sendSuccess)(res, result, 'Session note saved');
};
exports.postMyTherapistSessionNoteController = postMyTherapistSessionNoteController;
const getMyTherapistEarningsController = async (req, res) => {
    const userId = getAuthUserId(req);
    const query = req.validatedTherapistEarningsQuery ?? { page: 1, limit: 10 };
    const earnings = await (0, session_service_1.getMyTherapistEarnings)(userId, query);
    (0, response_1.sendSuccess)(res, earnings, 'Therapist earnings fetched');
};
exports.getMyTherapistEarningsController = getMyTherapistEarningsController;
