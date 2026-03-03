import { FormEvent, useMemo, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';

type OtpVerifyProps = {
	identifier?: string;
	onSubmit: (payload: { identifier: string; otp: string; newPassword: string }) => Promise<void>;
	loading?: boolean;
	error?: string | null;
	success?: string | null;
};

export default function OtpVerify({ identifier = '', onSubmit, loading = false, error = null, success = null }: OtpVerifyProps) {
	const [emailOrPhone, setEmailOrPhone] = useState(identifier);
	const [otp, setOtp] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [localError, setLocalError] = useState<string | null>(null);

	const formError = useMemo(() => localError ?? error, [localError, error]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLocalError(null);

		if (!emailOrPhone.trim() || !otp.trim() || !newPassword.trim()) {
			setLocalError('Please complete all fields');
			return;
		}

		if (!/^\d{6}$/.test(otp.trim())) {
			setLocalError('OTP must be 6 digits');
			return;
		}

		if (newPassword.length < 8) {
			setLocalError('Password must be at least 8 characters');
			return;
		}

		if (newPassword !== confirmPassword) {
			setLocalError('Passwords do not match');
			return;
		}

		await onSubmit({
			identifier: emailOrPhone.trim(),
			otp: otp.trim(),
			newPassword,
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4" noValidate>
			<Input
				id="reset-identifier"
				label="Email"
				type="email"
				autoComplete="email"
				placeholder="you@example.com"
				value={emailOrPhone}
				onChange={(event) => setEmailOrPhone(event.target.value)}
				required
			/>
			<Input
				id="reset-otp"
				label="OTP"
				inputMode="numeric"
				pattern="\\d{6}"
				maxLength={6}
				autoComplete="one-time-code"
				placeholder="6-digit code"
				value={otp}
				onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
				required
			/>
			<Input
				id="reset-new-password"
				label="New Password"
				type="password"
				autoComplete="new-password"
				helperText="Use at least 8 characters"
				placeholder="Enter new password"
				value={newPassword}
				onChange={(event) => setNewPassword(event.target.value)}
				required
			/>
			<Input
				id="reset-confirm-password"
				label="Confirm New Password"
				type="password"
				autoComplete="new-password"
				placeholder="Re-enter new password"
				value={confirmPassword}
				onChange={(event) => setConfirmPassword(event.target.value)}
				required
			/>
			<Button type="submit" fullWidth loading={loading} className="min-h-[48px]">
				{loading ? 'Resetting password...' : 'Reset password'}
			</Button>
			{formError && (
				<p role="alert" aria-live="polite" className="text-sm text-red-600">
					{formError}
				</p>
			)}
			{success && (
				<p role="status" aria-live="polite" className="text-sm text-emerald-700">
					{success}
				</p>
			)}
		</form>
	);
}
