import bcrypt from 'bcrypt';
import { prisma } from '../src/config/db';
import { UserProvider, UserRole } from '@prisma/client';

type MockUserSeed = {
	email: string;
	password: string;
	role: UserRole;
	firstName: string;
	lastName: string;
	name: string;
};

const MOCK_USERS: MockUserSeed[] = [
	{
		email: 'admin@manas360.local',
		password: 'Admin@123',
		role: UserRole.ADMIN,
		firstName: 'System',
		lastName: 'Admin',
		name: 'System Admin',
	},
	{
		email: 'mock.patient@manas360.local',
		password: 'Patient@123',
		role: UserRole.PATIENT,
		firstName: 'Mock',
		lastName: 'Patient',
		name: 'Mock Patient',
	},
	{
		email: 'mock.therapist@manas360.local',
		password: 'Therapist@123',
		role: UserRole.THERAPIST,
		firstName: 'Mock',
		lastName: 'Therapist',
		name: 'Mock Therapist',
	},
];

async function run() {
	console.log('Seeding mock users...');

	for (const entry of MOCK_USERS) {
		const passwordHash = await bcrypt.hash(entry.password, 12);
		const user = await prisma.user.upsert({
			where: { email: entry.email },
			update: {
				passwordHash,
				emailVerified: true,
				role: entry.role,
				provider: UserProvider.LOCAL,
				firstName: entry.firstName,
				lastName: entry.lastName,
				name: entry.name,
				isDeleted: false,
				failedLoginAttempts: 0,
				lockUntil: null,
			},
			create: {
				email: entry.email,
				passwordHash,
				emailVerified: true,
				role: entry.role,
				provider: UserProvider.LOCAL,
				firstName: entry.firstName,
				lastName: entry.lastName,
				name: entry.name,
			},
		});

		console.log(
			JSON.stringify(
				{
					ok: true,
					id: user.id,
					email: entry.email,
					password: entry.password,
					role: entry.role,
				},
				null,
				2,
			),
		);
	}

	console.log('Mock users seeded.');
}

run()
	.then(async () => {
		await prisma.$disconnect();
		process.exit(0);
	})
	.catch(async (error) => {
		console.error(error);
		await prisma.$disconnect();
		process.exit(1);
	});
