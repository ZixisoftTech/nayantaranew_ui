const express = require('express');
const router = express.Router();
const { login,franchiseName } = require('../../models/franchise/login');

router.post('/login-franchise', login);
router.post('/franchisename',franchiseName);

module.exports = router;