import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const therapistDocumentSchema = new Schema(
	{
		therapistId: {
			type: Schema.Types.ObjectId,
			ref: 'TherapistProfile',
			required: true,
			index: true,
		},
		fileUrl: { type: String, required: true, trim: true },
		objectKey: { type: String, required: true, trim: true, index: true },
		type: {
			type: String,
			required: true,
			enum: ['license', 'degree', 'certificate'],
			index: true,
		},
		mimeType: { type: String, required: true, trim: true },
		sizeBytes: { type: Number, required: true, min: 1 },
		uploadedAt: { type: Date, required: true, default: Date.now },
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

therapistDocumentSchema.index({ therapistId: 1, type: 1, uploadedAt: -1 });

export type TherapistDocumentDocument = InferSchemaType<typeof therapistDocumentSchema> & {
	_id: Types.ObjectId;
};

export const TherapistDocumentModel = model('TherapistDocument', therapistDocumentSchema);

export default TherapistDocumentModel;