import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const walletTransactionSchema = new Schema(
	{
		walletId: {
			type: Schema.Types.ObjectId,
			ref: 'TherapistWallet',
			required: true,
			index: true,
		},
		therapistId: {
			type: Schema.Types.ObjectId,
			ref: 'TherapistProfile',
			required: true,
			index: true,
		},
		leadId: {
			type: Schema.Types.ObjectId,
			ref: 'TherapistLead',
			required: true,
			index: true,
		},
		type: {
			type: String,
			required: true,
			enum: ['lead_purchase'],
			default: 'lead_purchase',
		},
		amount: {
			type: Number,
			required: true,
			min: 0,
		},
		currency: {
			type: String,
			required: true,
			default: 'INR',
			enum: ['INR'],
		},
		status: {
			type: String,
			required: true,
			enum: ['success'],
			default: 'success',
		},
		referenceId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		description: {
			type: String,
			default: null,
			trim: true,
			maxlength: 500,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

walletTransactionSchema.index({ therapistId: 1, createdAt: -1 });

export type WalletTransactionDocument = InferSchemaType<typeof walletTransactionSchema> & {
	_id: Types.ObjectId;
};

export const WalletTransactionModel = model('WalletTransaction', walletTransactionSchema);

export default WalletTransactionModel;
