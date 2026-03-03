import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage, requestPasswordReset } from '../../api/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function ForgotPasswordPage() {
	const navigate = useNavigate();

	const [identifier, setIdentifier] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [devOtp, setDevOtp] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!identifier.trim()) {
			return;
		}

		setLoading(true);
		setError(null);
		setSuccess(null);
		setDevOtp(null);

		try {
			const response = await requestPasswordReset({ identifier: identifier.trim() });
			setSuccess(response.message || 'If the account exists, reset instructions were sent.');
			if (response.devOtp) {
				setDevOtp(response.devOtp);
			}
		} catch (err) {
			setError(getApiErrorMessage(err, 'Failed to request password reset'));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="responsive-page">
			<div className="responsive-container py-6 sm:py-10">
				<div className="mx-auto w-full max-w-lg rounded-3xl border border-calm-sage/20 bg-wellness-surface p-5 shadow-soft-md sm:p-8">
					<h1 className="text-2xl font-semibold text-wellness-text sm:text-3xl">Forgot password</h1>
					<p className="mt-2 text-sm text-wellness-muted sm:text-base">Enter your email to receive a reset OTP.</p>

					<form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
						<Input
							id="forgot-password-identifier"
							label="Email"
							type="email"
							autoComplete="email"
							placeholder="you@example.com"
							value={identifier}
							onChange={(event) => setIdentifier(event.target.value)}
							required
						/>
						<Button type="submit" fullWidth loading={loading} className="min-h-[48px]">
							{loading ? 'Sending OTP...' : 'Send reset OTP'}
						</Button>
					</form>

					{error && (
						<p role="alert" aria-live="polite" className="mt-4 text-sm text-red-600">
							{error}
						</p>
					)}
					{success && (
						<p role="status" aria-live="polite" className="mt-4 text-sm text-emerald-700">
							{success}
						</p>
					)}
					{devOtp && (
						<p className="mt-2 text-xs text-wellness-muted">
							Development OTP: <span className="font-semibold text-wellness-text">{devOtp}</span>
						</p>
					)}

					<div className="mt-5 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
						<Link to="/auth/login" className="text-wellness-muted hover:text-wellness-text">
							Back to login
						</Link>
						<button
							type="button"
							onClick={() => navigate(`/auth/reset-password?identifier=${encodeURIComponent(identifier.trim())}`)}
							className="text-calm-sage underline underline-offset-2 hover:text-wellness-text"
						>
							Already have OTP?
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
