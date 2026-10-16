const express = require('express');
const router = express.Router();
const { search, student, parent, franchise, department } = require('../models/lookup');
const { insights } = require('../models/insights');
const { screenMetrics } = require('../models/screen_metrics');

router.get('/lookup/search', search);
router.get('/lookup/student/:id', student);
router.get('/lookup/parent/:id', parent);
router.get('/lookup/franchise/:id', franchise);
router.get('/lookup/department/:id', department);
router.get('/insights', insights);
router.get('/screen-metrics', screenMetrics);

module.exports = router;
