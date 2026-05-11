import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getApiErrorMessage, signupWithPhone, verifyPhoneSignupOtp , providerRegister} from '../../api/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth, getPostLoginRoute } from '../../context/AuthContext';
import NriPatch, { type NriConsentState } from '../legal/nri';

type SignupRole =
  | 'patient'
  | 'therapist'
  | 'corporate'
  | 'clinic';

  type SignupStep = 1 | 2 | 3 | 4;

type ProviderAgreementKey = 'THERAPIST_IC_AGREEMENT' | 'THERAPIST_NDA' | 'THERAPIST_DATA_PROCESSING_AGREEMENT';

const PROVIDER_AGREEMENTS: Array<{ key: ProviderAgreementKey; label: string; sections: string[] }> = [
	{
		key: 'THERAPIST_IC_AGREEMENT',
		label: 'Therapist IC Agreement',
		sections: [
			'1. NATURE OF RELATIONSHIP',
			'1.1 The Provider is engaged as an independent contractor. Nothing in this Agreement shall be construed to create an employer-employee relationship, partnership, joint venture, agency, franchise, or fiduciary relationship between the parties.',
			'1.2 The Provider retains full and exclusive clinical autonomy and professional judgment in all therapeutic interactions. MANAS360 does not direct, control, supervise, or interfere with clinical decision-making, diagnosis, treatment planning, prescriptions, or patient management.',
			'1.3 The Provider is solely responsible for all tax liabilities, including income tax, GST (if applicable), professional tax, and any statutory contributions required under Indian law.',
			'2. PROVIDER REPRESENTATIONS AND ELIGIBILITY',
			'2.1 The Provider represents and warrants that they hold:',
			'(a) A valid degree in psychology, psychiatry, counseling, psychotherapy or related field from a recognized institution;',
			'(b) Valid and current registration with the Rehabilitation Council of India (RCI), National Medical Commission (NMC), relevant State Medical Council, or other applicable regulatory authority;',
			"(c) Professional indemnity insurance (recommended) or willingness to participate in MANAS360's group insurance programme;",
			'(d) No pending disciplinary actions, license suspensions, or criminal charges related to professional conduct.',
			'3. SERVICES',
			"3.1 The Provider agrees to offer professional mental health services via the MANAS360 Platform, including video therapy, audio therapy, chat-based therapy, group sessions, and clinical assessments.",
			'3.2 The Provider shall maintain an up-to-date availability calendar on the Platform and honour all confirmed bookings.',
			"3.3 The Provider shall maintain complete and accurate session notes using MANAS360's SOAP/Progress Note templates within 24 hours of each session.",
			'4. REVENUE SHARE',
			'4.1 The revenue share between MANAS360 and the Provider shall be as follows:',
			'(a) Provider receives 60% of the session fee charged to the patient;',
			'(b) MANAS360 retains 40% as the platform fee, which covers technology infrastructure, payment processing, marketing, administrative support and patient acquisition.',
			'4.2 Example: For a session priced at INR 1,000 by the Provider, the Provider receives INR 600 and MANAS360 retains INR 400.',
			'4.3 The Provider sets their own session fees within the range of INR 300 to INR 5,000 per session. MANAS360 may suggest pricing based on market benchmarks but does not mandate specific fees.',
			'4.4 Revenue share percentages may be revised with 60 days\' written notice to the Provider.',
			'5. PAYMENT TERMS',
			"5.1 Payouts are processed weekly (every Monday) for sessions completed in the prior week via UPI bank transfer to the Provider's registered bank account.",
			'5.2 Minimum payout threshold: INR 500. Amounts below the threshold will be carried forward.',
			'5.3 Detailed payout statements including session count, gross earnings, platform fee, TDS (if applicable), and net payout are available on the Provider Dashboard.',
			'5.4 Tax Deducted at Source (TDS) shall be deducted at applicable rates under the Income Tax Act, 1961. TDS certificates will be issued quarterly.',
			'6. PROVIDER OBLIGATIONS',
			'6.1 Maintain valid and subsisting professional qualifications, licenses, and registrations at all times, and immediately notify MANAS360 of any suspension, restriction, lapse, investigation, or change in registration status.',
			'6.2 Comply with all applicable laws, including the Mental Healthcare Act, 2017, Telemedicine Practice Guidelines, 2020, NMC Code of Ethics, and DPDPA 2023.',
			'6.3 Attend mandatory platform training and quarterly compliance updates.',
			'6.4 Respond to patient booking requests within four (4) hours during declared availability and maintain professional responsiveness and continuity of care.',
			'6.5 Not solicit, divert or attempt to move MANAS360 patients for off-platform services or share personal contact information with patients.',
			'6.6 Report all incidents, including clinical emergencies, patient complaints, data breaches, and ethical concerns, to MANAS360 within 24 hours.',
			'6.7 Maintain strict confidentiality of all patient information and access, use, store, or disclose such information solely for lawful clinical purposes.',
			"6.8 Implement appropriate technical and organizational safeguards to protect personal data against unauthorized access, disclosure, alteration, loss, or misuse, in accordance with applicable data protection laws and the Platform's privacy and security policies.",
			'7. PLATFORM OBLIGATIONS',
			'7.1 Provide a reliable and secure technology infrastructure to support teleconsultation services, with a targeted service availability of 99.5% uptime, subject to scheduled maintenance, force majeure events, and factors beyond its reasonable control.',
			'7.2 Responsible for managing patient acquisition initiatives, marketing activities, payment processing mechanisms, and billing administration in connection with services delivered through the Platform, subject to applicable laws and agreed commercial terms.',
			'7.3 Provide integrated session management tools, standardized SOAP note templates, prescription management functionality (where applicable and limited to licensed psychiatrists), and access to clinical dashboards to support documentation, care coordination, and service delivery.',
			'7.4 Process payouts as per Section 5.',
			'7.5 Provide professional indemnity insurance coverage under a group policy arrangement, on an optional basis, with the applicable premium or associated costs to be shared as mutually agreed.',
			'8. LIABILITY AND INDEMNIFICATION',
			'8.1 The Provider shall be solely liable for clinical negligence, malpractice, or breach of professional standards.',
			'8.2 The Provider agrees to indemnify and hold harmless MANAS360 from claims arising out of clinical misconduct; regulatory violations; misrepresentation of credentials; and breach of confidentiality.',
			'9. TERM AND TERMINATION',
			"9.1 This Agreement shall commence upon the Provider's acceptance of its terms and activation of the Provider's profile on the Platform, and shall continue in full force and effect unless and until terminated.",
			"9.2 Either party may terminate with 30 days' written notice.",
			"9.3 Notwithstanding the foregoing, MANAS360 may suspend or terminate this Agreement with immediate effect, without prior notice, if the Provider: (a) has any professional credential, license, or registration revoked, suspended, restricted, or allowed to lapse; (b) engages in professional misconduct or unethical practice; (c) breaches patient confidentiality or data protection obligations; (d) receives three or more verified patient complaints within a 90 day period; or (e) fails to comply with or fails a compliance, quality, or regulatory audit.",
			'9.4 Upon termination, the Provider shall complete all scheduled sessions and receive pending payouts within 15 business days.',
			'10. INTELLECTUAL PROPERTY',
			"10.1 MANAS360 retains all right, title, and interest, including all intellectual property rights, in and to the Platform's technology, software, systems, branding, trademarks, trade names, logos, content, templates, workflows, and other proprietary materials, and nothing in this Agreement shall be construed as granting the Provider any ownership rights therein.",
			"10.2 Session notes created by the Provider using MANAS360 templates are the joint property of the Provider and the patient, hosted on MANAS360's infrastructure.",
			'11. GOVERNING LAW',
			'11.1 This Agreement shall be governed by and construed in accordance with the laws of India. Any dispute, controversy, or claim arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996, as amended from time to time. The seat and venue of arbitration shall be Bengaluru, Karnataka, India, and the arbitral proceedings shall be conducted in the English language.',
			'ACCEPTANCE',
			'By clicking "I Accept" and activating your Provider profile, you agree to the terms of this Agreement.',
		],
	},
	{
		key: 'THERAPIST_NDA',
		label: 'Therapist NDA',
		sections: [
			'1. CONFIDENTIAL INFORMATION',
			"1.1 \"Confidential Information\" includes: (a) all patient data, health records, assessment scores, session notes, and personal information; (b) MANAS360 business plans, commercial strategies, technology, algorithms, pricing, and strategies; (c) Provider network data, including other Providers' identities and performance metrics; (d) any information marked as confidential or that a reasonable person would understand to be confidential.",
			'2. OBLIGATIONS',
			'2.1 The Provider shall: (a) keep all Confidential Information strictly confidential; (b) use Confidential Information solely for providing professional services through MANAS360 platform; (c) not disclose Confidential Information to any third party without prior written consent; (d) implement reasonable and industry standard security measures to protect Confidential Information.',
			"2.2 The Provider shall NOT: (a) download, export, copy, store, or transmit patient data to personal devices or external systems; (b) discuss patient cases with persons not involved in the patient's care; (c) use patient data for research, publication, or teaching without explicit written consent and institutional ethics approval; (d) retain patient data after termination of this Agreement.",
			'3. EXCEPTIONS',
			'3.1 Confidentiality obligations do not apply to information that: (a) is publicly available through no fault of the Provider; (b) was known to the Provider before disclosure; (c) is independently developed without reference to Confidential Information; (d) is required to be disclosed by law, court order, or regulatory authority, provided the Provider gives MANAS360 prompt written notice.',
			'4. PATIENT DATA HANDLING',
			'4.1 All patient data must be accessed exclusively through the MANAS360 Platform. Downloading, exporting, or screen-capturing patient data is prohibited unless explicitly authorized.',
			'4.2 Session notes must be entered directly into the MANAS360 Platform and not stored locally.',
			'4.3 All video/audio sessions are encrypted end-to-end. The Provider shall not use recording software.',
			'5. SURVIVAL',
			'5.1 Confidentiality obligations survive termination of the Provider relationship for a period of 5 years, except for patient health data which remains confidential indefinitely.',
			'6. REMEDIES',
			'6.1 The Provider acknowledges and agrees that any breach or threatened breach of this Agreement may result in irreparable harm to MANAS360 and/or affected patients, for which monetary damages may be an inadequate remedy. Accordingly, MANAS360 shall be entitled to seek immediate injunctive or equitable relief, in addition to any other rights or remedies available under law.',
			'6.2 The Provider further acknowledges that any unauthorized disclosure, misuse, or breach of patient data or sensitive personal information may attract statutory penalties and liabilities under applicable laws, including the Digital Personal Data Protection Act, 2023 (which may prescribe penalties up to INR 250 crore for certain contraventions) and the Information Technology Act, 2000, in addition to civil, regulatory, or criminal consequences as may be applicable.',
			'7. GOVERNING LAW',
			'7.1 This Agreement shall be governed by and construed in accordance with the laws of India. Any dispute, controversy, or claim arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996, as amended from time to time. The seat and venue of arbitration shall be Bengaluru, Karnataka, India, and the arbitral proceedings shall be conducted in the English language.',
			'ACCEPTANCE',
			'By clicking "I Accept," the Provider agrees to this NDA.',
		],
	},
	{
		key: 'THERAPIST_DATA_PROCESSING_AGREEMENT',
		label: 'Therapist Data Processing Agreement',
		sections: [
			'1. DEFINITIONS',
			'1.1 "Data Fiduciary" shall have the meaning assigned under the Digital Personal Data Protection Act, 2023 ("DPDP Act") and refers to MANAS360, which determines the purpose and means of processing personal data.',
			'1.2 "Data Processor" means the Provider, who processes personal data on behalf of the Data Fiduciary in the course of providing therapeutic services.',
			'1.3 "Personal Data" means any data about an individual who is identifiable, including health data, as defined under DPDPA 2023.',
			'1.4 "Processing" includes collection, recording, storage, organization, structuring, use, sharing, disclosure, restriction, erasure, or destruction of Personal Data.',
			'2. SCOPE',
			"2.1 This DPA governs the Provider's processing of patient personal data accessed through the MANAS360 Platform.",
			'3. PROCESSING OBLIGATIONS',
			'3.1 The Provider shall process patient data ONLY for the purpose of providing mental health services through the Platform.',
			'3.2 The Provider shall not process patient data for any other purpose, including personal research, marketing, or sharing with third parties.',
			"3.3 The Provider shall implement reasonable security safeguards as specified in MANAS360's Security Policy, including: (a) using a secure, password-protected device; (b) enabling 2-factor authentication; (c) not accessing patient data on shared or public computers; (d) conducting sessions from a private, sound-proof location.",
			"3.4 The Provider shall adhere to the principle of data minimization by accessing only such Personal Data as is strictly necessary for providing services to patients formally assigned to them through the Platform. The Provider shall not attempt to access, view, retrieve, or manipulate personal or clinical data relating to patients who are not under their authorized care or clinical responsibility. The Provider is strictly prohibited from downloading, exporting, copying, transferring, or storing any Personal Data outside the Platform's secure environment unless such action is expressly permitted in writing by MANAS360 or is otherwise required under applicable law.",
			'4. SUB-PROCESSING',
			'4.1 The Provider shall not appoint or engage any sub-processor to process patient data without prior written consent from MANAS360.',
			'5. DATA BREACH',
			'5.1 The Provider shall notify MANAS360 of any suspected or actual personal data breach within 12 hours of becoming aware.',
			'5.2 Notification shall include: nature of breach, categories of data affected, number of individuals affected, and remedial measures taken.',
			'5.3 The Provider shall be solely liable for any losses, damages, penalties, regulatory fines, or other adverse consequences arising out of or in connection with unauthorized or unlawful processing of personal data, negligent or improper handling of Personal Data, failure to implement required technical or organizational security safeguards, or delay or failure in providing mandatory breach notification as required under applicable law.',
			'6. DATA SUBJECT REQUESTS',
			'6.1 If a patient contacts the Provider directly to exercise their DPDPA rights (access, correction, erasure), the Provider shall forward the request to MANAS360 within 24 hours. The Provider shall assist MANAS360 in fulfilling statutory obligations relating to data subject rights.',
			'7. RETURN AND DELETION',
			'7.1 Upon termination, the Provider shall cease all processing and confirm in writing that no patient data is retained on personal devices or systems.',
			'8. AUDIT',
			"8.1 MANAS360 reserves the right to conduct data protection audits (no more than once per quarter with 7 days' notice) to verify compliance. The Provider shall cooperate fully and provide reasonable access to relevant documentation demonstrating compliance.",
			'9. GOVERNING LAW',
			'9.1 This Agreement shall be governed by and construed in accordance with the laws of India. Any dispute, controversy, or claim arising out of or in connection with this Agreement shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996, as amended from time to time. The seat and venue of arbitration shall be Bengaluru, Karnataka, India, and the arbitral proceedings shall be conducted in the English language.',
		],
	},
];

const PATIENT_TERMS_SECTIONS: string[] = [
	'You are registering for MANAS360 services and agree to use the platform for lawful wellness and care purposes only.',
	'You confirm all information submitted during registration is accurate and belongs to you.',
	'Your personal and health-related information will be processed under the platform Privacy Policy and applicable law.',
	'Session booking, cancellation, and refund handling follow the published platform Refund and Cancellation Policy.',
	'The platform may maintain logs and records for safety, support, billing, and compliance operations.',
	'Medical advice is provided by licensed professionals; emergency situations require immediate local emergency support.',
	'By accepting, you confirm that you have read and understood the Terms of Service, Privacy Policy, and Refund Policy.',
];

export default function SignupPage() {
	const { checkAuth } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [role, setRole] = useState<SignupRole>('patient');
	const [otp, setOtp] = useState('');
	const [otpSent, setOtpSent] = useState(false);
	const [devOtp, setDevOtp] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	
	const [providerAgreementsAccepted, setProviderAgreementsAccepted] = useState<Record<ProviderAgreementKey, boolean>>({
		THERAPIST_IC_AGREEMENT: false,
		THERAPIST_NDA: false,
		THERAPIST_DATA_PROCESSING_AGREEMENT: false,
	});
	const [showSignupFields, setShowSignupFields] = useState(false);
	const [nriConsent, setNriConsent] = useState<NriConsentState>({
		nri_declared: false,
		nri_tos_accepted: false,
		nri_tos_accepted_at: '',
	});

  const [signupStep, setSignupStep] = useState<SignupStep>(1);
const [selectedSpecialization, setSelectedSpecialization] = useState('');

	const [showPatientTermsModal, setShowPatientTermsModal] = useState(false);
	const [canAcceptPatientTerms, setCanAcceptPatientTerms] = useState(false);
	const [activeAgreement, setActiveAgreement] = useState<ProviderAgreementKey | null>(null);
	const [canAcceptActiveAgreement, setCanAcceptActiveAgreement] = useState(false);
	const agreementScrollRef = useRef<HTMLDivElement | null>(null);
	const patientTermsScrollRef = useRef<HTMLDivElement | null>(null);
	const [email, setEmail] = useState("");
const [dob, setDob] = useState("");
const [gender, setGender] = useState("");
const [language, setLanguage] = useState("English");
const [city, setCity] = useState("");
const [verifiedUser, setVerifiedUser] = useState<any>(null);

const [providerEmail, setProviderEmail] = useState('');
const [providerRegistrationNumber, setProviderRegistrationNumber] = useState('');
const [providerCredentialScreenshot, setProviderCredentialScreenshot] = useState<File | null>(null);
const [latestCredentialsValid, setLatestCredentialsValid] = useState(false);



	const isPatientLeadFlow = useMemo(() => {
  const query = new URLSearchParams(location.search);

  const returnTarget = String(
    query.get("next") || query.get("returnTo" ) || ""
  ).toLowerCase();

  const flow = String(query.get("flow") || "").toLowerCase();

  return (
    flow === "patient-lead" ||
    returnTarget.includes("/assessment-preset") ||
    returnTarget.includes("/patient/sessions") ||
    returnTarget.includes("/patient/dashboard")
  );
}, [location.search]);




useEffect(() => {
  const query = new URLSearchParams(location.search);
  const specialization = query.get('specialization');

  if (specialization) {
    setRole('therapist');
    setSelectedSpecialization(specialization);
    setSignupStep(2);
  }
}, [location.search]);

useEffect(() => {
  if (isPatientLeadFlow) {
    setRole("patient");
    setSignupStep(2);
  }
}, [isPatientLeadFlow]);

	const isCertificationContext = useMemo(() => {
		const query = new URLSearchParams(location.search);
		const next = String(query.get('next') || query.get('returnTo') || '').toLowerCase();
		return (
			next.includes('/certifications')
			|| next.includes('/certification/enroll')
			|| next.includes('/provider/certifications')
			|| next.includes('/provider/certification/enroll')
		);
	}, [location.search]);

	const isProviderRole = ['therapist', 'psychiatrist', 'psychologist', 'coach'].includes(role);

const isProviderFlow =
  !isCertificationContext &&
  !isPatientLeadFlow &&
  role === 'therapist';




	const allProviderAgreementsAccepted = useMemo(
		() => Object.values(providerAgreementsAccepted).every(Boolean),
		[providerAgreementsAccepted],
	);

	const activeAgreementConfig = useMemo(
		() => PROVIDER_AGREEMENTS.find((agreement) => agreement.key === activeAgreement) ?? null,
		[activeAgreement],
	);

	useEffect(() => {
		if (isPatientLeadFlow) {
			setRole('patient');
		}

		if (!isProviderFlow) {
	
			setProviderAgreementsAccepted({
				THERAPIST_IC_AGREEMENT: false,
				THERAPIST_NDA: false,
				THERAPIST_DATA_PROCESSING_AGREEMENT: false,
			});
			setActiveAgreement(null);
			setCanAcceptActiveAgreement(false);
		}
	}, [isPatientLeadFlow, isProviderFlow]);

	useEffect(() => {
		if (!showPatientTermsModal) return;
		const container = patientTermsScrollRef.current;
		if (!container) return;
		container.scrollTop = 0;
		const scrollAvailable = container.scrollHeight > container.clientHeight + 2;
		setCanAcceptPatientTerms(!scrollAvailable);
	}, [showPatientTermsModal]);

	const openAgreement = (key: ProviderAgreementKey) => {
		setActiveAgreement(key);
		setCanAcceptActiveAgreement(Boolean(providerAgreementsAccepted[key]));
	};

	useEffect(() => {
		if (!activeAgreement) return;
		const container = agreementScrollRef.current;
		if (!container) return;
		container.scrollTop = 0;
		const scrollAvailable = container.scrollHeight > container.clientHeight + 2;
		if (!scrollAvailable) {
			setCanAcceptActiveAgreement(true);
		}
	}, [activeAgreement]);

	const handleAgreementScroll = () => {
		const container = agreementScrollRef.current;
		if (!container) return;
		const reachedBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 8;
		if (reachedBottom) {
			setCanAcceptActiveAgreement(true);
		}
	};

	const acceptActiveAgreement = () => {
		if (!activeAgreement || !canAcceptActiveAgreement) return;
		setProviderAgreementsAccepted((prev) => ({ ...prev, [activeAgreement]: true }));
		setActiveAgreement(null);
	};

	const openPatientTermsModal = () => {
		setShowPatientTermsModal(true);
	};

	const handlePatientTermsScroll = () => {
		const container = patientTermsScrollRef.current;
		if (!container) return;
		const reachedBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 8;
		if (reachedBottom) {
			setCanAcceptPatientTerms(true);
		}
	};

	const acceptPatientTermsFromModal = () => {
		if (!canAcceptPatientTerms) return;
		setAcceptedTerms(true);
		setShowPatientTermsModal(false);
	};





	// const requestOtp = async () => {
	// 	if (!isProviderFlow && !acceptedTerms) {
	// 		setError('Please accept Terms & Conditions to continue.');
	// 		return;
	// 	}

	// 	if (isProviderFlow && !isAadhaarVerified) {
	// 		setError('Please complete Aadhaar verification to continue.');
	// 		return;
	// 	}

	// 	if (isProviderFlow && !allProviderAgreementsAccepted) {
	// 		setError('Please read and accept all provider legal agreements to continue.');
	// 		return;
	// 	}

	// 	setError(null);
	// 	setLoading(true);
	// 	setDevOtp(null);
	// 	try {
	// 		const result = await signupWithPhone(
	// 			phone.trim(),
	// 			isCertificationContext
	// 				? { name: name.trim(), role: 'learner' }
	// 				: { name: name.trim(), role: isPatientLeadFlow ? 'patient' : role },
	// 		);
	// 		setOtpSent(true);
	// 		setDevOtp(result.devOtp || null);
	// 	} catch (err) {
	// 		setError(getApiErrorMessage(err, 'Failed to send OTP'));
	// 	} finally {
	// 		setLoading(false);
	// 	}
	// };

	
const requestOtp = async () => {
  if (!phone.trim()) {
    setError('Please enter phone number.');
    return;
  }

  if (!name.trim()) {
    setError('Please enter full name.');
    return;
  }

  if (role === 'patient' && !acceptedTerms) {
    setError('Please accept Terms & Conditions.');
    return;
  }


  setError(null);
  setLoading(true);

  try {
    const result = await signupWithPhone(phone.trim(), {
      name: name.trim(),
      role: role === 'clinic' || role === 'corporate' ? 'patient' : role,
    });

    setOtpSent(true);
    setDevOtp(result.devOtp || null);
  } catch (err) {
    setError(getApiErrorMessage(err, 'Failed to send OTP'));
  } finally {
    setLoading(false);
  }
};
	
	useEffect(() => {
		const query = new URLSearchParams(location.search);
		const prefillPhone = query.get('phone');
		const reason = query.get('reason');

		if (prefillPhone && !phone) {
			setPhone(prefillPhone);
		}

		if (reason === 'terms' && !otpSent && !error) {
			setError('Please review and accept Terms & Conditions to complete registration.');
		}
	}, [location.search, phone, otpSent, error]);

	const resolveReturnTo = (): string => {
		const qp = new URLSearchParams(location.search);
		return qp.get('returnTo') || qp.get('next') || window.location.pathname || '/';
	};

const verifyOtp = async () => {
  const acceptedDocuments = [
    ...(role === 'therapist' && providerAgreementsAccepted.THERAPIST_IC_AGREEMENT ? ['THERAPIST_IC_AGREEMENT'] : []),
    ...(role === 'therapist' && providerAgreementsAccepted.THERAPIST_NDA ? ['THERAPIST_NDA'] : []),
    ...(role === 'therapist' && providerAgreementsAccepted.THERAPIST_DATA_PROCESSING_AGREEMENT ? ['THERAPIST_DATA_PROCESSING_AGREEMENT'] : []),
  ];

  setError(null);
  setLoading(true);

  try {
    const result = await verifyPhoneSignupOtp(phone.trim(), otp.trim(), {
      acceptedTerms: role === 'therapist' ? allProviderAgreementsAccepted : acceptedTerms,
      acceptedDocuments,
      nri_declared: nriConsent.nri_declared,
      nri_tos_accepted: nriConsent.nri_tos_accepted,
      nri_tos_accepted_at: nriConsent.nri_tos_accepted_at || undefined,
    });

    await checkAuth({ force: true });
    setVerifiedUser(result.user);
    setSignupStep(4);
  } catch (err) {
    setError(getApiErrorMessage(err, 'OTP verification failed'));
  } finally {
    setLoading(false);
  }
};

const completeProfileAndContinue = async () => {
  if (!name.trim()) {
    setError('Please enter your full name.');
    return;
  }

  setError(null);
  setLoading(true);

  try {
    // TODO: profile update API
    // await updatePatientProfile({
    //   name,
    //   email,
    //   dob,
    //   gender,
    //   preferredLanguage: language,
    //   city,
    // });

    if (isPatientLeadFlow) {
      navigate('/patient/onboarding/preferences', {
        replace: true,
      });
      return;
    }

    const postLoginRoute = getPostLoginRoute(verifiedUser);

    navigate(postLoginRoute, {
      replace: true,
    });

  } catch (err) {
    setError(
      getApiErrorMessage(err, 'Profile completion failed')
    );
  } finally {
    setLoading(false);
  }
};

const completeProviderRegistration = async () => {
  if (!providerEmail.trim()) {
    setError('Please enter provider email.');
    return;
  }

  if (!allProviderAgreementsAccepted) {
  setError('Please accept all provider agreements.');
  return;
}

  if (!providerRegistrationNumber.trim()) {
    setError('Please enter RCI/NMC registration number.');
    return;
  }

  if (!providerCredentialScreenshot) {
    setError('Please upload today screenshot from RCI/NMC verification page.');
    return;
  }

  if (!latestCredentialsValid) {
    setError('Please confirm latest credentials are valid.');
    return;
  }

  setError(null);
  setLoading(true);

  try {
    await providerRegister({
      fullName: name.trim(),
      email: providerEmail.trim(),
      registrationNum: providerRegistrationNumber.trim(),
      registrationType: 'RCI',
      professionalType: 'THERAPIST',
      highestQual: 'Not provided',
      yearsExperience: 0,
      specializations: selectedSpecialization ? [selectedSpecialization] : [],
      languages: [language || 'English'],
      hourlyRate: 0,
      latestCredentialsValid,
      credentialScreenshot: providerCredentialScreenshot,
    });
await checkAuth({ force: true });

navigate('/provider/plans', { replace: true });
  } catch (err) {
    setError(getApiErrorMessage(err, 'Provider registration failed'));
  } finally {
    setLoading(false);
  }
};
	

	return (
		<div className="relative min-h-screen overflow-hidden">
  <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
    
    {/* LEFT TEXT SECTION */}
    <section className="hidden lg:flex flex-col justify-center px-16 xl:px-24 animate-fadeIn">
      <blockquote className="max-w-2xl font-serif text-4xl font-light leading-[1.15] text-white sm:text-5xl lg:text-6xl">
        You&rsquo;re <span className="font-semibold text-gentle-blue">not alone</span>.
        <br />
        <span className="mt-2 inline-block">
          Let&rsquo;s take this <span className="font-semibold text-calm-sage">together</span>.
        </span>
      </blockquote>

      <p className="mt-8 max-w-sm text-base italic text-white/90 animate-fadeInUp">
        Choose growth, one step at a time.
      </p>
    </section>

    {/* RIGHT SIGNUP FORM */}
    <section className="flex items-center justify-center px-4 py-10">
   <div className="responsive-container py-6 sm:py-10">
				<div className="mx-auto w-full max-w-lg rounded-3xl border border-calm-sage/20 bg-wellness-surface p-5 shadow-soft-md sm:p-8">
					<div className="mb-3">
						<Link to="/" className="text-sm text-calm-sage underline underline-offset-2 hover:text-wellness-text">
							Back to Home
						</Link>
					</div>
					<h1 className="text-2xl font-semibold text-wellness-text sm:text-3xl">Create your account</h1>
					{/* <p className="mt-2 text-sm text-wellness-muted sm:text-base">
						{isCertificationContext
							? 'Register for certification using phone number and OTP.'
							: 'Register using phone number and OTP.'}
					</p> */}

		<div className="mt-6 space-y-5">

  {signupStep === 1 ? (
    <div>
      {/* <h2 className="text-xl font-bold text-wellness-text">Get started</h2> */}
      <p className="mt-1 text-sm text-wellness-muted">
        Choose your role to begin registration
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {[
  {
    value: "patient",
    label: "Patient",
    desc: "Seeking mental wellness support",
    icon: "👤",
  },
  {
    value: "therapist",
    label: "Provider",
    desc: "Psychologist · Psychiatrist · Therapist · Coach",
    icon: "🧑‍⚕️",
  },
  {
    value: "corporate",
    label: "Corporate",
    desc: "Employee with corporate Client ID",
    icon: "🏢",
  },
  {
    value: "clinic",
    label: "MyDigitalClinic",
    desc: "Clinic user with Client ID",
    icon: "🏥",
  },
].map((item) => (
          <button
            key={item.value}
            type="button"
           onClick={() => {
  setRole(item.value as SignupRole);

  if (item.value === 'therapist') {
    setSelectedSpecialization('clinical_psychologist');
  }

  setSignupStep(2);
}}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-calm-sage hover:shadow-md"
          >
            <div className="text-3xl">{item.icon}</div>
            <h3 className="mt-3 text-lg font-bold text-wellness-text">
              {item.label}
            </h3>
            <p className="mt-1 text-sm text-wellness-muted">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  ) : null}


  {signupStep === 2 && (
  <div>
    <button
      type="button"
      onClick={() => setSignupStep(1)}
      className="mb-4 text-sm text-wellness-muted hover:text-calm-sage"
    >
      ← Back
    </button>

    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="rounded-xl  p-6 text-center">
        <div className="text-2xl">
          {role === 'patient' ? '👤' : role === 'therapist' ? '🧠' : role === 'corporate' ? '🏢' : '🏥'}
        </div>

        <h3 className="mt-2 text-sm font-bold text-blue-900">
          {role === 'therapist'
            ? selectedSpecialization
              ? selectedSpecialization.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              : 'Provider'
            : role === 'patient'
              ? 'Patient'
              : role === 'corporate'
                ? 'Corporate'
                : 'MyDigitalClinic'}
        </h3>

        <p className="mt-1 text-xs text-wellness-muted">
          {role === 'therapist' ? 'RCI/NMC registered' : 'MANAS360 account'}
        </p>
      </div>

      <p className="mt-3 text-xs text-center text-wellness-muted">
        Discover → Plans → Profile
      </p>

      <Button
        type="button"
        fullWidth
        className="mt-3 min-h-[44px]"
        onClick={() => setSignupStep(3)}
      >
        + Join Now
      </Button>
    </div>
  </div>
)}

  {signupStep === 3 ? (
  <div>
    <button
      type="button"
      onClick={() => setSignupStep(2)}
      className="mb-5 text-sm text-wellness-muted hover:text-calm-sage"
    >
      ← Back
    </button>

    <h2 className="text-xl font-bold text-wellness-text">Verify your phone</h2>

    {!otpSent ? (
      <>
        <Input
          id="signup-name"
          label="Full Name"
          placeholder="Enter your full name"
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

        {role === 'patient' && (
          <label className="mt-4 flex items-start gap-2 text-sm text-wellness-text">
            <input
              type="checkbox"
              checked={acceptedTerms}
              readOnly
              onClick={(event) => {
                event.preventDefault();
                openPatientTermsModal();
              }}
            />
            <span>
              I agree to the Terms of Service, Privacy Policy, and consent to processing of my data.
            </span>
          </label>
        )}

        <Button
          type="button"
          fullWidth
          loading={loading}
          className="mt-4 min-h-[48px]"
          onClick={requestOtp}
        >
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </Button>
      </>
    ) : (
      <>
        <p className="mt-1 text-sm text-wellness-muted">
          We sent a 6-digit OTP to {phone}
        </p>

        <Input
          id="signup-otp"
          label="Enter OTP"
          inputMode="numeric"
          pattern="\\d{6}"
          maxLength={6}
          autoComplete="one-time-code"
          placeholder="6-digit OTP"
          value={otp}
          onChange={(event) =>
            setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
          }
          required
        />

        <Button
          type="button"
          fullWidth
          loading={loading}
          className="mt-4 min-h-[48px]"
          onClick={verifyOtp}
        >
          {loading ? 'Verifying OTP...' : 'Verify OTP'}
        </Button>

        <button
          type="button"
          onClick={requestOtp}
          className="mt-4 w-full text-sm text-wellness-muted hover:text-calm-sage"
        >
          Didn&apos;t receive? Resend OTP
        </button>
      </>
    )}
  </div>
) : null}

{signupStep === 4 ? (
  <div>
    <button
      type="button"
      onClick={() => setSignupStep(3)}
      className="mb-5 text-sm text-wellness-muted hover:text-calm-sage"
    >
      ← Back
    </button>

    {role === 'patient' ? (
      <>
        <h2 className="text-xl font-bold text-wellness-text">Complete your profile</h2>

        <div className="mt-5 space-y-4">
          <Input id="signup-name" label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input id="signup-email" label="Email optional" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <Input id="dob" label="Date of birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />

          <Input id="city" label="City" value={city} onChange={(e) => setCity(e.target.value)} required />

          <Button type="button" fullWidth loading={loading} onClick={completeProfileAndContinue}>
            Complete registration
          </Button>
        </div>
      </>
    ) : (
      <>
        <h2 className="text-xl font-bold text-wellness-text">Provider verification</h2>

        <div className="mt-5 space-y-4">
          <Input id="provider-email" label="Email" type="email" value={providerEmail} onChange={(e) => setProviderEmail(e.target.value)} required />
          <Input id="provider-registration-number" label="RCI/NMC Number" value={providerRegistrationNumber} onChange={(e) => setProviderRegistrationNumber(e.target.value)} required />

          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setProviderCredentialScreenshot(e.target.files?.[0] || null)}
            className="w-full rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm"
          />

          <label className="flex items-start gap-2 text-sm text-wellness-text">
            <input checked={latestCredentialsValid} onChange={(e) => setLatestCredentialsValid(e.target.checked)} type="checkbox" />
            <span>Latest credentials are valid</span>
          </label>

          {PROVIDER_AGREEMENTS.map((agreement) => (
            <button
              key={agreement.key}
              type="button"
              onClick={() => openAgreement(agreement.key)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left text-sm"
            >
              {agreement.label} — {providerAgreementsAccepted[agreement.key] ? 'Accepted' : 'Read & Accept'}
            </button>
          ))}

          <Button type="button" fullWidth loading={loading} onClick={completeProviderRegistration}>
            Submit provider registration
          </Button>
        </div>
      </>
    )}
  </div>
) : null}

</div>

					{activeAgreementConfig ? (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
							<div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
								<div className="mb-3 flex items-center justify-between">
									<h2 className="text-lg font-semibold text-wellness-text">{activeAgreementConfig.label}</h2>
									<button
										type="button"
										onClick={() => setActiveAgreement(null)}
										className="rounded-md border border-slate-300 px-2 py-1 text-xs"
									>
										Close
									</button>
								</div>

								<p className="mb-2 text-xs text-wellness-muted">
									Read completely and scroll to the bottom to enable acceptance.
								</p>

								<div
									ref={agreementScrollRef}
									onScroll={handleAgreementScroll}
									className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700"
								>
									{activeAgreementConfig.sections.map((section, idx) => (
										<p key={`${activeAgreementConfig.key}-${idx}`} className="mb-3 last:mb-0">{section}</p>
									))}
								</div>

								<div className="mt-4 flex justify-end gap-2">
									<button
										type="button"
										onClick={() => setActiveAgreement(null)}
										className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
									>
										Cancel
									</button>
									<button
										type="button"
										onClick={acceptActiveAgreement}
										disabled={!canAcceptActiveAgreement}
										className="rounded-lg bg-calm-sage px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
									>
										I have read and agree
									</button>
								</div>
							</div>
						</div>
					) : null}

					{showPatientTermsModal ? (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
							<div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
								<div className="mb-3 flex items-center justify-between">
									<h2 className="text-lg font-semibold text-wellness-text">Patient Terms & Conditions</h2>
									<button
										type="button"
										onClick={() => setShowPatientTermsModal(false)}
										className="rounded-md border border-slate-300 px-2 py-1 text-xs"
									>
										Close
									</button>
								</div>

								<p className="mb-2 text-xs text-wellness-muted">
									Read completely and scroll to the bottom to enable acceptance.
								</p>

								<div
									ref={patientTermsScrollRef}
									onScroll={handlePatientTermsScroll}
									className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700"
								>
									{PATIENT_TERMS_SECTIONS.map((section, idx) => (
										<p key={`patient-terms-${idx}`} className="mb-3 last:mb-0">{idx + 1}. {section}</p>
									))}
								</div>

								<div className="mt-4 flex justify-end gap-2">
									<button
										type="button"
										onClick={() => setShowPatientTermsModal(false)}
										className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
									>
										Cancel
									</button>
									<button
										type="button"
										onClick={acceptPatientTermsFromModal}
										disabled={!canAcceptPatientTerms}
										className="rounded-lg bg-calm-sage px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
									>
										I have read and agree
									</button>
								</div>
							</div>
						</div>
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
    </section>


			</div>
		</div>
	);
}
