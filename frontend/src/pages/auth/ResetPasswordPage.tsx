import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { getApiErrorMessage, resetPassword } from '../../api/auth';
import OtpVerify from '../../components/auth/OtpVerify';

export default function ResetPasswordPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const identifierFromQuery = searchParams.get('identifier') ?? '';

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleReset = async (payload: { identifier: string; otp: string; newPassword: string }) => {
		setLoading(true);
		setError(null);
		setSuccess(null);

		try {
			await resetPassword(payload);
			setSuccess('Password reset successful. Redirecting to login...');
			window.setTimeout(() => {
				navigate('/auth/login', { replace: true });
			}, 1200);
		} catch (err) {
			setError(getApiErrorMessage(err, 'Failed to reset password'));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="responsive-page">
			<div className="responsive-container py-6 sm:py-10">
				<div className="mx-auto w-full max-w-lg rounded-3xl border border-calm-sage/20 bg-wellness-surface p-5 shadow-soft-md sm:p-8">
					<h1 className="text-2xl font-semibold text-wellness-text sm:text-3xl">Reset password</h1>
					<p className="mt-2 text-sm text-wellness-muted sm:text-base">Enter the OTP and create a new password.</p>
					<div className="mt-6">
						<OtpVerify
							identifier={identifierFromQuery}
							onSubmit={handleReset}
							loading={loading}
							error={error}
							success={success}
						/>
					</div>
					<p className="mt-4 text-sm text-wellness-muted">
						Need another OTP?{' '}
						<Link to="/auth/forgot-password" className="text-calm-sage underline underline-offset-2 hover:text-wellness-text">
							Request again
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
