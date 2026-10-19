const express = require('express');
const { studentSettings, deviceSettings } = require('../models/call_rules');
const router = express.Router();

router.get('/student-settings/:id', studentSettings);
router.get('/device-settings/:device', deviceSettings);

module.exports = router;
