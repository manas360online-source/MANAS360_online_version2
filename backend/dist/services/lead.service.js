"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseMyTherapistLead = exports.getMyTherapistLeads = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const db_1 = require("../config/db");
const pagination_1 = require("../utils/pagination");
const db = db_1.prisma;
const assertTherapistUser = async (userId) => {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    if (String(user.role) !== 'THERAPIST') {
        throw new error_middleware_1.AppError('Therapist role required', 403);
    }
};
const getMyTherapistLeads = async (userId, query) => {
    await assertTherapistUser(userId);
    const pagination = (0, pagination_1.normalizePagination)({ page: query.page, limit: query.limit }, { defaultPage: 1, defaultLimit: 10, maxLimit: 50 });
    return {
        items: [],
        meta: (0, pagination_1.buildPaginationMeta)(0, pagination),
        migrationPending: true,
        message: 'Lead marketplace is temporarily unavailable until Prisma lead models are introduced.',
    };
};
exports.getMyTherapistLeads = getMyTherapistLeads;
const purchaseMyTherapistLead = async (userId, leadId) => {
    await assertTherapistUser(userId);
    throw new error_middleware_1.AppError('Lead purchase is unavailable until lead marketplace is migrated to Prisma', 501, {
        leadId,
    });
};
exports.purchaseMyTherapistLead = purchaseMyTherapistLead;
