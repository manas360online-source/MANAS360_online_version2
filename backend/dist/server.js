"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const startServer = async () => {
    await (0, db_1.connectDatabase)();
    const server = app_1.default.listen(env_1.env.port, () => {
        console.log(`Server running on port ${env_1.env.port}`);
    });
    const shutdown = async (signal) => {
        console.log(`${signal} received. Shutting down gracefully...`);
        server.close(async () => {
            await (0, db_1.disconnectDatabase)();
            process.exit(0);
        });
    };
    process.on('SIGINT', () => {
        void shutdown('SIGINT');
    });
    process.on('SIGTERM', () => {
        void shutdown('SIGTERM');
    });
    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled Rejection:', reason);
    });
    process.on('uncaughtException', async (error) => {
        console.error('Uncaught Exception:', error);
        await (0, db_1.disconnectDatabase)();
        process.exit(1);
    });
};
void startServer();
