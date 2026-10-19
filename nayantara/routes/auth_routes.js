const express = require('express');
const { portalLogin, me, schoolToken, listSubAdmins, createSubAdmin, updateSubAdmin, deleteSubAdmin } = require('../models/auth');
const router = express.Router();

router.post('/portal-login', portalLogin);
router.get('/me', me);
router.post('/school-token', schoolToken);
router.get('/sub-admins', listSubAdmins);
router.post('/sub-admins', createSubAdmin);
router.put('/sub-admins/:id', updateSubAdmin);
router.delete('/sub-admins/:id', deleteSubAdmin);

module.exports = router;
