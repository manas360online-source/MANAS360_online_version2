import { UIEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../../api/auth';
import { patientApi } from '../../api/patient';
import LoginForm from '../../components/auth/LoginForm';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { getPostLoginRoute, useAuth } from '../../context/AuthContext';

const TERMS_ACCEPTED_KEY = 'termsAccepted';

const isSubscriptionActive = (subscription: any): boolean => {
	if (!subscription) return false;

	const status = String(subscription?.status || '').toLowerCase();
	if (status === 'active' || status === 'trialing') return true;
	if (subscription?.isActive === true || subscription?.active === true) return true;

	return false;
};

export default function LoginPage() {
	const { user, isAuthenticated, login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const from = (location.state as { from?: string; afterLogin?: string } | null)?.from;
	const afterLogin = (location.state as { from?: string; afterLogin?: string } | null)?.afterLogin;
	const next = new URLSearchParams(location.search).get('next');


	const resolvePostLoginRouteWithSubscription = async (candidate: string | null, role: string | undefined) => {
		if (!candidate || candidate.startsWith('/auth/')) {
			return getPostLoginRoute(user);
		}

		const normalizedRole = String(role || '').toLowerCase();
		const isPricingTarget = candidate.startsWith('/patient/pricing');
		if (normalizedRole !== 'patient' || !isPricingTarget) {
			return candidate;
		}

		try {
			const subscriptionResponse = await patientApi.getSubscription();
			const subscriptionPayload = (subscriptionResponse as any)?.data ?? subscriptionResponse;
			if (isSubscriptionActive(subscriptionPayload)) {
				return '/patient/dashboard';
			}
		} catch {
			// If subscription check fails, keep original target.
		}

		return candidate;
	};

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
	const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
	const [checkboxChecked, setCheckboxChecked] = useState(false);
	const [termsAccepted, setTermsAccepted] = useState(false);

	useEffect(() => {
		setTermsAccepted(localStorage.getItem(TERMS_ACCEPTED_KEY) === 'true');
	}, []);

	useEffect(() => {
		if (!isAuthenticated || !user) {
			return;
		}

		const candidate = from || afterLogin || next || null;
		void (async () => {
			const postLoginRoute = await resolvePostLoginRouteWithSubscription(candidate, user.role);
			navigate(postLoginRoute, { replace: true });
		})();
	}, [afterLogin, from, isAuthenticated, navigate, next, user]);

	const onSubmit = async (identifier: string, password: string) => {
		if (!termsAccepted) {
			setError('Please accept the Terms & Conditions before logging in.');
			return;
		}

		setError(null);
		setLoading(true);
		try {
			const loggedInUser = await login(identifier, password);
			const candidate = from || afterLogin || next || null;
			const postLoginRoute = await resolvePostLoginRouteWithSubscription(candidate, loggedInUser.role);
			navigate(postLoginRoute, { replace: true });
		} catch (err) {
			setError(getApiErrorMessage(err, 'Login failed'));
		} finally {
			setLoading(false);
		}
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
		setError(null);
		setIsTermsModalOpen(false);
	};

	return (
		<div className="responsive-page">
			<div className="responsive-container py-6 sm:py-10">
				<div className="mx-auto w-full max-w-lg rounded-3xl border border-calm-sage/20 bg-wellness-surface p-5 shadow-soft-md sm:p-8">
					<h1 className="text-2xl font-semibold text-wellness-text sm:text-3xl">Welcome back</h1>
					<p className="mt-2 text-sm text-wellness-muted sm:text-base">Sign in to continue your wellness journey.</p>
					<div className="mt-6">
						<LoginForm
							onSubmit={onSubmit}
							loading={loading}
							error={error}
							afterSubmitContent={(
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
							)}
						/>
					</div>
					<p className="mt-2 text-center text-sm text-wellness-muted">
						Need to create an account?{' '}
						<Link to="/auth/signup" className="text-calm-sage underline underline-offset-2 hover:text-wellness-text">
							Register here
						</Link>
					</p>
					<p className="mt-2 text-center text-xs text-wellness-muted">
						Want to go back to the landing page?{' '}
						<Link to="/" className="text-calm-sage underline underline-offset-2 hover:text-wellness-text">
							Go to Home
						</Link>
					</p>
				</div>
			</div>

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
		</div>
	);
}
