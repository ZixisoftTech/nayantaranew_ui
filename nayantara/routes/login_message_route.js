const express = require('express');
const router = express.Router();

const { getMessage, addMessage, updateMessage } = require('../models/super_admin/login_message');

router.post('/update-message', updateMessage);
router.get('/get-message', getMessage);
router.post('/add-message', addMessage);

module.exports = router;