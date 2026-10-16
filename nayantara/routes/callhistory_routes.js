const express = require('express');
const router = express.Router();

const { getCallHistory } = require('../models/super_admin/callHistory');

router.get('/get-callhistory', getCallHistory);

module.exports = router;