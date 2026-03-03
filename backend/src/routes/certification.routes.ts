import { Router } from 'express';
import { getCertificationByIdController, getCertificationsController } from '../controllers/certification.controller';
import { asyncHandler } from '../middleware/validate.middleware';

const router = Router();

router.get('/', asyncHandler(getCertificationsController));
router.get('/:id', asyncHandler(getCertificationByIdController));

export default router;
