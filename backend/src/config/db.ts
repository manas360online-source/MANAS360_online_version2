import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

mongoose.set('strictQuery', true);

export const connectDatabase = async (): Promise<void> => {
	if (isConnected) {
		return;
	}

	await mongoose.connect(env.mongoUri);
	isConnected = true;
};

export const disconnectDatabase = async (): Promise<void> => {
	if (!isConnected) {
		return;
	}

	await mongoose.disconnect();
	isConnected = false;
};

export const getDatabaseStatus = (): { isConnected: boolean } => ({
	isConnected,
});

export const db = mongoose;

export default db;

