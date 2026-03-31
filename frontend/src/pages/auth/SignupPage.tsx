import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getApiErrorMessage, signupWithPhone, verifyPhoneSignupOtp } from '../../api/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth, getPostLoginRoute } from '../../context/AuthContext';

export default function SignupPage() {
	const { checkAuth } = useAuth();
	const navigate = useNavigate();

	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [role, setRole] = useState<'patient' | 'therapist' | 'psychiatrist' | 'coach'>('patient');
	const [otp, setOtp] = useState('');
	const [otpSent, setOtpSent] = useState(false);
	const [devOtp, setDevOtp] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [aadhaar, setAadhaar] = useState('');
	const [otpForAadhaar, setOtpForAadhaar] = useState('');
	const [isOTPVerified, setIsOTPVerified] = useState(false);
	const [isICAccepted, setIsICAccepted] = useState(false);
	const [isNDAAccepted, setIsNDAAccepted] = useState(false);
	const [isDPAccepted, setIsDPAccepted] = useState(false);
	const [isAadhaarOtpSent, setIsAadhaarOtpSent] = useState(false);
	const [isAadhaarOtpLoading, setIsAadhaarOtpLoading] = useState(false);
	const [maskedAadhaar, setMaskedAadhaar] = useState('');
	const [generatedOTP, setGeneratedOTP] = useState('');

	const isTherapistFlow = role === 'therapist';

	useEffect(() => {
		if (!isTherapistFlow) {
			setAadhaar('');
			setOtpForAadhaar('');
			setIsOTPVerified(false);
			setIsICAccepted(false);
			setIsNDAAccepted(false);
			setIsDPAccepted(false);
			setIsAadhaarOtpSent(false);
			setIsAadhaarOtpLoading(false);
			setMaskedAadhaar('');
			setGeneratedOTP('');
		}
	}, [isTherapistFlow]);

	const maskAadhaar = (value: string): string => {
		const digits = value.replace(/\D/g, '').slice(0, 12);
		if (digits.length < 4) return '**** **** ****';
		return `**** **** ${digits.slice(-4)}`;
	};

	const sendOTP = () => {
		if (!isTherapistFlow) return;
		const digits = aadhaar.replace(/\D/g, '').slice(0, 12);
		if (digits.length !== 12) {
			setError('Please enter a valid 12-digit Aadhaar number.');
			return;
		}

		setError(null);
		const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
		setGeneratedOTP(mockOtp);
		setIsOTPVerified(false);
		setIsICAccepted(false);
		setIsNDAAccepted(false);
		setIsDPAccepted(false);
		setIsAadhaarOtpSent(true);
		// TODO: Replace with real Aadhaar KYC API integration
		console.log('Mock OTP:', mockOtp);
		alert('OTP sent successfully (check console)');
	};

	const verifyOTP = () => {
		if (!isTherapistFlow) return;
		if (!isAadhaarOtpSent) {
			setError('Please send OTP first.');
			return;
		}
		const enteredOtp = otpForAadhaar.replace(/\D/g, '').slice(0, 6);
		if (enteredOtp.length !== 6) {
			setError('Please enter a valid 6-digit OTP.');
			return;
		}

		if (enteredOtp === generatedOTP) {
			setError(null);
			setIsOTPVerified(true);
			setMaskedAadhaar(maskAadhaar(aadhaar));
			alert('Aadhaar verified successfully');
			// Keep only masked value in memory post verification.
			setAadhaar('');
		} else {
			setIsOTPVerified(false);
			alert('Invalid OTP');
		}
	};

	const requestOtp = async () => {
		if (isTherapistFlow && !(isOTPVerified && isICAccepted && isNDAAccepted && isDPAccepted)) {
			setError('Complete Therapist legal onboarding to continue.');
			return;
		}

		setError(null);
		setLoading(true);
		setDevOtp(null);
		try {
			const result = await signupWithPhone(phone.trim(), { name: name.trim(), role });
			setOtpSent(true);
			setDevOtp(result.devOtp || null);
		} catch (err) {
			setError(getApiErrorMessage(err, 'Failed to send OTP'));
		} finally {
			setLoading(false);
		}
	};

	const location = useLocation();

	const resolveReturnTo = (): string => {
		const qp = new URLSearchParams(location.search);
		return qp.get('returnTo') || qp.get('next') || window.location.pathname || '/';
	};

	const verifyOtp = async () => {
		setError(null);
		setLoading(true);
		try {
			const result = await verifyPhoneSignupOtp(phone.trim(), otp.trim());
			await handlePostAuthSuccess(result);
		} catch (err) {
			setError(getApiErrorMessage(err, 'OTP verification failed'));
		} finally {
			setLoading(false);
		}
	};

	const handlePostAuthSuccess = async (result: { user: any; sessionId: string }) => {
			await checkAuth({ force: true });
			// If backend indicates patient requires a subscription, send to plans page
			if ((result.user as any)?.requiresSubscription) {
				const returnTo = resolveReturnTo();
				navigate(`/plans?returnTo=${encodeURIComponent(returnTo)}`, { replace: true });
				return;
			}
			const postLoginRoute = getPostLoginRoute(result.user);
			navigate(postLoginRoute, { replace: true });
	};

	const registerTherapistDirectly = async () => {
		if (!isTherapistFlow) return;
		if (!(isOTPVerified && isICAccepted && isNDAAccepted && isDPAccepted)) {
			setError('Complete Aadhaar OTP verification and legal acceptance to continue.');
			return;
		}
		if (!name.trim() || !phone.trim()) {
			setError('Full Name and Phone Number are required to register.');
			return;
		}

		setError(null);
		setLoading(true);
		setDevOtp(null);
		try {
			const signup = await signupWithPhone(phone.trim(), { name: name.trim(), role: 'therapist' });
			const registrationOtp = signup.devOtp || '123456';
			const result = await verifyPhoneSignupOtp(phone.trim(), registrationOtp);
			setDevOtp(signup.devOtp || registrationOtp);
			await handlePostAuthSuccess(result);
		} catch (err) {
			setError(getApiErrorMessage(err, 'Therapist registration failed'));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="responsive-page">
			<div className="responsive-container py-6 sm:py-10">
				<div className="mx-auto w-full max-w-lg rounded-3xl border border-calm-sage/20 bg-wellness-surface p-5 shadow-soft-md sm:p-8">
					<div className="mb-3">
						<Link to="/" className="text-sm text-calm-sage underline underline-offset-2 hover:text-wellness-text">
							Back to Home
						</Link>
					</div>
					<h1 className="text-2xl font-semibold text-wellness-text sm:text-3xl">Create your account</h1>
					<p className="mt-2 text-sm text-wellness-muted sm:text-base">Register using phone number and OTP.</p>

					<div className="mt-6 space-y-4">
						<Input
							id="signup-name"
							label="Full Name"
							autoComplete="name"
							placeholder="Your full name"
							value={name}
							onChange={(event) => setName(event.target.value)}
							required
						/>
						<Input
							id="signup-phone"
							label="Phone Number"
							type="tel"
							autoComplete="tel"
							placeholder="+919876543210"
							value={phone}
							onChange={(event) => setPhone(event.target.value)}
							required
						/>

						<div>
							<label htmlFor="signup-role" className="mb-2 block text-sm font-medium text-wellness-text">Role</label>
							<select
								id="signup-role"
								value={role}
								onChange={(event) => setRole(event.target.value as 'patient' | 'therapist' | 'psychiatrist' | 'coach')}
								className="w-full rounded-2xl border-2 border-calm-sage/30 bg-white px-5 py-3 text-wellness-text transition-smooth focus:border-calm-sage focus:outline-none focus:ring-2 focus:ring-calm-sage/20"
							>
								<option value="patient">Patient</option>
								<option value="therapist">Therapist</option>
								<option value="psychiatrist">Psychiatrist</option>
								<option value="coach">Coach</option>
							</select>
						</div>

							{isTherapistFlow ? (
								<div className="rounded-2xl border border-calm-sage/30 bg-white p-4">
									<p className="text-sm font-semibold text-wellness-text">Therapist Onboarding Legal Flow</p>
									<p className="mt-1 text-xs text-wellness-muted">Step 1 to Step 3 is mandatory before signup OTP.</p>

									<div className="mt-4">
										<p className="text-sm font-semibold text-wellness-text">Step 1: IC Agreement + Aadhaar Verification</p>

										<div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
											<input
												type="text"
												placeholder="Enter Aadhaar Number"
												value={aadhaar}
												onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
												className="w-full rounded-xl border border-calm-sage/30 px-4 py-2.5 text-sm text-wellness-text focus:border-calm-sage focus:outline-none"
											/>
											<Button type="button" onClick={sendOTP} loading={isAadhaarOtpLoading} className="min-h-[42px]">
												{isAadhaarOtpLoading ? 'Sending...' : 'Send OTP'}
											</Button>
										</div>

										{isAadhaarOtpSent ? (
											<div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
												<input
													type="text"
													placeholder="Enter OTP"
													value={otpForAadhaar}
													onChange={(e) => setOtpForAadhaar(e.target.value.replace(/\D/g, '').slice(0, 6))}
													className="w-full rounded-xl border border-calm-sage/30 px-4 py-2.5 text-sm text-wellness-text focus:border-calm-sage focus:outline-none"
												/>
												<Button type="button" onClick={verifyOTP} loading={isAadhaarOtpLoading} className="min-h-[42px]">
													{isAadhaarOtpLoading ? 'Verifying...' : 'Verify OTP'}
												</Button>
											</div>
										) : null}

										{isOTPVerified ? (
											<p className="mt-2 text-xs font-medium text-emerald-700">✅ Aadhaar Verified: {maskedAadhaar}</p>
										) : null}

										<label className="mt-3 flex items-start gap-2 text-sm text-wellness-text">
											<input
												type="checkbox"
												disabled={!isOTPVerified}
												checked={isICAccepted}
												onChange={(e) => setIsICAccepted(e.target.checked)}
											/>
											<span>
												I agree to the{' '}
												<a
													href="/src/pages/legal/therapist_ic_agreement.html"
													target="_blank"
													rel="noopener noreferrer"
													className="text-teal-600 underline"
												>
													Therapist IC Agreement
												</a>
											</span>
										</label>
									</div>

									<div className="mt-4">
										<p className="text-sm font-semibold text-wellness-text">Step 2: NDA Agreement</p>
										<label className="mt-3 flex items-start gap-2 text-sm text-wellness-text">
											<input
												type="checkbox"
												checked={isNDAAccepted}
												onChange={(e) => setIsNDAAccepted(e.target.checked)}
											/>
											<span>
												I agree to the{' '}
												<a
													href="/src/pages/legal/therapist_nda.html"
													target="_blank"
													rel="noopener noreferrer"
													className="text-teal-600 underline"
												>
													Therapist NDA
												</a>
											</span>
										</label>
									</div>

									<div className="mt-4">
										<p className="text-sm font-semibold text-wellness-text">Step 3: Data Processing Agreement</p>
										<label className="mt-3 flex items-start gap-2 text-sm text-wellness-text">
											<input
												type="checkbox"
												checked={isDPAccepted}
												onChange={(e) => setIsDPAccepted(e.target.checked)}
											/>
											<span>
												I agree to the{' '}
												<a
													href="/legal/data_processing_agreement.html"
													target="_blank"
													rel="noopener noreferrer"
													className="text-teal-600 underline"
												>
													Data Processing Agreement
												</a>
											</span>
										</label>
										{isICAccepted && isNDAAccepted && !isDPAccepted ? (
											<p className="mt-2 text-xs text-red-500">Please accept Data Processing Agreement</p>
										) : null}
									</div>

								</div>
							) : null}

						{otpSent ? (
							<Input
								id="signup-otp"
								label="OTP"
								inputMode="numeric"
								pattern="\\d{6}"
								maxLength={6}
								autoComplete="one-time-code"
								placeholder="6-digit OTP"
								value={otp}
								onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
								required
							/>
						) : null}

						{isTherapistFlow ? (
							<Button
								type="button"
								fullWidth
								loading={loading}
								className="min-h-[48px]"
								onClick={registerTherapistDirectly}
								disabled={!(isOTPVerified && isICAccepted && isNDAAccepted && isDPAccepted)}
							>
								{loading ? 'Registering...' : 'Register'}
							</Button>
						) : otpSent ? (
							<Button type="button" fullWidth loading={loading} className="min-h-[48px]" onClick={verifyOtp}>
								{loading ? 'Verifying OTP...' : 'Register'}
							</Button>
						) : (
							<Button
								type="button"
								fullWidth
								loading={loading}
								className="min-h-[48px]"
								onClick={() => {
									void requestOtp();
								}}
							>
								{loading ? 'Sending OTP...' : 'Send OTP'}
							</Button>
						)}
					</div>

					{devOtp ? (
						<p className="mt-3 text-xs text-wellness-muted">
							Development OTP: <span className="font-semibold text-wellness-text">{devOtp}</span>
						</p>
					) : null}

					{error ? (
						<p role="alert" aria-live="polite" className="mt-3 text-sm text-red-600">{error}</p>
					) : null}

					<p className="mt-2 text-center text-sm text-wellness-muted">
						Already have an account?{' '}
						<Link to="/auth/login" className="text-calm-sage underline underline-offset-2 hover:text-wellness-text">
							Login here
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
