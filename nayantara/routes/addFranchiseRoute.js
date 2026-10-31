const express = require('express');
const { uploadFranchiseLogo, addFranchise, deleteFranchise, getFranchise, statusDeactive, getFranchiseId, editFranchise, getStateName, getCityByStateID, getPalnPermission } = require('../models/super_admin/addFranchise');
const router = express.Router();

router.get('/get-planpermission/:id', getPalnPermission);
router.get('/get-franchise', getFranchise);
router.get('/get-franchise/:Id', getFranchiseId);
router.post('/add-franchise', addFranchise);
router.post('/franchise-logo', uploadFranchiseLogo);
router.delete('/delete-franchise/:Id', deleteFranchise);
router.post('/edit-franchise', editFranchise);
router.put('/status-franchise/:Id', statusDeactive);
router.get('/get-state', getStateName);
router.get('/get-cityByStateId/:id', getCityByStateID)

module.exports = router;