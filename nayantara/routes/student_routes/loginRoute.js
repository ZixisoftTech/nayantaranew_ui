const express = require('express');
const router = express.Router();

const { Login, login, studentName, Logout, studentProfile, studentProfileUpdate } = require('../../models/student/login');
const { getAvailablemin, getWebAvailbalemin, updateAvailablemin, getWebScheduleById, parentWebLoginStatus, getSchedule, gettimeSchedule, parentLoginStatus, studentLoginStatus, getTransWebById, getParentById, getTarnsition, callhistory, studentCall, updateCallStatus, studentCallEnd, getwebCallHistory, studentIssue, getStudentIssue, getStatusByStudentId, updateStudentStatus, getStudentSummary, getStudentFranchiseId } = require('../../models/student/studentplan');
const { fcmToken, jitsyLink, callMinute, fcmWebNotification } = require('../../models/student/student_fcmtoken');


router.get('/get-summarystudnet', getStudentSummary);
router.get('/get-studentissue', getStudentIssue);
router.post('/update-studentstatus', updateStudentStatus);
router.post('/get-statusbystudentid', getStatusByStudentId);
router.post('/add-studentissue', studentIssue);
router.post('/update-studentprofile', studentProfileUpdate);
router.post('/get-studentprofile', studentProfile);
router.get('/get-webavailablemin/:id', getWebAvailbalemin);
router.get('/get-webNotification/:id', fcmWebNotification);
router.get('/get-parentwebloginstatus/:id', parentWebLoginStatus);
router.get('/get-webschedule/:id', getWebScheduleById);
router.get('/get-webcallhistory/:id', getwebCallHistory);
router.get('/get-transweb/:id', getTransWebById);
router.post('/get-callminute', callMinute);
router.post('/statusupdate-callhistory', studentCallEnd);
router.post('/update-status', updateCallStatus);
router.post('/call-log', studentCall);
router.post('/student-callhistory', callhistory);
router.post('/student-logout', Logout);
router.post('/get-student/transition', getTarnsition);
router.post('/get-studentname', studentName);
router.post('/update-min', updateAvailablemin);
router.get('/jitsy-roomId', jitsyLink);
router.post('/student/login', login);
router.post('/firebase/notification', fcmToken);
router.post('/getstudent/parents', getParentById);
router.get('/get-studentstatus/:id', studentLoginStatus);
router.post('/login-student', Login)
router.post('/get-avalableminutes', getAvailablemin);
router.post('/get-studentschedule', getSchedule);
router.post('/get-timeschedule', gettimeSchedule)
router.get('/get-parentstatus', parentLoginStatus);
router.get('/getstudent-franchiseid/:id', getStudentFranchiseId);

module.exports = router;