import { Router } from 'express';
import {
	createTherapistProfileController,
	getMyTherapistProfileController,
	uploadMyTherapistDocumentController,
} from '../controllers/therapist.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireTherapistRole } from '../middleware/rbac.middleware';
import {
	asyncHandler,
	uploadTherapistDocumentMiddleware,
	validateCreateTherapistProfileRequest,
	validateSessionIdParam,
	validateTherapistEarningsQuery,
	validateTherapistLeadsQuery,
	validateTherapistSessionNoteRequest,
	validateTherapistSessionHistoryQuery,
	validateUpdateTherapistSessionStatusRequest,
	validateUploadTherapistDocumentRequest,
} from '../middleware/validate.middleware';
import {
	getMyTherapistLeadsController,
	purchaseMyTherapistLeadController,
} from '../controllers/lead.controller';
import {
	getMyTherapistSessionsController,
	getMyTherapistEarningsController,
	patchMyTherapistSessionController,
	postMyTherapistSessionNoteController,
} from '../controllers/session.controller';

const router = Router();

router.post('/profile', requireAuth, requireTherapistRole, ...validateCreateTherapistProfileRequest, asyncHandler(createTherapistProfileController));
router.get('/me/profile', requireAuth, requireTherapistRole, asyncHandler(getMyTherapistProfileController));
router.get('/me/leads', requireAuth, requireTherapistRole, ...validateTherapistLeadsQuery, asyncHandler(getMyTherapistLeadsController));
router.post('/me/leads/:id/purchase', requireAuth, requireTherapistRole, ...validateSessionIdParam, asyncHandler(purchaseMyTherapistLeadController));
router.get('/me/earnings', requireAuth, requireTherapistRole, ...validateTherapistEarningsQuery, asyncHandler(getMyTherapistEarningsController));
router.get('/me/sessions', requireAuth, requireTherapistRole, ...validateTherapistSessionHistoryQuery, asyncHandler(getMyTherapistSessionsController));
router.patch('/me/sessions/:id', requireAuth, requireTherapistRole, ...validateSessionIdParam, ...validateUpdateTherapistSessionStatusRequest, asyncHandler(patchMyTherapistSessionController));
router.post('/me/sessions/:id/notes', requireAuth, requireTherapistRole, ...validateSessionIdParam, ...validateTherapistSessionNoteRequest, asyncHandler(postMyTherapistSessionNoteController));
router.post(
	'/me/documents',
	requireAuth,
	requireTherapistRole,
	uploadTherapistDocumentMiddleware,
	...validateUploadTherapistDocumentRequest,
	asyncHandler(uploadMyTherapistDocumentController),
);

export default router;
