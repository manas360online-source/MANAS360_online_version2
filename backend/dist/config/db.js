"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.getDatabaseStatus = exports.disconnectDatabase = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
let isConnected = false;
mongoose_1.default.set('strictQuery', true);
const connectDatabase = async () => {
    if (isConnected) {
        return;
    }
    await mongoose_1.default.connect(env_1.env.mongoUri);
    isConnected = true;
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    if (!isConnected) {
        return;
    }
    await mongoose_1.default.disconnect();
    isConnected = false;
};
exports.disconnectDatabase = disconnectDatabase;
const getDatabaseStatus = () => ({
    isConnected,
});
exports.getDatabaseStatus = getDatabaseStatus;
exports.db = mongoose_1.default;
exports.default = exports.db;
