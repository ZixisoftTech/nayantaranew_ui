// Filterable list endpoints (models/lists.js). Mounted at the app root BEFORE the
// legacy routers so these paths take precedence; the legacy handlers stay in place.
const express = require('express');
const router = express.Router();
const lists = require('../models/lists');

router.get('/api/get-callhistory', lists.adminCallHistory);
router.get('/api/get-plans', lists.adminTransactions);
router.get('/api/get-studentbyfranchise', lists.assignPlanStudents);
router.get('/managestudents/get-studentsbydepartmentid', lists.adminStudents);
router.get('/parent/getparent-studentid', lists.adminParents);
router.get('/managestudents/get-callhistroybystudentid', lists.franchiseCallHistory);
router.get('/managestudents/get-transactionbystudentid', lists.franchiseTransactions);

router.get('/api/get-department', lists.adminDepartments);
router.get('/subscription/get-subscription', lists.adminSubscriptions);

module.exports = router;
