import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const therapistLeadSchema = new Schema(
	{
		therapistId: {
			type: Schema.Types.ObjectId,
			ref: 'TherapistProfile',
			required: true,
			index: true,
		},
		patientId: {
			type: Schema.Types.ObjectId,
			ref: 'PatientProfile',
			required: true,
			index: true,
		},
		issueType: {
			type: String,
			required: true,
			trim: true,
			maxlength: 120,
		},
		assessmentSeverity: {
			type: String,
			required: true,
			enum: ['minimal', 'mild', 'moderate', 'moderately_severe', 'severe'],
			index: true,
		},
		leadPrice: {
			type: Number,
			required: true,
			min: 0,
			max: 100000,
		},
		status: {
			type: String,
			required: true,
			enum: ['available', 'purchased'],
			default: 'available',
			index: true,
		},
		matchedAt: {
			type: Date,
			required: true,
			default: Date.now,
		},
		purchasedAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

therapistLeadSchema.index({ therapistId: 1, status: 1, matchedAt: -1 });
therapistLeadSchema.index({ therapistId: 1, patientId: 1, issueType: 1 });

export type TherapistLeadDocument = InferSchemaType<typeof therapistLeadSchema> & {
	_id: Types.ObjectId;
};

export const TherapistLeadModel = model('TherapistLead', therapistLeadSchema);

export default TherapistLeadModel;
