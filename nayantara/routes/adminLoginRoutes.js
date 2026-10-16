const express = require("express");
const router = express.Router();
const { adminLogin, adminName, getAllData } = require('../models/super_admin/adminLogin');

router.post('/admin-login', adminLogin);
router.post('/admin-name', adminName);
router.get('/get-alldata', getAllData);

module.exports = router;