const express = require('express')
const mainController = require('../controllers/main')
const router = express.Router()


router.get('/off', mainController.off);
router.get('/test', mainController.test);
router.get('/documents', mainController.getDocuments);
router.get('/document/:id', mainController.getDocument);
router.post('/document', mainController.postDocument);
router.put('/document',  mainController.putDocument);
router.post('/file', mainController.putFile);

module.exports = router