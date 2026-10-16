const express = require('express');
const router = express.Router();

const { phonepePayement, payementStatus } = require('../../models/parent/payement');

router.post('/phonepe-payement', phonepePayement);
router.post('/payement-status/:id', payementStatus);

module.exports = router;