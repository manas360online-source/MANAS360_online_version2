import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

export const startMongoMemory = async (): Promise<void> => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());
};

export const clearMongoCollections = async (): Promise<void> => {
	const collections = mongoose.connection.collections;
	await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
};

export const stopMongoMemory = async (): Promise<void> => {
	await mongoose.disconnect();

	if (mongoServer) {
		await mongoServer.stop();
		mongoServer = null;
	}
};
