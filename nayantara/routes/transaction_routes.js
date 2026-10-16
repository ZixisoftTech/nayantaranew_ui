const express = require('express');
const router = express.Router();

const { getStudentName, getDepartmentTimeSlots } = require('../models/super_admin/transaction');

router.get('/get-studentnames/:id', getStudentName);
router.get('/get-departmenttimeslots/:id', getDepartmentTimeSlots);
module.exports = router;