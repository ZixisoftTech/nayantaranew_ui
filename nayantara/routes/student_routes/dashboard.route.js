const express = require('express');
const router = express.Router();

const { totalActiveStudent, totalInactiveStudent, totalCallMade, totalUsage, totalAvailable, totalDepartment } = require('../../models/student/dashboard');

router.get('/active-student/:id', totalActiveStudent);
router.get('/inactive-student/:id', totalInactiveStudent);
router.get('/totalcall-made/:id', totalCallMade);
router.get('/totaluse-balance/:id', totalUsage);
router.get('/totalavailable-min/:id', totalAvailable);
router.get('/total_department/:id', totalDepartment);

module.exports = router;