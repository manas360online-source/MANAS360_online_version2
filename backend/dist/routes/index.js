"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const patient_routes_1 = __importDefault(require("./patient.routes"));
const therapist_routes_1 = __importDefault(require("./therapist.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    res.status(200).json({
        ok: true,
        service: 'manas360-backend',
        timestamp: new Date().toISOString(),
    });
});
router.use('/auth', auth_routes_1.default);
router.use('/v1/users', user_routes_1.default);
router.use('/v1/patients', patient_routes_1.default);
router.use('/v1/therapists', therapist_routes_1.default);
router.use('/v1/admin', admin_routes_1.default);
exports.default = router;
