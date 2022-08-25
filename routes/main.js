const express = require('express')
const mainController = require('../controllers/main')
const router = express.Router()


router.get('/off', mainController.off);
router.get('/test', mainController.test);
router.get('/documents', mainController.getDocuments);
router.get('/document/:id', mainController.getDocument);
router.post('/document', mainController.postDocument);
router.put('/document',  mainController.putDocument);
router.get('/dochistory/:id', mainController.getDocHistory);
router.get('/getCertDoc/:id', mainController.getCertDocument);
router.post('/verDocQR/', mainController.verDocQR);
router.post('/verifyDocument', mainController.verifyFile);

module.exports = router