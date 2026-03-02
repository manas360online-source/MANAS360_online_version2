import type { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { AppError } from '../middleware/error.middleware';
import { sendSuccess } from '../utils/response';
import {
	chatWithAi,
	createMoodLog,
	getMoodHistory,
	getPatientDashboard,
	getProviderById,
	getSessionDocumentPayload,
	getSessionDetail,
	getSessionHistory,
	getUpcomingSessions,
	initiateSessionBooking,
	listNotifications,
	listProviders,
	markNotificationRead,
	submitAssessment,
	verifySessionPaymentAndCreateSession,
} from '../services/patient-v1.service';

const renderPdfBuffer = async (write: (doc: any) => void): Promise<Buffer> =>
	new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 48 });
		const chunks: Buffer[] = [];
		doc.on('data', (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);
		write(doc);
		doc.end();
	});

const authUserId = (req: Request): string => {
	const userId = req.auth?.userId;
	if (!userId) throw new AppError('Authentication required', 401);
	return userId;
};

export const getPatientDashboardController = async (req: Request, res: Response): Promise<void> => {
	const data = await getPatientDashboard(authUserId(req));
	sendSuccess(res, data, 'Patient dashboard fetched');
};

export const listProvidersController = async (req: Request, res: Response): Promise<void> => {
	const result = await listProviders({
		specialization: typeof req.query.specialization === 'string' ? req.query.specialization : undefined,
		language: typeof req.query.language === 'string' ? req.query.language : undefined,
		minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
		maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
		page: req.query.page ? Number(req.query.page) : 1,
		limit: req.query.limit ? Number(req.query.limit) : 10,
	});
	sendSuccess(res, result, 'Providers fetched');
};

export const getProviderByIdController = async (req: Request, res: Response): Promise<void> => {
	const id = String(req.params.id || '').trim();
	if (!id) throw new AppError('provider id is required', 422);
	const provider = await getProviderById(id);
	sendSuccess(res, provider, 'Provider fetched');
};

export const bookSessionController = async (req: Request, res: Response): Promise<void> => {
	const userId = authUserId(req);
	const providerId = String(req.body.providerId || '').trim();
	const scheduledAt = new Date(req.body.scheduledAt);
	if (!providerId) throw new AppError('providerId is required', 422);
	if (Number.isNaN(scheduledAt.getTime())) throw new AppError('scheduledAt must be a valid datetime', 422);

	const result = await initiateSessionBooking(userId, {
		providerId,
		scheduledAt,
		durationMinutes: req.body.durationMinutes ? Number(req.body.durationMinutes) : undefined,
		amountMinor: req.body.amountMinor ? Number(req.body.amountMinor) : undefined,
	});

	sendSuccess(res, result, 'Booking initiated', 201);
};

export const verifyPaymentController = async (req: Request, res: Response): Promise<void> => {
	const userId = authUserId(req);
	const razorpay_order_id = String(req.body.razorpay_order_id || '').trim();
	const razorpay_payment_id = String(req.body.razorpay_payment_id || '').trim();
	const razorpay_signature = String(req.body.razorpay_signature || '').trim();
	if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
		throw new AppError('razorpay_order_id, razorpay_payment_id and razorpay_signature are required', 422);
	}
	const result = await verifySessionPaymentAndCreateSession(userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature });
	sendSuccess(res, result, 'Payment verified and session confirmed');
};

export const upcomingSessionsController = async (req: Request, res: Response): Promise<void> => {
	const data = await getUpcomingSessions(authUserId(req));
	sendSuccess(res, data, 'Upcoming sessions fetched');
};

export const sessionHistoryController = async (req: Request, res: Response): Promise<void> => {
	const data = await getSessionHistory(authUserId(req));
	sendSuccess(res, data, 'Session history fetched');
};

export const sessionDetailController = async (req: Request, res: Response): Promise<void> => {
	const sessionId = String(req.params.id || '').trim();
	if (!sessionId) throw new AppError('session id is required', 422);
	const data = await getSessionDetail(authUserId(req), sessionId);
	sendSuccess(res, data, 'Session detail fetched');
};

export const sessionSummaryPdfController = async (req: Request, res: Response): Promise<void> => {
	const sessionId = String(req.params.id || '').trim();
	if (!sessionId) throw new AppError('session id is required', 422);

	const payload = await getSessionDocumentPayload(authUserId(req), sessionId);
	const pdf = await renderPdfBuffer((doc) => {
		doc.fontSize(20).font('Helvetica-Bold').text('MANAS360 Session Summary', { align: 'center' });
		doc.moveDown(0.6);
		doc.fontSize(10).font('Helvetica').fillColor('#444').text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
		doc.fillColor('#000');

		doc.moveDown(0.8);
		doc.fontSize(12).font('Helvetica-Bold').text('Session Information');
		doc.fontSize(10).font('Helvetica').text(`Booking Reference: ${payload.bookingReferenceId}`);
		doc.text(`Session ID: ${payload.sessionId}`);
		doc.text(`Date & Time: ${new Date(payload.scheduledAt).toLocaleString()}`);
		doc.text(`Status: ${payload.status}`);
		doc.text(`Duration: ${payload.durationMinutes} minutes`);
		doc.text(`Payment Status: ${payload.paymentStatus}`);

		doc.moveDown(0.8);
		doc.fontSize(12).font('Helvetica-Bold').text('Care Team');
		doc.fontSize(10).font('Helvetica').text(`Patient: ${payload.patient.name}`);
		if (payload.patient.email) doc.text(`Patient Email: ${payload.patient.email}`);
		doc.text(`Provider: ${payload.therapist.name}`);
		doc.text(`Provider Role: ${payload.therapist.role || 'therapist'}`);

		doc.moveDown(0.8);
		doc.fontSize(12).font('Helvetica-Bold').text('Session Notes');
		doc.fontSize(10).font('Helvetica');
		if (payload.notes) {
			doc.text(payload.notes, { width: 500 });
			if (payload.noteUpdatedAt) {
				doc.moveDown(0.5);
				doc.fontSize(9).fillColor('#666').text(`Last updated: ${new Date(payload.noteUpdatedAt).toLocaleString()}`);
				doc.fillColor('#000').fontSize(10);
			}
		} else {
			doc.text('No therapist notes are available for this session yet.');
		}
	});

	const fileName = `session-${payload.bookingReferenceId || payload.sessionId}.pdf`;
	res.setHeader('Content-Type', 'application/pdf');
	res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
	res.status(200).send(pdf);
};

export const sessionInvoicePdfController = async (req: Request, res: Response): Promise<void> => {
	const sessionId = String(req.params.id || '').trim();
	if (!sessionId) throw new AppError('session id is required', 422);

	const payload = await getSessionDocumentPayload(authUserId(req), sessionId);
	if (!['PAID', 'CAPTURED'].includes(payload.paymentStatus)) {
		throw new AppError('Invoice is available only for paid sessions', 409);
	}

	const amount = (payload.sessionFeeMinor / 100).toFixed(2);
	const taxRate = 0.18;
	const subtotal = payload.sessionFeeMinor / 100;
	const tax = subtotal * taxRate;
	const total = subtotal + tax;

	const pdf = await renderPdfBuffer((doc) => {
		doc.fontSize(20).font('Helvetica-Bold').text('MANAS360 Invoice', { align: 'center' });
		doc.moveDown(0.8);
		doc.fontSize(10).font('Helvetica').text(`Invoice No: INV-${payload.bookingReferenceId}`);
		doc.text(`Booking Reference: ${payload.bookingReferenceId}`);
		doc.text(`Session Date: ${new Date(payload.scheduledAt).toLocaleString()}`);
		doc.text(`Issued On: ${new Date().toLocaleDateString()}`);

		doc.moveDown(0.8);
		doc.fontSize(12).font('Helvetica-Bold').text('Billed To');
		doc.fontSize(10).font('Helvetica').text(payload.patient.name);
		if (payload.patient.email) doc.text(payload.patient.email);

		doc.moveDown(0.8);
		doc.fontSize(12).font('Helvetica-Bold').text('Service Details');
		doc.fontSize(10).font('Helvetica').text(`Provider: ${payload.therapist.name}`);
		doc.text(`Therapy Session (${payload.durationMinutes} mins)`);
		doc.text(`Amount: INR ${amount}`);

		doc.moveDown(0.8);
		doc.fontSize(12).font('Helvetica-Bold').text('Payment Breakdown');
		doc.fontSize(10).font('Helvetica').text(`Subtotal: INR ${subtotal.toFixed(2)}`);
		doc.text(`Tax (18%): INR ${tax.toFixed(2)}`);
		doc.font('Helvetica-Bold').text(`Total: INR ${total.toFixed(2)}`);
		doc.font('Helvetica').text(`Payment Status: ${payload.paymentStatus}`);
	});

	const fileName = `invoice-${payload.bookingReferenceId || payload.sessionId}.pdf`;
	res.setHeader('Content-Type', 'application/pdf');
	res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
	res.status(200).send(pdf);
};

export const submitAssessmentController = async (req: Request, res: Response): Promise<void> => {
	const userId = authUserId(req);
	const type = String(req.body.type || '').trim();
	if (!type) throw new AppError('type is required', 422);
	const result = await submitAssessment(userId, {
		type,
		score: req.body.score !== undefined ? Number(req.body.score) : undefined,
		answers: Array.isArray(req.body.answers) ? req.body.answers.map((a: any) => Number(a)) : undefined,
	});
	sendSuccess(res, result, 'Assessment submitted', 201);
};

export const createMoodController = async (req: Request, res: Response): Promise<void> => {
	const userId = authUserId(req);
	const result = await createMoodLog(userId, { mood: Number(req.body.mood), note: req.body.note ? String(req.body.note) : undefined });
	sendSuccess(res, result, 'Mood logged', 201);
};

export const moodHistoryController = async (req: Request, res: Response): Promise<void> => {
	const data = await getMoodHistory(authUserId(req));
	sendSuccess(res, data, 'Mood history fetched');
};

export const aiChatController = async (req: Request, res: Response): Promise<void> => {
	const userId = authUserId(req);
	const result = await chatWithAi(userId, { message: String(req.body.message || '') });
	sendSuccess(res, result, 'AI response generated');
};

export const listNotificationsController = async (req: Request, res: Response): Promise<void> => {
	const data = await listNotifications(authUserId(req));
	sendSuccess(res, data, 'Notifications fetched');
};

export const markNotificationReadController = async (req: Request, res: Response): Promise<void> => {
	const userId = authUserId(req);
	const id = String(req.params.id || '').trim();
	if (!id) throw new AppError('notification id is required', 422);
	const data = await markNotificationRead(userId, id);
	sendSuccess(res, data, 'Notification marked as read');
};
