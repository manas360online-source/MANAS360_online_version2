import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';

type PublicSignupRole = 'patient' | 'therapist' | 'psychiatrist' | 'coach';

type PlatformPlan = 'basic' | 'standard' | 'premium';

type RegisterFormProps = {
	onSubmit: (payload: { name: string; email: string; password: string; role: PublicSignupRole; selectedPlan?: PlatformPlan; paymentMethod?: string }) => Promise<void>;
	loading?: boolean;
	error?: string | null;
};

export default function RegisterForm({ onSubmit, loading = false, error = null }: RegisterFormProps) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [role, setRole] = useState<PublicSignupRole>('patient');
	const [selectedPlan, setSelectedPlan] = useState<PlatformPlan>('standard');
	const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
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

		if (role === 'patient' && !selectedPlan) {
			setLocalError('Please select a platform plan to continue');
			return;
		}

		await onSubmit({
			name: name.trim(),
			email: email.trim(),
			password,
			role,
			selectedPlan: role === 'patient' ? selectedPlan : undefined,
			paymentMethod: role === 'patient' ? paymentMethod : undefined,
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

			{role === 'patient' && (
				<div className="space-y-3 rounded-2xl border border-calm-sage/20 bg-calm-sage/5 p-4">
					<p className="text-xs font-semibold uppercase tracking-[0.1em] text-calm-sage">Choose Your Platform Access</p>
					<div className="grid gap-2 sm:grid-cols-3">
						{[
							{ key: 'basic', name: 'Basic Plan', price: '₹99 / month', points: 'Limited AI + assessments' },
							{ key: 'standard', name: 'Standard Plan', price: '₹199 / month', points: 'Full platform access' },
							{ key: 'premium', name: 'Premium Plan', price: '₹399 / month', points: 'Unlimited AI + priority matching' },
						].map((plan) => (
							<button
								type="button"
								key={plan.key}
								onClick={() => setSelectedPlan(plan.key as PlatformPlan)}
								className={`rounded-xl border p-3 text-left transition ${selectedPlan === plan.key ? 'border-calm-sage bg-white shadow-soft-sm' : 'border-calm-sage/20 bg-white/70 hover:border-calm-sage/40'}`}
							>
								<p className="text-sm font-semibold text-wellness-text">{plan.name}</p>
								<p className="mt-1 text-xs font-medium text-calm-sage">{plan.price}</p>
								<p className="mt-1 text-xs text-wellness-muted">{plan.points}</p>
							</button>
						))}
					</div>
					<p className="text-xs text-wellness-muted">This payment activates platform access. Therapy session fees are paid separately before each session.</p>

					<div>
						<label htmlFor="register-payment-method" className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-wellness-muted">
							Preferred Payment Method
						</label>
						<select
							id="register-payment-method"
							value={paymentMethod}
							onChange={(event) => setPaymentMethod(event.target.value)}
							className="w-full rounded-2xl border border-calm-sage/25 bg-white px-4 py-2 text-sm text-wellness-text focus:border-calm-sage focus:outline-none"
						>
							<option>UPI</option>
							<option>Credit Card</option>
							<option>Debit Card</option>
							<option>Net Banking</option>
							<option>Wallet</option>
						</select>
					</div>
				</div>
			)}

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
