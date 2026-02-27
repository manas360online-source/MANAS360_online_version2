"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSubscriptions = exports.getMetrics = exports.verifyTherapist = exports.getUserById = exports.listUsers = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const therapist_model_1 = __importDefault(require("../models/therapist.model"));
const therapy_session_model_1 = __importDefault(require("../models/therapy-session.model"));
const wallet_transaction_model_1 = __importDefault(require("../models/wallet-transaction.model"));
const subscription_model_1 = __importDefault(require("../models/subscription.model"));
const error_middleware_1 = require("../middleware/error.middleware");
const pagination_1 = require("../utils/pagination");
/**
 * Projection for safe user data (excludes sensitive fields)
 * Excludes: passwordHash, tokens, verification OTPs, MFA secret, etc.
 */
const safeUserProjection = {
    passwordHash: 0,
    emailVerificationOtpHash: 0,
    emailVerificationOtpExpiresAt: 0,
    phoneVerificationOtpHash: 0,
    phoneVerificationOtpExpiresAt: 0,
    passwordResetOtpHash: 0,
    passwordResetOtpExpiresAt: 0,
    mfaSecret: 0,
    refreshTokens: 0,
};
/**
 * List users with pagination and filtering
 *
 * Query filters:
 * - role: 'patient' | 'therapist' | 'admin' (optional)
 * - status: 'active' | 'deleted' (optional)
 * - page: pagination page (default: 1)
 * - limit: items per page (default: 10, max: 50)
 *
 * Returns paginated list with metadata
 */
const listUsers = async (page, limit, { role, status, } = {}) => {
    // Build filter query
    const filter = {};
    // Apply role filter (case-insensitive)
    if (role) {
        if (!['patient', 'therapist', 'admin'].includes(role.toLowerCase())) {
            throw new error_middleware_1.AppError('Invalid role filter', 400);
        }
        filter.role = role.toLowerCase();
    }
    // Apply status filter
    // "active" = isDeleted: false (default)
    // "deleted" = isDeleted: true
    if (status) {
        if (status.toLowerCase() === 'deleted') {
            filter.isDeleted = true;
        }
        else if (status.toLowerCase() === 'active') {
            filter.isDeleted = false;
        }
        else {
            throw new error_middleware_1.AppError('Invalid status filter', 400);
        }
    }
    else {
        // Default to active users only
        filter.isDeleted = false;
    }
    // Normalize pagination
    const normalized = (0, pagination_1.normalizePagination)({ page, limit }, { defaultPage: 1, defaultLimit: 10, maxLimit: 50 });
    // Execute parallel queries for data and total count
    const [users, totalItems] = await Promise.all([
        user_model_1.default.find(filter, safeUserProjection)
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(normalized.skip)
            .limit(normalized.limit)
            .lean(),
        user_model_1.default.countDocuments(filter),
    ]);
    return {
        data: users,
        meta: (0, pagination_1.buildPaginationMeta)(totalItems, normalized),
    };
};
exports.listUsers = listUsers;
/**
 * Get a single user by ID
 *
 * Returns full user profile with sensitive fields excluded
 * Throws 404 if user not found
 */
const getUserById = async (userId) => {
    const user = await user_model_1.default.findById(userId, safeUserProjection).lean();
    if (!user) {
        throw new error_middleware_1.AppError('User not found', 404);
    }
    return user;
};
exports.getUserById = getUserById;
/**
 * Verify therapist credentials
 *
 * Sets isVerified = true and records verification timestamp + admin user ID
 * Prevents re-verification with 409 Conflict
 * Returns updated therapist profile summary
 */
const verifyTherapist = async (therapistProfileId, adminUserId) => {
    // Validate therapist profile exists
    const therapistProfile = await therapist_model_1.default.findById(therapistProfileId).select('_id displayName isVerified verifiedAt verifiedBy userId');
    if (!therapistProfile) {
        throw new error_middleware_1.AppError('Therapist profile not found', 404);
    }
    // Prevent re-verification
    if (therapistProfile.isVerified === true) {
        throw new error_middleware_1.AppError('Therapist is already verified', 409);
    }
    // Update therapist profile with verification details
    const now = new Date();
    const updatedProfile = await therapist_model_1.default.findByIdAndUpdate(therapistProfileId, {
        $set: {
            isVerified: true,
            verifiedAt: now,
            verifiedBy: adminUserId,
            updatedAt: now,
        },
    }, {
        new: true,
        runValidators: true,
        select: '_id displayName isVerified verifiedAt verifiedBy updatedAt',
    }).lean();
    if (!updatedProfile) {
        throw new error_middleware_1.AppError('Failed to update therapist profile', 500);
    }
    return {
        _id: updatedProfile._id.toString(),
        displayName: updatedProfile.displayName,
        isVerified: updatedProfile.isVerified,
        verifiedAt: updatedProfile.verifiedAt ?? null,
        verifiedBy: updatedProfile.verifiedBy?.toString() ?? null,
        updatedAt: updatedProfile.updatedAt,
    };
};
exports.verifyTherapist = verifyTherapist;
/**
 * Get admin metrics using MongoDB aggregation pipelines
 *
 * Returns comprehensive platform metrics:
 * - totalUsers: Count of all users (active only)
 * - totalTherapists: Count of therapist profiles
 * - verifiedTherapists: Count of verified therapists
 * - completedSessions: Count of completed therapy sessions
 * - totalRevenue: Sum of all wallet transaction amounts (in base currency)
 * - activeSubscriptions: Count of therapists with active status (verified + non-deleted)
 *
 * Performance: Uses lean() queries and efficient aggregation pipelines
 * Leverages indexes on role, isDeleted, isVerified, status fields
 */
const getMetrics = async () => {
    // Execute all aggregations in parallel for maximum efficiency
    const [totalUsersResult, totalTherapistsResult, verifiedTherapistsResult, completedSessionsResult, totalRevenueResult, activeSubscriptionsResult] = await Promise.all([
        // Total active users (non-deleted)
        user_model_1.default.countDocuments({ isDeleted: false }),
        // Total therapist profiles (non-deleted)
        therapist_model_1.default.countDocuments({ deletedAt: null }),
        // Verified therapists (isVerified = true, non-deleted)
        therapist_model_1.default.countDocuments({ isVerified: true, deletedAt: null }),
        // Completed therapy sessions
        therapy_session_model_1.default.countDocuments({ status: 'completed' }),
        // Total revenue - aggregate sum of all wallet transactions
        wallet_transaction_model_1.default.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalAmount: 1,
                },
            },
        ]),
        // Active subscriptions - therapists with complete profiles (verified + active)
        therapist_model_1.default.countDocuments({ isVerified: true, deletedAt: null, currentActivePatients: { $gt: 0 } }),
    ]);
    // Extract revenue from aggregation result (returns array with single object)
    const totalRevenueData = totalRevenueResult;
    const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].totalAmount : 0;
    return {
        totalUsers: totalUsersResult,
        totalTherapists: totalTherapistsResult,
        verifiedTherapists: verifiedTherapistsResult,
        completedSessions: completedSessionsResult,
        totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
        activeSubscriptions: activeSubscriptionsResult,
    };
};
exports.getMetrics = getMetrics;
const listSubscriptions = async (page, limit, { planType, status, } = {}) => {
    // Build filter query
    const filter = {};
    // Apply planType filter
    if (planType) {
        if (!['basic', 'premium', 'pro'].includes(planType.toLowerCase())) {
            throw new error_middleware_1.AppError('Invalid plan type', 400);
        }
        filter.planType = planType.toLowerCase();
    }
    // Apply status filter
    // Default to 'active' if not specified
    if (status) {
        if (!['active', 'expired', 'cancelled', 'paused'].includes(status.toLowerCase())) {
            throw new error_middleware_1.AppError('Invalid subscription status', 400);
        }
        filter.status = status.toLowerCase();
    }
    else {
        // Default to active subscriptions only
        filter.status = 'active';
    }
    // Normalize pagination
    const normalized = (0, pagination_1.normalizePagination)({ page, limit }, { defaultPage: 1, defaultLimit: 10, maxLimit: 50 });
    // Execute parallel queries for data and total count
    const [subscriptions, totalItems] = await Promise.all([
        subscription_model_1.default.find(filter)
            .populate('userId', 'name email phone')
            .select('_id userId planType planName status startDate expiryDate price currency billingCycle autoRenew createdAt')
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(normalized.skip)
            .limit(normalized.limit)
            .lean(),
        subscription_model_1.default.countDocuments(filter),
    ]);
    // Transform response to match expected shape
    const data = subscriptions.map((sub) => ({
        _id: sub._id.toString(),
        user: {
            id: sub.userId._id.toString(),
            name: sub.userId.name,
            email: sub.userId.email,
            phone: sub.userId.phone,
        },
        plan: {
            type: sub.planType,
            name: sub.planName,
        },
        status: sub.status,
        startDate: sub.startDate,
        expiryDate: sub.expiryDate,
        price: sub.price,
        currency: sub.currency,
        billingCycle: sub.billingCycle,
        autoRenew: sub.autoRenew,
        createdAt: sub.createdAt,
    }));
    return {
        data,
        meta: (0, pagination_1.buildPaginationMeta)(totalItems, normalized),
    };
};
exports.listSubscriptions = listSubscriptions;
