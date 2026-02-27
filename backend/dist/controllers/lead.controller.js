"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseMyTherapistLeadController = exports.getMyTherapistLeadsController = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const response_1 = require("../utils/response");
const lead_service_1 = require("../services/lead.service");
const getAuthUserId = (req) => {
    const userId = req.auth?.userId;
    if (!userId) {
        throw new error_middleware_1.AppError('Authentication required', 401);
    }
    return userId;
};
const getMyTherapistLeadsController = async (req, res) => {
    const userId = getAuthUserId(req);
    const query = req.validatedTherapistLeadsQuery ?? { page: 1, limit: 10 };
    const leads = await (0, lead_service_1.getMyTherapistLeads)(userId, query);
    (0, response_1.sendSuccess)(res, leads, 'Therapist leads fetched');
};
exports.getMyTherapistLeadsController = getMyTherapistLeadsController;
const purchaseMyTherapistLeadController = async (req, res) => {
    const userId = getAuthUserId(req);
    const leadId = String(req.params.id);
    const result = await (0, lead_service_1.purchaseMyTherapistLead)(userId, leadId);
    (0, response_1.sendSuccess)(res, result, 'Lead purchased successfully');
};
exports.purchaseMyTherapistLeadController = purchaseMyTherapistLeadController;
