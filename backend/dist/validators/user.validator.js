"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChangePasswordPayload = exports.validateProfileUpdatePayload = void 0;
const error_middleware_1 = require("../middleware/error.middleware");
const phoneRegex = /^\+?[1-9]\d{9,14}$/;
const validateName = (value) => {
    const trimmedName = value.trim();
    if (!trimmedName) {
        throw new error_middleware_1.AppError('name cannot be empty', 400);
    }
    if (trimmedName.length > 120) {
        throw new error_middleware_1.AppError('name exceeds maximum length', 400);
    }
    return trimmedName;
};
const validatePhone = (value) => {
    const trimmedPhone = value.trim();
    if (!trimmedPhone) {
        throw new error_middleware_1.AppError('phone cannot be empty', 400);
    }
    if (!phoneRegex.test(trimmedPhone)) {
        throw new error_middleware_1.AppError('Invalid phone format', 400);
    }
    return trimmedPhone;
};
const validateProfileUpdatePayload = (payload) => {
    const validated = {};
    if (payload.name !== undefined) {
        validated.name = validateName(payload.name);
    }
    if (payload.phone !== undefined) {
        validated.phone = validatePhone(payload.phone);
    }
    return validated;
};
exports.validateProfileUpdatePayload = validateProfileUpdatePayload;
const passwordComplexityRegex = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const validateRequiredPasswordField = (value, fieldName) => {
    if (typeof value !== 'string') {
        throw new error_middleware_1.AppError(`${fieldName} is required`, 400);
    }
    const trimmed = value.trim();
    if (!trimmed) {
        throw new error_middleware_1.AppError(`${fieldName} is required`, 400);
    }
    return trimmed;
};
const validateChangePasswordPayload = (payload) => {
    const currentPassword = validateRequiredPasswordField(payload.currentPassword, 'currentPassword');
    const newPassword = validateRequiredPasswordField(payload.newPassword, 'newPassword');
    const confirmPassword = validateRequiredPasswordField(payload.confirmPassword, 'confirmPassword');
    if (!passwordComplexityRegex.test(newPassword)) {
        throw new error_middleware_1.AppError('newPassword must be at least 8 characters and include at least one number and one special character', 400);
    }
    if (newPassword !== confirmPassword) {
        throw new error_middleware_1.AppError('confirmPassword must match newPassword', 400);
    }
    return {
        currentPassword,
        newPassword,
        confirmPassword,
    };
};
exports.validateChangePasswordPayload = validateChangePasswordPayload;
