"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishPlaceholderNotificationEvent = void 0;
const publishPlaceholderNotificationEvent = async (event) => {
    const envelope = {
        ...event,
        occurredAt: new Date().toISOString(),
    };
    console.info('[notification-placeholder-event]', JSON.stringify(envelope));
    return envelope;
};
exports.publishPlaceholderNotificationEvent = publishPlaceholderNotificationEvent;
