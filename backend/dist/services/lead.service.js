"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseMyTherapistLead = exports.getMyTherapistLeads = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const user_model_1 = __importDefault(require("../models/user.model"));
const therapist_model_1 = __importDefault(require("../models/therapist.model"));
const patient_model_1 = __importDefault(require("../models/patient.model"));
const lead_model_1 = __importDefault(require("../models/lead.model"));
const pagination_1 = require("../utils/pagination");
const mongoose_1 = __importDefault(require("mongoose"));
const therapist_wallet_model_1 = __importDefault(require("../models/therapist-wallet.model"));
const wallet_transaction_model_1 = __importDefault(require("../models/wallet-transaction.model"));
const crypto_1 = require("crypto");
const assertTherapistUser = async (userId) => {
    const user = await user_model_1.default.findById(userId).select('_id role isDeleted').lean();
    if (!user) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    if (user.isDeleted) {
        throw new error_middleware_1.AppError('User account is deleted', 410);
    }
    if (user.role !== 'therapist') {
        throw new error_middleware_1.AppError('Therapist role required', 403);
    }
};
const getMyTherapistLeads = async (userId, query) => {
    await assertTherapistUser(userId);
    const therapistProfile = await therapist_model_1.default.findOne({ userId }).select('_id').lean();
    if (!therapistProfile) {
        throw new error_middleware_1.AppError('Therapist profile not found. Please create profile first.', 404);
    }
    const pagination = (0, pagination_1.normalizePagination)({ page: query.page, limit: query.limit }, { defaultPage: 1, defaultLimit: 10, maxLimit: 50 });
    const filter = {
        therapistId: therapistProfile._id,
    };
    if (query.status) {
        filter.status = query.status;
    }
    const [totalItems, leads] = await Promise.all([
        lead_model_1.default.countDocuments(filter),
        lead_model_1.default.find(filter)
            .select({
            patientId: 1,
            issueType: 1,
            assessmentSeverity: 1,
            leadPrice: 1,
            status: 1,
            matchedAt: 1,
            purchasedAt: 1,
        })
            .sort({ matchedAt: -1 })
            .skip(pagination.skip)
            .limit(pagination.limit)
            .lean(),
    ]);
    const patientIds = [...new Set(leads.map((lead) => String(lead.patientId)))];
    const patientProfiles = await patient_model_1.default.find({
        _id: { $in: patientIds },
    })
        .select({ _id: 1, age: 1, gender: 1 })
        .lean();
    const patientMap = new Map(patientProfiles.map((profile) => [String(profile._id), profile]));
    const items = leads.map((lead) => {
        const patientProfile = patientMap.get(String(lead.patientId));
        return {
            leadId: String(lead._id),
            patientSummary: {
                patientId: String(lead.patientId),
                age: patientProfile?.age ?? null,
                gender: patientProfile?.gender ?? null,
            },
            issueType: lead.issueType,
            assessmentSeverity: lead.assessmentSeverity,
            leadPrice: lead.leadPrice,
            leadStatus: lead.status,
            matchedAt: lead.matchedAt,
            purchasedAt: lead.purchasedAt,
        };
    });
    return {
        items,
        meta: (0, pagination_1.buildPaginationMeta)(totalItems, pagination),
    };
};
exports.getMyTherapistLeads = getMyTherapistLeads;
const purchaseMyTherapistLead = async (userId, leadId) => {
    await assertTherapistUser(userId);
    const therapistProfile = await therapist_model_1.default.findOne({ userId }).select('_id').lean();
    if (!therapistProfile) {
        throw new error_middleware_1.AppError('Therapist profile not found. Please create profile first.', 404);
    }
    const session = await mongoose_1.default.startSession();
    try {
        let result = null;
        await session.withTransaction(async () => {
            const lead = await lead_model_1.default.findOne({ _id: leadId, therapistId: therapistProfile._id })
                .select({ _id: 1, status: 1, leadPrice: 1 })
                .session(session)
                .lean();
            if (!lead) {
                throw new error_middleware_1.AppError('Lead not found', 404);
            }
            if (lead.status !== 'available') {
                throw new error_middleware_1.AppError('Lead is not available for purchase', 409, {
                    conflictType: 'lead_not_available',
                });
            }
            const wallet = await therapist_wallet_model_1.default.findOne({ therapistId: therapistProfile._id })
                .select({ _id: 1, balance: 1, currency: 1 })
                .session(session)
                .lean();
            if (!wallet) {
                throw new error_middleware_1.AppError('Therapist wallet not found', 404);
            }
            if (wallet.balance < lead.leadPrice) {
                throw new error_middleware_1.AppError('Insufficient wallet balance', 409, {
                    conflictType: 'insufficient_balance',
                });
            }
            const walletUpdate = await therapist_wallet_model_1.default.updateOne({
                _id: wallet._id,
                balance: { $gte: lead.leadPrice },
            }, {
                $inc: { balance: -lead.leadPrice },
            }, { session });
            if (walletUpdate.modifiedCount !== 1) {
                throw new error_middleware_1.AppError('Insufficient wallet balance', 409, {
                    conflictType: 'insufficient_balance',
                });
            }
            const purchasedAt = new Date();
            const leadUpdate = await lead_model_1.default.updateOne({
                _id: lead._id,
                status: 'available',
            }, {
                $set: {
                    status: 'purchased',
                    purchasedAt,
                },
            }, { session });
            if (leadUpdate.modifiedCount !== 1) {
                throw new error_middleware_1.AppError('Lead is not available for purchase', 409, {
                    conflictType: 'lead_not_available',
                });
            }
            const transactionReferenceId = `LTX-${Date.now()}-${(0, crypto_1.randomUUID)().slice(0, 8).toUpperCase()}`;
            const [transaction] = await wallet_transaction_model_1.default.create([
                {
                    walletId: wallet._id,
                    therapistId: therapistProfile._id,
                    leadId: lead._id,
                    type: 'lead_purchase',
                    amount: lead.leadPrice,
                    currency: wallet.currency,
                    status: 'success',
                    referenceId: transactionReferenceId,
                    description: 'Lead purchase debit',
                },
            ], { session });
            const updatedWallet = await therapist_wallet_model_1.default.findById(wallet._id)
                .select({ balance: 1 })
                .session(session)
                .lean();
            result = {
                leadId: String(lead._id),
                leadStatus: 'purchased',
                leadPrice: lead.leadPrice,
                walletBalanceAfter: updatedWallet?.balance ?? Math.max(0, wallet.balance - lead.leadPrice),
                transactionId: String(transaction._id),
                transactionReferenceId,
                purchasedAt,
            };
        });
        if (!result) {
            throw new error_middleware_1.AppError('Unable to purchase lead', 500);
        }
        return result;
    }
    finally {
        await session.endSession();
    }
};
exports.purchaseMyTherapistLead = purchaseMyTherapistLead;
