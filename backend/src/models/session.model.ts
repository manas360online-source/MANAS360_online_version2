import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const sessionSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		jti: { type: String, required: true, unique: true, index: true },
		refreshTokenHash: { type: String, required: true },
		ipAddress: { type: String, default: null },
		userAgent: { type: String, default: null },
		device: { type: String, default: null },
		revokedAt: { type: Date, default: null },
		expiresAt: { type: Date, required: true, index: true },
		lastActiveAt: { type: Date, default: Date.now },
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

sessionSchema.index({ userId: 1, revokedAt: 1 });

export type SessionDocument = InferSchemaType<typeof sessionSchema> & {
	_id: Types.ObjectId;
};

export const SessionModel = model('Session', sessionSchema);

export default SessionModel;
