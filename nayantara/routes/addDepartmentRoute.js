const express = require("express");
const { getFranchise, addDepartment, statusChange, getDepartment, deleteDepartment, getDepartmentId, editDepartment, getDepartmentDay } = require("../models/super_admin/addDepartment");
const { allotNow } = require("../models/call_rules");
const router = express.Router();

router.get('/get-days/:id', getDepartmentDay);
router.get('/get-franchiseid', getFranchise);
router.get('/get-departmentbyid/:id', getDepartmentId);
router.get('/get-department', getDepartment);
router.put('/status-department/:id', statusChange)
router.post('/add-department', addDepartment);
router.post('/update-department', editDepartment);
router.delete('/delete-department/:id', deleteDepartment);
router.post('/allot-now/:id', allotNow);

module.exports = router;
