const express = require('express');
const router = express.Router();
const { getStudentsById, getDepartmentById, planassign, getTransaction, getPlanByFranchiseId, updateStudentsById, getStudentsByFranchiseId, planAssignDepartmentId } = require('../models/super_admin/assignplan');

router.put('/update-min/:id', updateStudentsById);
router.get('/get-plans/:id', getPlanByFranchiseId);
router.get('/get-plans', getTransaction);
router.post('/plan-purchase', planassign);
router.get('/get-department/:id', getDepartmentById)
router.get('/get-studentbyfranchise', getStudentsByFranchiseId);
router.get('/get-students/:id', getStudentsById);
router.post('/planassign-departmentid', planAssignDepartmentId);

module.exports = router;