import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';

type PublicSignupRole = 'patient' | 'therapist' | 'psychiatrist' | 'coach';

type RegisterFormProps = {
	onSubmit: (payload: { name: string; email: string; password: string; role: PublicSignupRole }) => Promise<void>;
	loading?: boolean;
	error?: string | null;
};

export default function RegisterForm({ onSubmit, loading = false, error = null }: RegisterFormProps) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [role, setRole] = useState<PublicSignupRole>('patient');
	const [localError, setLocalError] = useState<string | null>(null);

	const formError = useMemo(() => localError ?? error, [localError, error]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLocalError(null);

		if (!name.trim() || !email.trim() || !password.trim()) {
			setLocalError('Please fill all required fields');
			return;
		}

		if (password.length < 8) {
			setLocalError('Password must be at least 8 characters');
			return;
		}

		if (password !== confirmPassword) {
			setLocalError('Passwords do not match');
			return;
		}

		await onSubmit({
			name: name.trim(),
			email: email.trim(),
			password,
			role,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4" noValidate>
			<Input
				id="register-name"
				label="Full Name"
				autoComplete="name"
				placeholder="Your full name"
				value={name}
				onChange={(event) => setName(event.target.value)}
				required
			/>
			<Input
				id="register-email"
				label="Email"
				type="email"
				autoComplete="email"
				placeholder="you@example.com"
				value={email}
				onChange={(event) => setEmail(event.target.value)}
				required
			/>
			<Input
				id="register-password"
				label="Password"
				type="password"
				autoComplete="new-password"
				helperText="Use at least 8 characters"
				placeholder="Create a strong password"
				value={password}
				onChange={(event) => setPassword(event.target.value)}
				required
			/>
			<Input
				id="register-confirm-password"
				label="Confirm Password"
				type="password"
				autoComplete="new-password"
				placeholder="Re-enter password"
				value={confirmPassword}
				onChange={(event) => setConfirmPassword(event.target.value)}
				required
			/>

			<div>
				<label htmlFor="register-role" className="mb-2 block text-sm font-medium text-wellness-text">
					Role
				</label>
				<select
					id="register-role"
					value={role}
					onChange={(event) => setRole(event.target.value as PublicSignupRole)}
					className="w-full rounded-2xl border-2 border-calm-sage/30 bg-white px-5 py-3 text-wellness-text transition-smooth focus:border-calm-sage focus:outline-none focus:ring-2 focus:ring-calm-sage/20"
					required
				>
					<option value="patient">Patient</option>
					<option value="therapist">Therapist</option>
					<option value="psychiatrist">Psychiatrist</option>
					<option value="coach">Coach</option>
				</select>
			</div>

			<Button type="submit" fullWidth loading={loading} className="min-h-[48px]">
				{loading ? 'Creating account...' : 'Register'}
			</Button>

			<div className="text-sm text-wellness-muted">
				Already have an account?{' '}
				<Link to="/auth/login" className="text-calm-sage underline underline-offset-2 hover:text-wellness-text">
					Login
				</Link>
			</div>

			{formError && (
				<p id="register-form-error" role="alert" aria-live="polite" className="text-sm text-red-600">
					{formError}
				</p>
			)}
		</form>
	);
}
