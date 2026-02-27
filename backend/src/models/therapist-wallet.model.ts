import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const therapistWalletSchema = new Schema(
	{
		therapistId: {
			type: Schema.Types.ObjectId,
			ref: 'TherapistProfile',
			required: true,
			unique: true,
			index: true,
		},
		currency: {
			type: String,
			required: true,
			default: 'INR',
			enum: ['INR'],
		},
		balance: {
			type: Number,
			required: true,
			default: 0,
			min: 0,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

export type TherapistWalletDocument = InferSchemaType<typeof therapistWalletSchema> & {
	_id: Types.ObjectId;
};

export const TherapistWalletModel = model('TherapistWallet', therapistWalletSchema);

export default TherapistWalletModel;
