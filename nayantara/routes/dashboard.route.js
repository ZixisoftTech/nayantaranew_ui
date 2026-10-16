const express = require('express');
const router = express.Router();

const { countFranchise, totalBalanceActiveStudent, totalUsedBalanceActicveStudent, totalStudentActive, totalUniqueDeviceName } = require('../models/super_admin/dashboard');

router.get('/franchise-count', countFranchise);
router.get('/total-balance', totalBalanceActiveStudent)
router.get('/totalused-balance', totalUsedBalanceActicveStudent);
router.get('/totalstudent-active', totalStudentActive)
router.get('/totalunique-devise', totalUniqueDeviceName)
module.exports = router;