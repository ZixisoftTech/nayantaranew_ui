const express = require('express');
const router = express.Router();
const { addSubscription, statusDeactive, getSubscription, getSubscriptionById, deleteSubscriptionById, editSubscription } = require('../models/super_admin/manageSubscription');

router.get('/get-subscription', getSubscription);
router.get('/get-subscription/:id', getSubscriptionById);
router.post('/add-subscription', addSubscription);
router.put('/status-subscriptions/:id', statusDeactive);
router.delete('/delete-subscription/:id', deleteSubscriptionById);
router.post('/update-subscription', editSubscription);

module.exports = router;