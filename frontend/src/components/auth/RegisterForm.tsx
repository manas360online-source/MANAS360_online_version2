import { FormEvent, UIEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

type PublicSignupRole = 'patient' | 'therapist' | 'psychiatrist' | 'coach';

type PlatformPlan = 'free' | 'monthly' | 'quarterly' | 'premium_monthly' | 'premium_annual';
type RegistrationStep = 1 | 2 | 3;

type RegisterFormProps = {
	onSubmit: (payload: { name: string; email: string; password: string; role: PublicSignupRole; selectedPlan?: PlatformPlan; paymentMethod?: string }) => Promise<void>;
	loading?: boolean;
	error?: string | null;
};

const TERMS_ACCEPTED_KEY = 'termsAccepted';

export default function RegisterForm({ onSubmit, loading = false, error = null }: RegisterFormProps) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [role, setRole] = useState<PublicSignupRole>('patient');
	const [selectedPlan, setSelectedPlan] = useState<PlatformPlan>('free');
	const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
	const [step, setStep] = useState<RegistrationStep>(1);
	const [localError, setLocalError] = useState<string | null>(null);
	const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
	const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
	const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
	const [checkboxChecked, setCheckboxChecked] = useState(false);
	const [termsAccepted, setTermsAccepted] = useState(false);
	const [privacyAccepted, setPrivacyAccepted] = useState(false);

	const formError = useMemo(() => localError ?? error, [localError, error]);

	useEffect(() => {
		setTermsAccepted(localStorage.getItem(TERMS_ACCEPTED_KEY) === 'true');
	}, []);

	const validateAccountFields = (): boolean => {
		if (!name.trim() || !email.trim() || !password.trim()) {
			setLocalError('Please fill all required fields');
			return false;
		}

		if (password.length < 8) {
			setLocalError('Password must be at least 8 characters');
			return false;
		}

		if (password !== confirmPassword) {
			setLocalError('Passwords do not match');
			return false;
		}

		return true;
	};

	const submitRegistration = async () => {
		if (!validateAccountFields()) return;
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

	const openTermsModal = () => {
		setHasScrolledToBottom(false);
		setCheckboxChecked(false);
		setIsTermsModalOpen(true);
	};

	const closeTermsModal = () => {
		setIsTermsModalOpen(false);
	};

	const onPdfScroll = (event: UIEvent<HTMLDivElement>) => {
		const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
		if (scrollTop + clientHeight >= scrollHeight - 5) {
			setHasScrolledToBottom(true);
		}
	};

	const acceptTerms = () => {
		setTermsAccepted(true);
		localStorage.setItem(TERMS_ACCEPTED_KEY, 'true');
		setLocalError(null);
		setIsTermsModalOpen(false);
	};

	const openPrivacyModal = () => {
		setIsPrivacyModalOpen(true);
	};

	const closePrivacyModal = () => {
		setIsPrivacyModalOpen(false);
	};

	const ensureTermsAccepted = (): boolean => {
		if (termsAccepted) return true;
		setLocalError('Please accept the Terms & Conditions before registering.');
		openTermsModal();
		return false;
	};

	const ensurePrivacyAccepted = (): boolean => {
		if (privacyAccepted) return true;
		setLocalError('Please accept Privacy Policy before registering.');
		openTermsModal();
		return false;
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLocalError(null);

		if (role !== 'patient') {
			if (!ensureTermsAccepted()) return;
			if (!ensurePrivacyAccepted()) return;
			await submitRegistration();
			return;
		}

		if (step === 1) {
			if (!validateAccountFields()) return;
			setStep(2);
			return;
		}

		if (step === 2) {
			if (!selectedPlan) {
				setLocalError('Please select a platform plan to continue');
				return;
			}
			setStep(3);
			return;
		}

		if (!ensureTermsAccepted()) return;
		if (!ensurePrivacyAccepted()) return;
		await submitRegistration();
	};

	const plans: Array<{
		key: PlatformPlan;
		name: string;
		price: string;
		note?: string;
		badge?: string;
		description: string;
		features: string[];
	}> = [
		{
			key: 'free',
			name: 'Free Tier',
			price: '₹0',
			description: 'Basic self-help for first-time users.',
			features: ['3 tracks/day', 'AI chatbot (basic)'],
		},
		{
			key: 'monthly',
			name: 'Monthly Plan',
			price: '₹99 / month',
			badge: 'Trial users',
			description: 'Full platform access for daily care.',
			features: ['PHQ-9 and GAD-7', 'Therapist discovery', 'Session scheduling'],
		},
		{
			key: 'quarterly',
			name: 'Quarterly (MVP)',
			price: '₹299 / quarter',
			badge: 'Primary B2C',
			description: 'Full access + priority matching.',
			features: ['Priority matching', 'All assessments'],
		},
		{
			key: 'premium_monthly',
			name: 'Premium Monthly',
			price: '₹299 / month',
			description: 'Unlimited streaming and AI tools.',
			features: ['Unlimited Audio', 'AI insights'],
		},
		{
			key: 'premium_annual',
			name: 'Premium Annual',
			price: '₹2,999 / year',
			badge: 'Best Value',
			note: '16% off monthly premium',
			description: 'Everything including premium tools.',
			features: ['All premium features'],
		},
	];

	const trustSignals = [
		'Secure payment',
		'Cancel anytime',
		'HIPAA compliant data protection',
		'Trusted by mental health professionals',
	];

	return (
		<form onSubmit={handleSubmit} className="space-y-4" noValidate>
			{role === 'patient' ? (
				<div className="rounded-2xl border border-calm-sage/20 bg-calm-sage/5 p-3">
					<div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
						<div className={`rounded-lg px-2 py-2 ${step >= 1 ? 'bg-white text-calm-sage' : 'text-wellness-muted'}`}>Create Account</div>
						<div className={`rounded-lg px-2 py-2 ${step >= 2 ? 'bg-white text-calm-sage' : 'text-wellness-muted'}`}>Choose Plan</div>
						<div className={`rounded-lg px-2 py-2 ${step >= 3 ? 'bg-white text-calm-sage' : 'text-wellness-muted'}`}>Payment</div>
					</div>
				</div>
			) : null}

			{(role !== 'patient' || step === 1) && (
				<>
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
							onChange={(event) => {
								const nextRole = event.target.value as PublicSignupRole;
								setRole(nextRole);
								if (nextRole !== 'patient') {
									setStep(1);
								}
							}}
							className="w-full rounded-2xl border-2 border-calm-sage/30 bg-white px-5 py-3 text-wellness-text transition-smooth focus:border-calm-sage focus:outline-none focus:ring-2 focus:ring-calm-sage/20"
							required
						>
							<option value="patient">Patient</option>
							<option value="therapist">Therapist</option>
							<option value="psychiatrist">Psychiatrist</option>
							<option value="coach">Coach</option>
						</select>
					</div>
				</>
			)}

			{role === 'patient' && step === 2 && (
				<div className="space-y-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.1em] text-calm-sage">Step 2</p>
						<h3 className="mt-1 text-xl font-semibold text-wellness-text">Choose Your Platform Access</h3>
						<p className="mt-1 text-sm text-wellness-muted">Platform subscription unlocks core mental wellness tools. Therapy sessions are paid separately.</p>
					</div>

					<div className="grid gap-3 md:max-w-md md:mx-auto">
						{plans.map((plan) => (
							<button
								type="button"
								key={plan.key}
								onClick={() => setSelectedPlan(plan.key)}
								className={`relative rounded-2xl border bg-white p-4 text-left shadow-soft-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-soft-md ${
									selectedPlan === plan.key ? 'border-2 border-calm-sage' : 'border-calm-sage/20'
								}`}
							>
								{plan.badge ? (
									<span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${plan.badge === 'Most Popular' ? 'bg-calm-sage text-white' : 'bg-ink-100 text-ink-700'}`}>
										{plan.badge}
									</span>
								) : null}
								<p className="text-base font-semibold text-wellness-text">{plan.name}</p>
								<p className="mt-1 text-lg font-bold text-calm-sage">{plan.price}</p>
								{plan.note ? <p className="text-xs text-wellness-muted">{plan.note}</p> : null}
								<p className="mt-2 text-sm text-wellness-muted">{plan.description}</p>
								<ul className="mt-2 space-y-1 text-xs text-wellness-text">
									{plan.features.map((feature) => (
										<li key={feature}>• {feature}</li>
									))}
								</ul>
							</button>
						))}
					</div>

					<div className="rounded-xl border border-calm-sage/20 bg-calm-sage/5 p-3 text-xs text-wellness-muted">
						<p className="font-semibold text-wellness-text">Platform subscription unlocks:</p>
						<p className="mt-1">• AI mental health assistant</p>
						<p>• Clinical assessments (PHQ-9, GAD-7)</p>
						<p>• Therapist discovery</p>
						<p>• Session scheduling</p>
						<p>• Mood tracking</p>
						<p className="mt-1">Therapy sessions are paid separately.</p>
					</div>

					<div className="grid gap-2 rounded-xl border border-ink-100 bg-white p-3 text-xs text-wellness-text sm:grid-cols-2">
						{trustSignals.map((item) => (
							<p key={item}>✔ {item}</p>
						))}
					</div>
				</div>
			)}

			{role === 'patient' && step === 3 && (
				<div className="space-y-4 rounded-2xl border border-calm-sage/20 bg-calm-sage/5 p-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.1em] text-calm-sage">Step 3</p>
						<h3 className="mt-1 text-xl font-semibold text-wellness-text">Payment</h3>
					</div>

					<div className="rounded-xl border border-calm-sage/20 bg-white p-3">
						<p className="text-sm font-semibold text-wellness-text">Plan Selected</p>
						<p className="mt-1 text-sm text-wellness-muted">{plans.find((plan) => plan.key === selectedPlan)?.name || 'Selected Plan'}</p>
						<p className="mt-1 text-base font-semibold text-calm-sage">{plans.find((plan) => plan.key === selectedPlan)?.price || ''}</p>
					</div>

					<div>
						<label htmlFor="register-payment-method" className="mb-2 block text-sm font-semibold text-wellness-text">
							Payment Method
						</label>
						<select
							id="register-payment-method"
							value={paymentMethod}
							onChange={(event) => setPaymentMethod(event.target.value)}
							className="w-full rounded-2xl border border-calm-sage/25 bg-white px-4 py-2.5 text-sm text-wellness-text focus:border-calm-sage focus:outline-none"
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

			{role === 'patient' ? (
				<div className="flex items-center justify-between gap-2">
					{step > 1 ? (
						<Button type="button" variant="secondary" onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}>
							Back
						</Button>
					) : <div />}

					<Button type="submit" loading={loading} className="min-h-[48px]">
						{loading
							? 'Processing...'
							: step === 1
								? 'Continue to Plan'
								: step === 2
									? 'Continue to Payment'
									: 'Start Subscription'}
					</Button>
				</div>
			) : (
				<Button type="submit" fullWidth loading={loading} className="min-h-[48px]">
					{loading
						? 'Creating account...'
						: role === 'therapist'
							? 'Register as Therapist'
							: role === 'psychiatrist'
								? 'Register as Psychiatrist'
								: role === 'coach'
									? 'Register as Coach'
									: 'Create Account'}
				</Button>
			)}

			<p className="text-center text-xs text-wellness-muted">
				By continuing, you agree to the{' '}
				<button
					type="button"
					onClick={openTermsModal}
					className="font-medium text-calm-sage underline underline-offset-2 transition-smooth hover:text-wellness-text"
				>
					Terms & Conditions
				</button>
			</p>

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

			<Modal isOpen={isTermsModalOpen} onClose={closeTermsModal} title="Terms & Conditions" size="lg">
				<p className="mb-4 text-sm text-wellness-muted">Please review the document fully before accepting.</p>
				<div
					className="h-[460px] overflow-y-auto rounded-2xl border border-calm-sage/20 bg-white"
					onScroll={onPdfScroll}
				>
					<iframe
  title="MANAS360 Terms of Service"
  src="/legal/terms.html"
  className="h-[500px] w-full"
/>
				</div>

				<p className={`mt-3 text-xs ${hasScrolledToBottom ? 'text-emerald-700' : 'text-wellness-muted'}`}>
					{hasScrolledToBottom
						? 'You have reached the end. You can now accept the Terms & Conditions.'
						: 'Please scroll to the bottom to enable acceptance'}
				</p>

				<label
					className={`mt-3 flex items-start gap-3 rounded-xl border p-3 transition-smooth ${
						hasScrolledToBottom
							? 'border-calm-sage/60 bg-calm-sage/10 ring-1 ring-calm-sage/30'
							: 'border-calm-sage/20 bg-wellness-surface/80 opacity-80'
					}`}
				>
					<input
						type="checkbox"
						disabled={!hasScrolledToBottom}
						checked={checkboxChecked}
						onChange={(event) => setCheckboxChecked(event.target.checked)}
						className="mt-1 h-4 w-4 rounded border-calm-sage text-calm-sage focus:ring-calm-sage disabled:cursor-not-allowed"
					/>
					<span className="text-sm text-wellness-text">I have read and agree to the Terms & Conditions</span>
				</label>

				<label className="mt-2 flex items-start gap-3 rounded-xl border border-calm-sage/20 bg-white p-3 transition-smooth">
					<input
						type="checkbox"
						checked={privacyAccepted}
						onChange={(event) => setPrivacyAccepted(event.target.checked)}
						className="mt-1 h-4 w-4 rounded border-calm-sage text-calm-sage focus:ring-calm-sage"
					/>
					<span className="text-xs text-wellness-text">
						I agree to the{' '}
						<button
							type="button"
							onClick={openPrivacyModal}
							className="font-medium text-calm-sage underline underline-offset-2 hover:text-wellness-text"
						>
							Privacy Policy
						</button>
					</span>
				</label>

				<div className="mt-4 flex justify-end gap-3">
					<Button type="button" variant="secondary" onClick={closeTermsModal}>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={acceptTerms}
						disabled={!checkboxChecked}
						className={checkboxChecked
							? 'bg-none bg-emerald-600 text-white hover:bg-emerald-700'
							: 'bg-none bg-slate-300 text-white hover:bg-slate-300 hover:shadow-none hover:-translate-y-0'}
					>
						Accept & Continue
					</Button>
				</div>
			</Modal>

			<Modal isOpen={isPrivacyModalOpen} onClose={closePrivacyModal} title="Privacy Policy" size="lg">
				<p className="mb-3 text-sm text-wellness-muted">Please review our privacy policy document.</p>
				<div className="h-[460px] overflow-y-auto rounded-2xl border border-calm-sage/20 bg-white">
					<iframe
  title="MANAS360 Privacy Policy"
	src="/legal/policy.html"
  className="h-[500px] w-full"
/>
				</div>
			</Modal>
		</form>
	);
}
