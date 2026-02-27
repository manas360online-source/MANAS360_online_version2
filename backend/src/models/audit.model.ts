import { Schema, model, type InferSchemaType } from 'mongoose';

const auditSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
		event: {
			type: String,
			enum: [
				'LOGIN_SUCCESS',
				'LOGIN_FAILED',
				'LOCKOUT_TRIGGERED',
				'REGISTER_SUCCESS',
				'PASSWORD_RESET_REQUESTED',
				'PASSWORD_RESET_SUCCESS',
				'TOKEN_REFRESHED',
				'LOGOUT',
			],
			required: true,
		},
		status: { type: String, enum: ['success', 'failure'], required: true },
		email: { type: String, default: null },
		phone: { type: String, default: null },
		ipAddress: { type: String, default: null },
		userAgent: { type: String, default: null },
		metadata: { type: Schema.Types.Mixed, default: null },
	},
	{
		timestamps: { createdAt: true, updatedAt: false },
		versionKey: false,
	},
);

export type AuditDocument = InferSchemaType<typeof auditSchema>;

export const AuditModel = model('Audit', auditSchema);

export default AuditModel;
