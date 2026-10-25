const dataBase = require('../../config/db');
const jwt = require('jsonwebtoken');
const { activateParent } = require('../call_rules');
const multer = require('multer');
const { default: axios } = require("axios");
const FlexApiBase = require('twilio/lib/rest/FlexApiBase');
const baseUrl = 'https://api.msg91.com/api/v5/'

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

// async function getCurrentTime() {
//     // const currentDate = new Date();
//     // const currentHour = String(currentDate.getHours()).padStart(2, '0');
//     // const currentMinute = String(currentDate.getMinutes()).padStart(2, '0');
//     // const currentSecond = String(currentDate.getSeconds()).padStart(2, '0');

//     // const currentTime = currentHour + ':' + currentMinute + ':' + currentSecond;
//     //     const currentTime = new Date();
//     // const hours = currentTime.getHours().toString().padStart(2, '0');
//     // const minutes = currentTime.getMinutes().toString().padStart(2, '0');
//     // const seconds = currentTime.getSeconds().toString().padStart(2, '0');

//     // const timeString = `${hours}:${minutes}:${seconds}`;
//     const now = new Date();
//     const options = { timeZone: 'Asia/Kolkata', hour12: false };
//     const timeString = now.toLocaleString('en-IN', options).split(', ')[1];
//     const [hourString, minuteString, secondString] = timeString.split(':');
//     const hours = parseInt(hourString);
//     const minutes = parseInt(minuteString);
//     const second = parseInt(secondString);
//     // let time = hours + ':' + minutes;
//     let currentTime = hours + ':' + ('0' + minutes).slice(-2) + ":" + second;
//     return currentTime;
// }

const Parentlogin = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (!err) {
                const { contact, password, status, fcmtoken } = req.body;
                if (contact == 0 || password == 0 || status == 0 || fcmtoken == 0) {
                    return res.status(401).send({ error: true, message: "Please insert contact and passowrd" });
                }
                else {
                    dataBase.query('SELECT * From tbl_parents WHERE contact = ?', [contact], function (error, parentfind, fields) {
                        if (parentfind == 0) {
                            return res.status(201).send({ error: true, message: "Incorrect parent contact no", data: null });
                        } else {
                            if (parentfind[0].password == password) {
                                if (parentfind[0].contact == '9754764248' || parentfind[0].contact == '8839608504' || parentfind[0].contact == '9301778530') {
                                    dataBase.query('UPDATE tbl_parents set status = ?,fcm_token = ? WHERE contact = ?', [status, fcmtoken, contact], function (error, results, fields) {
                                        if (results) {
                                            // first login activates the account and charges the school's activation fee once
                                            activateParent(parentfind[0]);
                                            return res.status(200).send({ error: false, message: "You are successfully login", data: parentfind[0] });
                                        }
                                        else {
                                            return res.status(200).send({ error: true, message: 'You are not successfully login', data: null });
                                        }
                                    })
                                } else {
                                    if (parentfind[0].status == 1) {
                                        return res.status(200).send({ error: true, message: 'your are already login', data: null });
                                    } else {
                                        dataBase.query('UPDATE tbl_parents set status = ?,fcm_token = ? WHERE contact = ?', [status, fcmtoken, contact], function (error, results, fields) {
                                            if (results) {
                                                // first login activates the account and charges the school's activation fee once
                                                activateParent(parentfind[0]);
                                                return res.status(200).send({ error: false, message: "You are successfully login", data: parentfind[0] });
                                            }
                                            else {
                                                return res.status(200).send({ error: true, message: 'You are not successfully login', data: null });
                                            }
                                        })
                                    }
                                }
                            } else {
                                return res.status(200).send({ error: true, message: "Incorrect Password", data: null });
                            }
                            // dataBase.query('SELECT * From tbl_student WHERE id = ?', parentfind[0].student_id, function (error, studentfind, fields) {
                            //     if (studentfind == 0) {
                            //         return res.status(201).send({ error: true, message: "Student data not found", data: null });
                            //     }
                            //     else {
                            //         const weekend = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Satuarday"];
                            //         const date_time = new Date();
                            //         let day = weekend[date_time.getDay()];
                            //         const currentTime = getCurrentTime();
                            //         currentTime.then((value) => {
                            //             const stringValue = String(value);
                            //             dataBase.query('SELECT * From tbl_department_timeslots WHERE tbl_department_timeslots.department_id = "' + studentfind[0].department_id + '" AND tbl_department_timeslots.day = "' + day + '" AND tbl_department_timeslots.start_time <= "' + stringValue + '" and tbl_department_timeslots.end_time >= "' + stringValue + '"', function (error, timeslots, fields) {
                            //                 if (timeslots == 0) {
                            //                     return res.status(201).send({ error: true, message: "This is not your login time", data: null });
                            //                 }
                            //                 else {
                            //                     // if (timeslots[0].start_time <= time && timeslots[0].end_time >= time) {
                            //                     dataBase.query('UPDATE tbl_parents set status = ?,fcm_token = ? WHERE contact = ?', [status, fcmtoken, contact], function (error, results, fields) {
                            //                         if (results) {
                            //                             return res.status(200).send({ error: false, message: "You are successfully login", data: parentfind[0] });
                            //                         }
                            //                         else {
                            //                             return res.status(200).send({ error: true, message: 'You are not successfully login', data: null });
                            //                         }
                            //                     })
                            //                     // } else {
                            //                     //     return res.status(200).send({ error: true, message: `time error start time ${timeslots[0].start_time} : end time ${timeslots[0].end_time}`, data: null });
                            //                     // }
                            //                 }
                            //             })
                            //         })
                            //     }
                            // })
                        }
                    })
                }
            } else {
                return res.status(400).send({ error: true, message: "Multer not be working" });
            }
        })
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "Parent Login api not Working" });
    }
};

const Parentotp = async (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (!err) {
                const { contact } = req.body;
                if (contact == 0) {
                    return res.status(400).send({ error: true, message: "Please insert email" });
                }
                else {
                    dataBase.query('SELECT * From tbl_parents WHERE contact = "' + contact + '"', async function (error, results, fields) {
                        if (results == 0) {
                            return res.status(401).send({ error: true, message: "parent not found in database" });
                        }
                        else {
                            const contact = results[0].contact;
                            const id = results[0].id;
                            // SMS only reaches Indian numbers; international parents use the fixed OTP set when they were added
                            if (String(contact).startsWith('+')) {
                                if (results[0].otp == null) {
                                    return res.status(200).send({ error: true, message: "OTP is not set for this number. Please ask your school for your login OTP.", data: null });
                                }
                                return res.status(200).send({ error: false, message: "Use the login OTP given by your school", data: { id: id } });
                            }
                            const OTP = Math.floor(1000 + Math.random() * 9000).toString();
                            dataBase.query('UPDATE tbl_parents SET otp = ? WHERE contact = ?', [OTP, contact], async function (error, updateOtp, fields) {
                                if (updateOtp) {
                                    var config = {
                                        "method": "POST",
                                        "url": "https://api.msg91.com/api/v5/flow/",
                                        "port": null,
                                        "headers": {
                                            "authkey": "388506AExX7KNliIe63c17ecaP1",
                                            "content-type": "application/json"
                                        },
                                        'data': {
                                            // "flow_id": "648d6791d6fc053c39421c32",
                                            'template_id': '648d6791d6fc053c39421c32', // Replace with the actual template ID
                                            "sender": "SPCXNT",
                                            "route": 4,
                                            "recipients": [
                                                {
                                                    "mobiles": '91' + contact,
                                                    "OTP": OTP
                                                }
                                            ]
                                        }
                                    }

                                    axios(config)
                                        .then((response) => {
                                            response.data = {
                                                'id': id,
                                            }
                                            return res.status(200).send({ error: false, message: "Message sent successfully:", data: response.data });
                                        })
                                        .catch((error) => {
                                            return res.status(200).send({ error: true, message: "Error::", data: error.response.data });
                                        });
                                }
                            })
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "Your request is invalid" });
    }
};

const getOtp = async (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (!err) {
                const { id } = req.body;
                if (id == 0) {
                    return res.status(200).send({ error: true, message: "Please enter the id" });
                } else {
                    dataBase.query('SELECT id,name,otp From tbl_parents WHERE id = "' + id + '"', function (error, findOtp, fields) {
                        if (findOtp == 0) {
                            return res.status(200).send({ error: true, message: "Parent otp not found", data: null });
                        } else {
                            return res.status(200).send({ error: false, message: "Parent otp successfully found", data: findOtp[0] });
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(200).send({ error: true, message: "getOtp api not working" });
    }
}

const otpMatch = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (!err) {
                const { otp, id } = req.body;
                if (otp == 0 || id == 0) {
                    return res.status(401).send({ error: true, message: "Please insert Otp amd id" });
                }
                else {
                    dataBase.query('SELECT * FROM tbl_parents WHERE id = ? AND otp = ?', [id, otp], function (err, results, fields) {
                        if (results == 0) {
                            return res.status(400).send({ error: true, message: "Parent not found" });
                        }
                        else {
                            return res.status(200).send({ error: false, message: "Otp matched successfully", data: results[0] })
                        }
                    })
                }
            } else {
                return res.status(400).send({ error: true, message: "Form - data is error" });
            }
        })
    } catch (error) {
        return res.status(400).send({ error: true, message: "Your request is invalid" });
    }
}

const passwordUpdate = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(400).send({ error: true, message: "Multer not be working" });
            } else {
                const { id, password, confirmpassword } = req.body;
                if (id == 0 || password == 0 || confirmpassword == 0) {
                    return res.status(200).send({ error: true, message: "Please insert the all fileds" });
                } else {
                    if (password != confirmpassword) {
                        return res.status(200).send({ error: true, message: "password and cofirmpassword are not same", data: null });
                    } else {
                        dataBase.query('UPDATE tbl_parents SET password = ? WHERE id = ?', [password, id], function (error, updatePassword, fields) {
                            if (updatePassword) {
                                return res.status(200).send({ error: false, message: "Password successfully update", data: updatePassword });
                            } else {
                                return res.status(200).send({ error: true, message: "password not update", data: null });
                            }
                        })
                    }
                }
            }
        })
    } catch (error) {
        return res.status(400).send({ error: true, message: "password update api not working" });
    }
}

const Logout = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(201).send({ error: true, message: "Multer not working" });
            }
            else {
                const { id } = req.body;
                const status = "0";
                if (id == 0) {
                    return res.status(201).send({ error: true, message: "Please insert the id" });
                }
                else {
                    dataBase.query('UPDATE tbl_parents set status = ? WHERE id = ?', [status, id], function (error, logout, fields) {
                        if (logout) {
                            return res.status(200).send({ error: false, message: "Parent successfully logout" });
                        } else {
                            return res.status(201).send({ error: false, message: "Parent not successfully logout" });
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "Student Logout api not working" });
    }
}

const parentProfile = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (!err) {
                const { id } = req.body;
                if (id == 0) {
                    return res.status(200).send({ error: true, message: "Please enter the parent Id" });
                } else {
                    dataBase.query('SELECT tbl_parents.*,tbl_student.name as student_name from tbl_parents left join tbl_student ON tbl_student.id = tbl_parents.student_id WHERE tbl_parents.id = ?', [id], function (error, findParents, fields) {
                        if (findParents == 0) {
                            return res.status(200).send({ error: true, message: "Student profile successfully not found", data: null });
                        } else {
                            return res.status(200).send({ error: false, message: "Student profile successfully found", data: findParents[0] });
                        }
                    })
                }
            } else {
                return res.status(400).send({ error: true, message: "Multer not working" });
            }
        })
    } catch (error) {
        return res.status(400).send({ error: true, message: "parentProfile api not working" });
    }
}

const parentProfileUpdate = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (!err) {
                const { id, old_password, new_password } = req.body;
                if (id == 0 || old_password == 0 || new_password == 0) {
                    return res.status(200).send({ error: true, message: "Please enter the all field" });
                } else {
                    dataBase.query('SELECT * From tbl_parents where id = "' + id + '" AND password = "' + old_password + '"', function (error, findPassword, fields) {
                        if (findPassword == 0) {
                            return res.status(200).send({ error: true, message: "Please insert correct old password", data: null });
                        } else {
                            dataBase.query('UPDATE tbl_parents set password = ? WHERE id = ?', [new_password, id], function (error, passwordUpdate, fields) {
                                if (passwordUpdate) {
                                    return res.status(200).send({ error: false, message: "parent password successfully update", data: passwordUpdate });
                                } else {
                                    return res.status(200).send({ error: true, message: "parent password not successfullt update", data: null });
                                }
                            })
                        }
                    })
                }
            } else {
                return res.status(200).send({ error: true, message: "Multer not be working" });
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "parent profile update" });
    }
}

module.exports = { Parentlogin, Parentotp, otpMatch, passwordUpdate, Logout, parentProfile, parentProfileUpdate, getOtp };