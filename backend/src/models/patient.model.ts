import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

const emergencyContactSchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		relation: { type: String, required: true, trim: true },
		phone: { type: String, required: true, trim: true },
	},
	{ _id: false },
);

const patientProfileSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			unique: true,
			index: true,
		},
		age: { type: Number, required: true, min: 1, max: 120 },
		gender: { type: String, required: true, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
		medicalHistory: { type: String, default: null, trim: true, maxlength: 2000 },
		emergencyContact: { type: emergencyContactSchema, required: true },
		isDeleted: { type: Boolean, default: false, index: true },
		deletedAt: { type: Date, default: null },
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

const patientAssessmentSchema = new Schema(
	{
		patientId: {
			type: Schema.Types.ObjectId,
			ref: 'PatientProfile',
			required: true,
			index: true,
		},
		type: {
			type: String,
			required: true,
			enum: ['PHQ-9', 'GAD-7'],
		},
		answers: {
			type: [Number],
			required: true,
			validate: {
				validator: (values: number[]) => values.every((value) => Number.isInteger(value) && value >= 0 && value <= 3),
				message: 'answers must contain integer values between 0 and 3',
			},
		},
		totalScore: { type: Number, required: true, min: 0 },
		severityLevel: { type: String, required: true },
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

const patientMoodEntrySchema = new Schema(
	{
		patientId: {
			type: Schema.Types.ObjectId,
			ref: 'PatientProfile',
			required: true,
			index: true,
		},
		moodScore: { type: Number, required: true, min: 1, max: 10 },
		note: { type: String, default: null, trim: true, maxlength: 1000 },
		date: { type: Date, required: true, index: true },
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

patientMoodEntrySchema.index({ patientId: 1, date: -1 });

patientAssessmentSchema.index({ patientId: 1, createdAt: -1 });

const applyNotDeletedFilter = function (this: {
	getFilter: () => Record<string, unknown>;
	setQuery: (query: Record<string, unknown>) => void;
	getOptions: () => Record<string, unknown>;
}): void {
	const options = this.getOptions();
	if (options.withDeleted === true) {
		return;
	}

	const filter = this.getFilter();
	if (Object.prototype.hasOwnProperty.call(filter, 'isDeleted')) {
		return;
	}

	this.setQuery({
		...filter,
		isDeleted: false,
	});
};

patientProfileSchema.pre('find', applyNotDeletedFilter);
patientProfileSchema.pre('findOne', applyNotDeletedFilter);
patientProfileSchema.pre('findOneAndUpdate', applyNotDeletedFilter);
patientProfileSchema.pre('countDocuments', applyNotDeletedFilter);

export type PatientProfileDocument = InferSchemaType<typeof patientProfileSchema> & {
	_id: Types.ObjectId;
};

export type PatientAssessmentDocument = InferSchemaType<typeof patientAssessmentSchema> & {
	_id: Types.ObjectId;
};

export type PatientMoodEntryDocument = InferSchemaType<typeof patientMoodEntrySchema> & {
	_id: Types.ObjectId;
};

export const PatientProfileModel = model('PatientProfile', patientProfileSchema);
export const PatientAssessmentModel = model('PatientAssessment', patientAssessmentSchema);
export const PatientMoodEntryModel = model('PatientMoodEntry', patientMoodEntrySchema);

export default PatientProfileModel;
