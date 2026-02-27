interface PlaceholderNotificationEvent {
	eventType: string;
	entityType: string;
	entityId: string;
	payload: Record<string, unknown>;
	occurredAt: string;
}

export const publishPlaceholderNotificationEvent = async (
	event: Omit<PlaceholderNotificationEvent, 'occurredAt'>,
): Promise<PlaceholderNotificationEvent> => {
	const envelope: PlaceholderNotificationEvent = {
		...event,
		occurredAt: new Date().toISOString(),
	};

	console.info('[notification-placeholder-event]', JSON.stringify(envelope));

	return envelope;
};
