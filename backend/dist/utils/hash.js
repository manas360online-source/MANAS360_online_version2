"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNumericOtp = exports.hashOpaqueToken = exports.verifyOtp = exports.hashOtp = exports.verifyPassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = require("crypto");
const SALT_ROUNDS = 12;
const hashPassword = async (plainText) => {
    return bcrypt_1.default.hash(plainText, SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
const verifyPassword = async (plainText, hash) => {
    return bcrypt_1.default.compare(plainText, hash);
};
exports.verifyPassword = verifyPassword;
const hashOtp = async (otp) => {
    return bcrypt_1.default.hash(otp, SALT_ROUNDS);
};
exports.hashOtp = hashOtp;
const verifyOtp = async (otp, otpHash) => {
    return bcrypt_1.default.compare(otp, otpHash);
};
exports.verifyOtp = verifyOtp;
const hashOpaqueToken = (value) => {
    return (0, crypto_1.createHash)('sha256').update(value).digest('hex');
};
exports.hashOpaqueToken = hashOpaqueToken;
const generateNumericOtp = (length = 6) => {
    const max = 10 ** length;
    const value = (0, crypto_1.randomInt)(0, max);
    return value.toString().padStart(length, '0');
};
exports.generateNumericOtp = generateNumericOtp;
