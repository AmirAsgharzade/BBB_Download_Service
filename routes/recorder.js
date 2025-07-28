const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authMiddleware')

const recorderController = require('../controllers/recorderController');


router.post('/Record-Meeting',authenticateJWT,recorderController.recordMeeting)
router.post('/Record-status',authenticateJWT,recorderController.recordStatus)
router.post('/get-recorded-file',authenticateJWT,recorderController.getRecordedFile)
router.delete('/delete-recorded-file',authenticateJWT,recorderController.deleteRecordedFile)
router.post('/get-proccess-status',authenticateJWT,recorderController.getProcessStatus)
router.post('/Preview',recorderController.previewVideo)

module.exports = router