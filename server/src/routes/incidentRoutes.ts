import { Router } from 'express';
import { incidentController } from '../controllers/incidentController';
import { optionalAuthenticate, authenticate, requireRole } from '../middleware/auth';
import { uploadAudio } from '../middleware/upload';

const router = Router();

// Create incident (accessible anonymously or authenticated)
router.post('/', optionalAuthenticate, incidentController.createIncident.bind(incidentController));

// List incidents (filtered by role)
router.get('/', optionalAuthenticate, incidentController.getIncidents.bind(incidentController));

// Get single incident details
router.get('/:id', optionalAuthenticate, incidentController.getIncidentById.bind(incidentController));

// Update incident status (operators & commanders)
router.patch(
  '/:id/status',
  authenticate,
  requireRole(['OPERATOR', 'COMMANDER']),
  incidentController.updateIncidentStatus.bind(incidentController)
);

// Update incident location
router.post('/:id/location', optionalAuthenticate, incidentController.updateLocation.bind(incidentController));

// Upload authorized emergency audio recording
router.post(
  '/:id/audio',
  optionalAuthenticate,
  uploadAudio.single('audio'),
  incidentController.uploadAudio.bind(incidentController)
);

// Stream protected emergency audio
router.get('/:id/audio/:attachmentId', incidentController.getAudioStream.bind(incidentController));

// Record server acknowledgement
router.post('/:id/acknowledgement', incidentController.recordAcknowledgement.bind(incidentController));

// Inbound mesh relay intake
router.post('/relay/mesh', incidentController.handleMeshRelay.bind(incidentController));

export default router;
