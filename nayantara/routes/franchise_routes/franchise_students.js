const express = require('express');
const router = express.Router();
const { addStudents, departmentGetById, getFranchise, statusDeactive, departmentDay, getDepartmentById, getStudentsByDepartmentId, deleteStudents, getSubscription, editStudentsById, getStudentParent, getByStudentId, getCallHistoryByStudentId, getTarnsactionByStudentId, getStudentsByFranchise, getParentsByFranchise, bulkDelete, bulkDepartmentUpdate, bulkStatusUpdate, getStudentsSkipByFranchise, getParentsSkipByFranchise, deleteSkipDataStudent, deleteSkipDataParent, bulkDeleteSkipStudent, bulkDeleteSkipParent } = require('../../models/franchise/manage_students');


router.get('/student-get/:id', getByStudentId);
router.get('/department-get/:id', departmentGetById);
router.get('/get-studentparent/:id', getStudentParent);
router.post('/add-students', addStudents);
router.get('/get-franchise', getFranchise);
router.get('/get-studentsbydepartmentid', getStudentsByDepartmentId);
router.put('/status-managestudents/:id', statusDeactive);
router.get('/get-departmentday', departmentDay);
router.get('/get-department/:id', getDepartmentById);
router.delete('/delete-students/:id', deleteStudents);
router.get('/get-subscription/:id', getSubscription);
router.post('/update-students', editStudentsById);
router.get('/get-callhistroybystudentid', getCallHistoryByStudentId);
router.get('/get-transactionbystudentid', getTarnsactionByStudentId);
router.get('/get-studentsbyfranchise/:id', getStudentsByFranchise);
router.get('/get-parentsbyfranchise/:id', getParentsByFranchise);
router.post('/delete-bulkstudent', bulkDelete);
router.post('/update-bulkdepartment', bulkDepartmentUpdate);
router.post('/update-bulkstatus', bulkStatusUpdate);
router.get('/get-studentskipbyfranchise/:id', getStudentsSkipByFranchise);
router.get('/get-parentskipbyfranchise/:id', getParentsSkipByFranchise);
router.delete('/delete-skipdatastudent/:id', deleteSkipDataStudent);
router.delete('/delete-skipdataparent/:id', deleteSkipDataParent);
router.post('/delete-bulkskipstudent', bulkDeleteSkipStudent);
router.post('/delete-bulkskipparent', bulkDeleteSkipParent);

module.exports = router;