const connect = require('../../config/db');
const multer = require('multer');
var FCM = require('fcm-node');
const axios = require('axios');
const serviceAccount = require('./service-account.json');
const { callType, callBlockReason, allowedCallSeconds } = require('../call_rules');
const { google } = require('googleapis');
const { TIMEOUT } = require('node:dns');

const fileStorage = multer.diskStorage({
    destination: (req, res, cb) => {
        try {
            cb(null, "uploads")
        } catch (e) {
            cb(e, false)
        }
    }, filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})
const Upload = multer({
    storage: fileStorage,
}).single("image")

async function getCurrentTime() {
    // const currentDate = new Date();
    // const currentHour = String(currentDate.getHours()).padStart(2, '0');
    // const currentMinute = String(currentDate.getMinutes()).padStart(2, '0');
    // const currentSecond = String(currentDate.getSeconds()).padStart(2, '0');

    // const currentTime = currentHour + ':' + currentMinute + ':' + currentSecond;
    const now = new Date();
    const options = { timeZone: 'Asia/Kolkata', hour12: false };
    const timeString = now.toLocaleString('en-IN', options).split(', ')[1];
    const [hourString, minuteString, secondString] = timeString.split(':');
    const hours = parseInt(hourString);
    const minutes = parseInt(minuteString);
    const second = parseInt(secondString);
    // let time = hours + ':' + minutes;
    let currentTime = hours + ':' + ('0' + minutes).slice(-2) + ":" + second;
    return currentTime;
}

// const fcmToken = (req, res, callback) => {
//     try {
//         Upload(req, res, (err) => {
//             if (err) {
//                 return res.status(401).send({ error: false, message: "Multer not working" });
//             } else {
//                 const { id } = req.body;
//                 const status = 0;
//                 if (id == 0) {
//                     return res.status(201).send({ error: true, message: "Please insert id" });
//                 } else {
//                     connect.query('SELECT * From tbl_parents WHERE id = ?', [id], function (error, findparent, fields) {
//                         if (findparent == 0) {
//                             return res.send({ error: true, message: "incorrect parent Id", data: null })
//                         } else {
//                             connect.query('SELECT * From tbl_student WHERE id = ?', [findparent[0].student_id], function (error, findstudent, fields) {
//                                 if (findstudent == 0) {
//                                     return res.status(200).send({ error: true, message: "Student not found", data: null });
//                                 } else {
//                                     var now = new Date();
//                                     var y = now.getFullYear();
//                                     var m = now.getMonth();
//                                     var d = now.getDate();
//                                     var h = now.getHours();
//                                     var i = now.getMinutes();
//                                     var s = now.getSeconds();
//                                     const c = generateString(6);
//                                     const roomId = 'nayantara' + y + m + d + h + i + s + c + findstudent[0].id + id;

//                                     const serverKey = 'AAAAJQN69I0:APA91bHXUVP4OT_GmemsVlhKFjBa7oKm9fWnQ_jJ9RG__vYe4j4r06uLrbwjjDKAcEtcg3-9J1lXZIFNhN66jtlTtQ3dUT7QHUSgS7a6ZbDR2ZEi05jEvY6iOPpz-sU5pVfLZviiW7z1';
//                                     const fcm = new FCM(serverKey);
//                                     const message = {
//                                         to: findparent[0].fcm_token,
//                                         collapse_key: `TEST`,
//                                         priority: "high",
//                                         notification: {
//                                             title: ` Nayantrarabyspacs`,
//                                             body: '' + findstudent[0].name + ' is calling on nayantara app',
//                                             sound: 'http://nayantarabyspacs.co.in/assets/notificationsound.mp3',
//                                             delivery_receipt_requested: true
//                                         },
//                                         data: {
//                                             message: roomId,
//                                             type: ""
//                                         }
//                                     };
//                                     if (findparent[0].total_talktime == 0 && findstudent[0].total_talktime == 0) {
//                                         return res.status(200).send({ error: true, message: "Minutes not available" })
//                                     } else {
//                                         const weekend = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Satuarday"];
//                                         var now = new Date();
//                                         var day = weekend[now.getDay()];
//                                         const currentTime = getCurrentTime();
//                                         currentTime.then((value) => {
//                                             const stringValue = String(value);
//                                             connect.query('SELECT * From tbl_department_timeslots WHERE tbl_department_timeslots.department_id = "' + findstudent[0].department_id + '" AND tbl_department_timeslots.day = "' + day + '" AND tbl_department_timeslots.start_time <= "' + stringValue + '" and tbl_department_timeslots.end_time >= "' + stringValue + '"', function (error, results, fields) {
//                                                 if (results == 0) {
//                                                     return res.status(200).send({ error: true, message: "This is not your calling time", data: null });
//                                                 } else {
//                                                     connect.query('select * from tbl_franchise where Id = "' + findstudent[0].franchise_id + '"', function (error, findFranchise, fields) {
//                                                         if (findFranchise != 0) {
//                                                             fcm.send(message, callback);
//                                                             const sql = 'INSERT INTO tbl_callhistory (student_id,student_name,parent_id,parent_name,meeting_link,day,status) VALUES (?)';
//                                                             const VALUES = [findstudent[0].id, findstudent[0].name, findparent[0].id, findparent[0].name, roomId, day, status];
//                                                             connect.query(sql, [VALUES], function (error, insertcall, fields) {
//                                                                 if (insertcall == 0) {
//                                                                     return res.status(200).send({ error: true, message: "meeting link not insert in call history" });
//                                                                 }
//                                                             })
//                                                             var jitsilink = findFranchise[0].room_id;
//                                                             return res.status(200).send({ error: false, message: "fcm notifiction working", data: jitsilink + '/' + roomId });
//                                                         }
//                                                     })
//                                                 }
//                                             })
//                                         })

//                                     }
//                                 }
//                             })
//                         }
//                     })
//                 }
//             }
//         })
//     }
//     catch (error) {
//         return res.status(401).send({ error: true, message: "Fcm api not working" });
//     }
// }

// const fcmToken = (req, res, callback) => {
//     try {
//         Upload(req, res, (err) => {
//             if (err) {
//                 return res.status(401).send({ error: false, message: "Multer not working" });
//             } else {
//                 const { id } = req.body;
//                 const status = 0;
//                 if (id == 0) {
//                     return res.status(201).send({ error: true, message: "Please insert id" });
//                 } else {
//                     connect.query('SELECT * From tbl_parents WHERE id = ?', [id], function (error, findparent, fields) {
//                         if (findparent == 0) {
//                             return res.send({ error: true, message: "incorrect parent Id", data: null })
//                         } else {
//                             connect.query('SELECT * From tbl_student WHERE id = ?', [findparent[0].student_id], function (error, findstudent, fields) {
//                                 if (findstudent == 0) {
//                                     return res.status(200).send({ error: true, message: "Student not found", data: null });
//                                 } else {
//                                     var now = new Date();
//                                     var y = now.getFullYear();
//                                     var m = now.getMonth();
//                                     var d = now.getDate();
//                                     var h = now.getHours();
//                                     var i = now.getMinutes();
//                                     var s = now.getSeconds();
//                                     const c = generateString(6);
//                                     const roomId = 'nayantara' + y + m + d + h + i + s + c + findstudent[0].id + id;

//                                     const serverKey = 'AAAAJQN69I0:APA91bHXUVP4OT_GmemsVlhKFjBa7oKm9fWnQ_jJ9RG__vYe4j4r06uLrbwjjDKAcEtcg3-9J1lXZIFNhN66jtlTtQ3dUT7QHUSgS7a6ZbDR2ZEi05jEvY6iOPpz-sU5pVfLZviiW7z1';
//                                     const fcm = new FCM(serverKey);
//                                     if (findparent[0].total_talktime == 0 && findstudent[0].total_talktime == 0) {
//                                         return res.status(200).send({ error: true, message: "Minutes not available" })
//                                     } else {
//                                         const weekend = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Satuarday"];
//                                         var now = new Date();
//                                         var day = weekend[now.getDay()];
//                                         const currentTime = getCurrentTime();
//                                         currentTime.then((value) => {
//                                             const stringValue = String(value);
//                                             connect.query('SELECT * From tbl_department_timeslots WHERE tbl_department_timeslots.department_id = "' + findstudent[0].department_id + '" AND tbl_department_timeslots.day = "' + day + '" AND tbl_department_timeslots.start_time <= "' + stringValue + '" and tbl_department_timeslots.end_time >= "' + stringValue + '"', function (error, results, fields) {
//                                                 if (results == 0) {
//                                                     return res.status(200).send({ error: true, message: "This is not your calling time", data: null });
//                                                 } else {
//                                                     connect.query('select * from tbl_franchise where Id = "' + findstudent[0].franchise_id + '"', function (error, findFranchise, fields) {
//                                                         if (findFranchise != 0) {
//                                                             const message = {
//                                                                 to: findparent[0].fcm_token,
//                                                                 collapse_key: `TEST`,
//                                                                 priority: "high",
//                                                                 notification: {
//                                                                     title: ` Nayantrarabyspacs`,
//                                                                     body: '' + findstudent[0].name + ' is calling on nayantara app',
//                                                                     sound: 'http://nayantarabyspacs.co.in/assets/notificationsound.mp3',
//                                                                     delivery_receipt_requested: true
//                                                                 },
//                                                                 data: {
//                                                                     message: roomId,
//                                                                     type: findFranchise[0].room_id
//                                                                 }
//                                                             };
//                                                             fcm.send(message, callback);
//                                                             const sql = 'INSERT INTO tbl_callhistory (student_id,student_name,parent_id,parent_name,meeting_link,day,status) VALUES (?)';
//                                                             const VALUES = [findstudent[0].id, findstudent[0].name, findparent[0].id, findparent[0].name, roomId, day, status];
//                                                             connect.query(sql, [VALUES], function (error, insertcall, fields) {
//                                                                 if (insertcall == 0) {
//                                                                     return res.status(200).send({ error: true, message: "meeting link not insert in call history" });
//                                                                 }
//                                                             })
//                                                             var data = {
//                                                                 url: findFranchise[0].room_id,
//                                                                 roomId: roomId
//                                                             }
//                                                             // var jitsilink = findFranchise[0].room_id;
//                                                             return res.status(200).send({ error: false, message: "fcm notifiction working", data: data });
//                                                         }
//                                                     })
//                                                 }
//                                             })
//                                         })

//                                     }
//                                 }
//                             })
//                         }
//                     })
//                 }
//             }
//         })
//     }
//     catch (error) {
//         return res.status(401).send({ error: true, message: "Fcm api not working" });
//     }
// };

const fcmToken = async (req, res, callback) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(401).send({ error: false, message: "Multer not working" });
            } else {
                // const { id } = req.body;
                const { id, room_id } = req.body;
                const call_type = callType(req.body.call_type);

                const status = 0;
                if (id == 0) {
                    return res.status(201).send({ error: true, message: "Please insert id" });
                } else {
                    // return res.status(400).send({ error: true, message: "23233" });
                    connect.query('SELECT * From tbl_parents WHERE id = ?', [id], function (error, findparent, fields) {
                        try{
                            if (findparent == 0) {
                                return res.send({ error: true, message: "incorrect parent Id", data: null })
                            } else {
                                // return res.status(200).send({ error: true, message: "Student found", data: findparent });
                                connect.query('SELECT * From tbl_student WHERE id = ?', [findparent[0].student_id], async function (error, findstudent, fields) {
                                    if (findstudent == 0) {
                                        return res.status(200).send({ error: true, message: "Student not found", data: null });
                                    } else {
                                        // school / house rules: audio calls allowed, daily call count and talk time limits
                                        const blocked = await callBlockReason(findstudent[0].id, call_type);
                                        if (blocked) {
                                            return res.status(200).send({ error: true, message: blocked, data: null });
                                        }
                                        var now = new Date();
                                        var y = now.getFullYear();
                                        var m = now.getMonth();
                                        var d = now.getDate();
                                        var h = now.getHours();
                                        var i = now.getMinutes();
                                        var s = now.getSeconds();
                                        const c = generateString(6);
                                        const roomId = 'nayantara' + y + m + d + h + i + s + c + findstudent[0].id + id;
                                        const finalRoomId = room_id || ('nayantara_' + id);


                                        // no call once both balances are used up (0 or overdrawn) -- `== 0` let overdrawn accounts keep calling
                                        if (Number(findparent[0].total_talktime) <= 0 && Number(findstudent[0].total_talktime) <= 0) {
                                            return res.status(200).send({ error: true, message: "Minutes not available" })
                                        } else {
                                            const weekend = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Satuarday"];
                                            var now = new Date();
                                            var day = weekend[now.getDay()];
                                            const currentTime = getCurrentTime();
                                            currentTime.then((value) => {
                                                const stringValue = String(value);
                                                connect.query('SELECT * From tbl_department_timeslots WHERE tbl_department_timeslots.department_id = "' + findstudent[0].department_id + '" AND tbl_department_timeslots.day = "' + day + '" AND tbl_department_timeslots.start_time <= "' + stringValue + '" and tbl_department_timeslots.end_time >= "' + stringValue + '"', function (error, results, fields) {
                                                    if (results == 0) {
                                                        return res.status(200).send({ error: true, message: "This is not your calling time", data: null });
                                                    } else {
                                                        connect.query('select * from tbl_franchise where Id = "' + findstudent[0].franchise_id + '"', function (error, findFranchise, fields) {
                                                            if (findFranchise != 0) {
                                                                // Initialize Google Auth Client
                                                                const SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];
                                                                const client = new google.auth.JWT(
                                                                    serviceAccount.client_email,
                                                                    null,
                                                                    serviceAccount.private_key,
                                                                    SCOPES
                                                                );

                                                                async function getAccessToken() {
                                                                    const token = await client.authorize();
                                                                    return token.access_token;
                                                                }

                                                                async function sendFcmMessage() {
                                                                    const accessToken = await getAccessToken();

                                                                    const payload = {
                                                                        message: {
                                                                            token: findparent[0].fcm_token, // replace with actual device token
                                                                            notification: {
                                                                                title: 'Nayantrarabyspacs',
                                                                                body: '' + findstudent[0].name + ' is calling on nayantara app',
                                                                            },
                                                                            data: {
                                                                                message: roomId,
                                                                                type: "",
                                                                                call_type: call_type
                                                                            },
                                                                        },
                                                                    };

                                                                    try {
                                                                        const response = await axios({
                                                                            method: 'post',
                                                                            url: `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, // replace with your Firebase project ID
                                                                            headers: {
                                                                                Authorization: `Bearer ${accessToken}`,
                                                                                'Content-Type': 'application/json',
                                                                            },
                                                                            data: payload,
                                                                            timeout: 10000,
                                                                        });

                                                                        const sql = 'INSERT INTO tbl_callhistory (student_id,student_name,parent_id,parent_name,meeting_link,day,status,call_type) VALUES (?)';
                                                                        const VALUES = [findstudent[0].id, findstudent[0].name, findparent[0].id, findparent[0].name, roomId, day, status, call_type];
                                                                        connect.query(sql, [VALUES], function (error, insertcall, fields) {
                                                                            if (insertcall == 0) {
                                                                                return res.status(200).send({ error: true, message: "meeting link not insert in call history" });
                                                                            }
                                                                        })
                                                                        const jsonObject = JSON.parse(response.config.data);
                                                                        const data = {
                                                                            url: null,
                                                                            roomId: jsonObject.message.data.message
                                                                        }
                                                                        return res.status(200).send({ error: false, message: "fcm notifiction working", data: data });
                                                                    } catch (error) {
                                                                        // return res.status(400).send({ error: true, message: error.response ? error.response.data : error.message});
                                                                        console.error('Error sending FCM message:', error.response ? error.response.data : error.message);
                                                                    }
                                                                };
                                                                sendFcmMessage();
                                                            }
                                                        })
                                                    }
                                                })
                                            })

                                        }
                                    }
                                })
                            }
                        }catch(error){
                            return res.status(400).send({ error: true, message: error });
                        }
                       
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "Fcm api not working" });
    }
};

function generateString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

const fcmWebNotification = (req, res, callback) => {
    try {
        const id = req.params.id;
        const status = 0;
        if (id == 0) {
            return res.status(201).send({ error: true, message: "Please insert id" });
        }
        else {
            connect.query('SELECT * From tbl_parents WHERE id = ?', [id], function (error, findparent, fields) {
                if (findparent == 0) {
                    return res.send({ error: true, message: "fcm token not found", data: null })
                }
                else {
                    connect.query('SELECT * From tbl_student WHERE id = ?', [findparent[0].student_id], function (error, findstudent, fields) {
                        if (findstudent == 0) {
                            return res.status(200).send({ error: true, message: "Student successfully not found", data: null });
                        }
                        else {
                            var now = new Date();
                            var y = now.getFullYear();
                            var m = now.getMonth();
                            var d = now.getDate();
                            var h = now.getHours();
                            var i = now.getMinutes();
                            var s = now.getSeconds();
                            const c = generateString(6);
                            const roomId = 'nayantara' + y + m + d + h + i + s + c + findstudent[0].id + id;

                            const serverKey = 'AAAAJQN69I0:APA91bHXUVP4OT_GmemsVlhKFjBa7oKm9fWnQ_jJ9RG__vYe4j4r06uLrbwjjDKAcEtcg3-9J1lXZIFNhN66jtlTtQ3dUT7QHUSgS7a6ZbDR2ZEi05jEvY6iOPpz-sU5pVfLZviiW7z1';
                            const fcm = new FCM(serverKey);
                            const message = {
                                to: findparent[0].fcm_token,
                                collapse_key: `TEST`,
                                priority: "high",
                                notification: {
                                    title: `Nayantrarabyspacs`,
                                    body: '' + findstudent[0].name + ' is calling on nayantara app',
                                    sound: 'http://nayantarabyspacs.co.in/assets/notificationsound.mp3',
                                    delivery_receipt_requested: true
                                },
                                data: {
                                    message: roomId,
                                    type: "",
                                    room_id: findFranchise[0].room_id
                                }
                            };
                            // no call once both balances are used up (0 or overdrawn) -- `== 0` let overdrawn accounts keep calling
                            if (Number(findparent[0].total_talktime) <= 0 && Number(findstudent[0].total_talktime) <= 0) {
                                return res.status(200).send({ error: true, message: "Minutes not available" })
                            }
                            else {
                                const weekend = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Satuarday"];
                                var now = new Date();
                                var day = weekend[now.getDay()];
                                const currentTime = getCurrentTime();
                                currentTime.then((value) => {
                                    var stringValue = String(value);
                                    connect.query('SELECT * From tbl_department_timeslots WHERE tbl_department_timeslots.department_id = "' + findstudent[0].department_id + '" AND tbl_department_timeslots.day = "' + day + '" AND tbl_department_timeslots.start_time <= "' + stringValue + '" and tbl_department_timeslots.end_time >= "' + stringValue + '"', function (error, results, fields) {
                                        if (results == 0) {
                                            return res.status(200).send({ error: true, message: "This is not your calling time", data: null });
                                        }
                                        else {
                                            connect.query('select * from tbl_franchise where Id = "' + findstudent[0].franchise_id + '"', function (error, findFranchise, fields) {
                                                if (findFranchise != 0) {
                                                    fcm.send(message, callback);
                                                    const VALUES = [findstudent[0].id, findstudent[0].name, findparent[0].id, findparent[0].name, roomId, day, status];
                                                    connect.query('INSERT INTO tbl_callhistory (student_id,student_name,parent_id,parent_name,meeting_link,day,status) VALUES (?)', [VALUES], function (error, insertcall, fields) {
                                                        if (insertcall == 0) {
                                                            return res.status(200).send({ error: true, message: "meeting link not insert in call history" });
                                                        }
                                                    })
                                                    var jitsilink = findFranchise[0].room_id;
                                                    return res.status(200).send({ error: false, message: "fcm notifiction working", data: jitsilink + '/' + roomId });
                                                }
                                            })
                                        }
                                    })
                                })
                            }
                        }
                    })
                }
            })
        }
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "Fcm api not working" });
    }
}

const jitsyLink = (req, res, next) => {
    try {
        const roomId = "plugintestroom";
        if (roomId == 0) {
            return res.status(201).send({ error: true, message: "roomId not Found", data: null });
        }
        else {
            return res.status(200).send({ error: false, message: "room Id found", data: roomId });
        }
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "jitsy api not working" });
    }
}

const callMinute = (req, res, next) => {
    try {
        Upload(req, res, async (err) => {
            if (err) {
                return res.status(401).send({ error: true, message: "Call Minute multer not be working" });
            }
            const { id } = req.body;
            if (id == 0) {
                return res.status(200).send({ error: true, message: "Please insert the Id" });
            }
            try {
                // longest call allowed now: balance at the school's rate, the house's max call length and today's allowance left
                const seconds = await allowedCallSeconds(id, callType(req.body.call_type));
                if (seconds === undefined) {
                    return res.status(200).send({ error: true, message: "Student not found", data: null });
                }
                return res.status(200).send({ error: false, message: "This is call minute", data: Math.floor(seconds / 60), seconds });
            } catch (error) {
                return res.status(400).send({ error: true, message: "Call minute api not be working" });
            }
        })
    } catch (error) {
        return res.status(400).send({ error: true, message: "Call minute api not be working" });
    }
};

module.exports = { fcmToken, jitsyLink, callMinute, fcmWebNotification };