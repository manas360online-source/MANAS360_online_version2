import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const therapySessionSchema = new Schema(
	{
		bookingReferenceId: { type: String, required: true, unique: true, index: true },
		patientId: { type: Schema.Types.ObjectId, ref: 'PatientProfile', required: true, index: true },
		therapistId: { type: Schema.Types.ObjectId, ref: 'TherapistProfile', required: true, index: true },
		dateTime: { type: Date, required: true, index: true },
		status: {
			type: String,
			enum: ['pending', 'confirmed', 'cancelled', 'completed'],
			default: 'pending',
			index: true,
		},
		note: {
			encryptedContent: { type: String, default: null },
			iv: { type: String, default: null },
			authTag: { type: String, default: null },
			updatedAt: { type: Date, default: null },
			updatedByTherapistId: { type: Schema.Types.ObjectId, ref: 'TherapistProfile', default: null },
		},
		cancelledAt: { type: Date, default: null },
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

therapySessionSchema.index(
	{ therapistId: 1, dateTime: 1 },
	{ unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } } },
);

therapySessionSchema.index(
	{ patientId: 1, dateTime: 1 },
	{ unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } } },
);

therapySessionSchema.index({ patientId: 1, status: 1, dateTime: -1 });

export type TherapySessionDocument = InferSchemaType<typeof therapySessionSchema> & {
	_id: Types.ObjectId;
};

export const TherapySessionModel = model('TherapySession', therapySessionSchema);

export default TherapySessionModel;