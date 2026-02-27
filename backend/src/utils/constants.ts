export const ALLOWED_PROFILE_UPDATE_FIELDS = ['name', 'phone'] as const;

export const FORBIDDEN_PROFILE_UPDATE_FIELDS = ['role', 'email', 'password', 'passwordHash'] as const;

export type AllowedProfileField = (typeof ALLOWED_PROFILE_UPDATE_FIELDS)[number];

export interface ProfileUpdatePayload {
	name?: string;
	phone?: string;
}

export interface ChangePasswordPayload {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

export const filterProfileUpdatePayload = (
	rawPayload: Record<string, unknown>,
): {
	filtered: ProfileUpdatePayload;
	forbiddenFields: string[];
	ignoredFields: string[];
} => {
	const allowedFields = new Set<string>(ALLOWED_PROFILE_UPDATE_FIELDS);
	const forbiddenFieldsSet = new Set<string>(FORBIDDEN_PROFILE_UPDATE_FIELDS);

	const filtered: ProfileUpdatePayload = {};
	const forbiddenFields: string[] = [];
	const ignoredFields: string[] = [];

	for (const [key, value] of Object.entries(rawPayload)) {
		if (forbiddenFieldsSet.has(key)) {
			forbiddenFields.push(key);
			continue;
		}

		if (allowedFields.has(key)) {
			if (typeof value === 'string') {
				filtered[key as AllowedProfileField] = value;
			}
			continue;
		}

		ignoredFields.push(key);
	}

	return {
		filtered,
		forbiddenFields,
		ignoredFields,
	};
};

