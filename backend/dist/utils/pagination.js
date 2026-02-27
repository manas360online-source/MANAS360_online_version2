"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginationMeta = exports.normalizePagination = void 0;
const normalizePagination = (query, config = {}) => {
    const defaultPage = config.defaultPage ?? 1;
    const defaultLimit = config.defaultLimit ?? 10;
    const maxLimit = config.maxLimit ?? 50;
    const pageCandidate = Number(query.page);
    const limitCandidate = Number(query.limit);
    const page = Number.isInteger(pageCandidate) && pageCandidate > 0 ? pageCandidate : defaultPage;
    const limit = Number.isInteger(limitCandidate) && limitCandidate > 0
        ? Math.min(limitCandidate, maxLimit)
        : defaultLimit;
    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};
exports.normalizePagination = normalizePagination;
const buildPaginationMeta = (totalItems, pagination) => {
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pagination.limit);
    return {
        page: pagination.page,
        limit: pagination.limit,
        totalItems,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPrevPage: pagination.page > 1 && totalPages > 0,
    };
};
exports.buildPaginationMeta = buildPaginationMeta;
