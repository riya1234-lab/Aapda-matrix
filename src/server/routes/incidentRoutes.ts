import { Router } from 'express';
import { incidentController } from '../controllers/incidentController';
import { optionalAuthenticate, authenticate, requireRole } from '../middleware/auth';
import { uploadAudio } from '../middleware/upload';

const router = Router();

// Create incident (accessible anonymously or authenticated)
router.post('/', optionalAuthenticate, incidentController.createIncident.bind(incidentController));

// List incidents (filtered by role: operators get all, citizens get only their own)
router.get('/', optionalAuthenticate, incidentController.getIncidents.bind(incidentController));

// Get single incident details (strictly checks ownership or operator role)
router.get('/:id', optionalAuthenticate, incidentController.getIncidentById.bind(incidentController));

// Update incident status (operators & commanders only)
router.patch(
  '/:id/status',
  authenticate,
  requireRole(['OPERATOR', 'COMMANDER']),
  incidentController.updateIncidentStatus.bind(incidentController)
);

// Operator Triage Priority Review & Override
router.patch(
  '/:id/override-triage',
  authenticate,
  requireRole(['OPERATOR', 'COMMANDER']),
  incidentController.overrideTriage.bind(incidentController)
);

// Fetch real delivery telemetry events
router.get('/:id/telemetry', optionalAuthenticate, incidentController.getTelemetry.bind(incidentController));

// Update incident location
router.post('/:id/location', optionalAuthenticate, incidentController.updateLocation.bind(incidentController));

// Upload authorized emergency audio recording
router.post(
  '/:id/audio',
  optionalAuthenticate,
  uploadAudio.single('audio'),
  incidentController.uploadAudio.bind(incidentController)
);

// Stream protected emergency audio (checks authorization)
router.get('/:id/audio/:attachmentId', optionalAuthenticate, incidentController.getAudioStream.bind(incidentController));

// Record server acknowledgement
router.post('/:id/acknowledgement', optionalAuthenticate, incidentController.recordAcknowledgement.bind(incidentController));

// Inbound mesh relay intake
router.post('/relay/mesh', optionalAuthenticate, incidentController.handleMeshRelay.bind(incidentController));

export default router;
