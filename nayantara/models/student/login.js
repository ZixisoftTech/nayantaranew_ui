const dataBase = require("../../config/db");
const jwt = require('jsonwebtoken');
const multer = require('multer');
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

async function getTimes(times) {
    return new Promise((resolve, reject) => {
        return null ? reject(null) : resolve(times)
    })
}

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
    let currentTime = hours + ':' + ('0' + minutes).slice(-2) + ":" + second;
    return currentTime;
}

const login = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(200).send({ error: true, message: "Multer not working", data: null });
            } else {
                const { franchise_id, roll_no, password } = req.body;
                if (franchise_id == 0 || password == 0) {
                    return res.status(400).send({ error: true, message: "Please enter all field" });
                }
                else {
                    dataBase.query('SELECT * From tbl_student WHERE franchise_id = ? and student_roll_no = ?', [franchise_id, roll_no], function (error, login, fields) {
                        if (login == 0) {
                            return res.status(200).send({ error: true, message: "Incorrect your roll no or school", data: null });
                        } else {
                            if (login[0].password == Number(password)) {
                                if (login[0].login_status == 0) {
                                    return res.status(200).send({ error: true, message: "You don't have permission to login. Please contact your school's administration." });
                                } else {
                                    const weekend = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Satuarday"];
                                    const date_time = new Date();
                                    let day = weekend[date_time.getDay()];
                                    const currentTime = getCurrentTime();
                                    currentTime.then((value) => {
                                        const stringValue = String(value);
                                        dataBase.query('SELECT * From tbl_department_timeslots WHERE tbl_department_timeslots.department_id = "' + login[0].department_id + '" AND tbl_department_timeslots.day = "' + day + '" AND tbl_department_timeslots.start_time <= "' + stringValue + '" and tbl_department_timeslots.end_time >= "' + stringValue + '"', function (error, results, fields) {
                                            if (results == 0) {
                                                return res.status(200).send({ error: true, message: "This is not your login time", data: null });
                                            }
                                            else {
                                                dataBase.query('UPDATE tbl_student set status = ? WHERE student_roll_no = ?', ["1", roll_no], function (error, results, fields) {
                                                    if (results) {
                                                        const studentToken = jwt.sign({ id: login[0].id }, "thisisastudentsecretkey");
                                                        login[0].studentToken = studentToken;
                                                        return res.status(200).send({ error: false, message: "You are successfully Login", data: login })
                                                    }
                                                })
                                            }
                                        })
                                    })
                                }
                            } else {
                                return res.status(200).send({ error: true, message: "Incorrect Password", data: null });
                            }
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "Student login api not be working" });
    }
}

const Login = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (!err) {
                const { franchise_id, roll_no, password, device_name, status, fcmtoken } = req.body;
                if (franchise_id == 0 || roll_no == 0 || password == 0) {
                    return res.status(200).send({ error: true, message: "Please enter roll no and password" });
                } else {
                    dataBase.query('SELECT * from tbl_student WHERE franchise_id = ? and student_roll_no = ?', [franchise_id, roll_no], function (error, findEmail, fields) {
                        if (findEmail == 0) {
                            return res.status(200).send({ error: true, message: "Incorrect your roll no or school", data: null });
                        } else {
                            if (findEmail[0].password != password) {
                                return res.status(200).send({ error: true, message: "Incorrect Your Password", data: null });
                            } else {
                                if (findEmail[0].login_status == 0) {
                                    return res.status(200).send({ error: true, message: "You don't have permission to login. Please contact your school's administration." });
                                } else {
                                    const weekend = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Satuarday"];
                                    const date_time = new Date();
                                    let day = weekend[date_time.getDay()];
                                    dataBase.query('SELECT * From tbl_department WHERE id = ? AND device_name LIKE ?', [findEmail[0].department_id, '%' + device_name + '%'], function (error, findDevicename, fields) {
                                        if (findDevicename == 0) {
                                            return res.status(200).send({ error: true, message: "Invalid Your device Id", data: null });
                                        } else {
                                            const currentTime = getCurrentTime();
                                            currentTime.then((value) => {
                                                const stringValue = String(value);
                                                dataBase.query('SELECT * From tbl_department_timeslots WHERE tbl_department_timeslots.department_id = "' + findEmail[0].department_id + '" AND tbl_department_timeslots.day = "' + day + '" AND tbl_department_timeslots.start_time <= "' + stringValue + '" and tbl_department_timeslots.end_time >= "' + stringValue + '"', function (error, findDepartment, fields) {
                                                    if (findDepartment == 0) {
                                                        return res.status(200).send({ error: true, message: "This is not your login time", data: null });
                                                    } else {
                                                        // if (findDepartment[0].start_time <= time && findDepartment[0].end_time >= time) {
                                                        dataBase.query('UPDATE tbl_student set status = "' + status + '",fcm_token = "' + fcmtoken + '" WHERE email = ?', [findEmail[0].email], function (error, results, fields) {
                                                            if (results) {
                                                                return res.status(200).send({ error: false, message: "student successfully Login", data: findEmail[0] });
                                                            } else {
                                                                return res.status(200).send({ error: true, message: "student not successfully Login", data: null });
                                                            }
                                                        });

                                                    }
                                                });
                                            })
                                        }
                                    })
                                }
                            }
                        }
                    })
                }
            } else {
                return res.status(200).send({ error: true, message: "Login multer not be working" });
            }
        })
    } catch (error) {
        return res.status(200).send({ error: true, message: "Student Login api not working" });
    }
}

const studentName = async (req, res, next) => {
    try {
        const { tokenStudent } = req.body;
        const userId = jwt.verify(tokenStudent, "thisisastudentsecretkey");
        if (userId == 0) {
            return res.status(402).send({ error: true, message: "Not Authorised" });
        } else {
            dataBase.query('SELECT * FROM tbl_student WHERE id = ?', [userId.id], function (error, results, fileds) {
                // console.log("results =>", results);
                if (results == 0) {
                    return res.status(200).send({ error: true, message: "Student not found", data: null });
                }
                else {
                    return res.status(200).send({ error: false, message: "Student successfully found", data: results });
                }
            })
        }
    } catch (error) {
        return res.status(201).send({ error: true, message: "getStudentName api not working" });
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
                const status = "4";
                if (id == 0) {
                    return res.status(201).send({ error: true, message: "Please insert the id" });
                }
                else {
                    dataBase.query('UPDATE tbl_student set status = ? WHERE id = ?', [status, id], function (error, logout, fields) {
                        if (logout) {
                            return res.status(200).send({ error: false, message: "Student status update" });
                        }
                        else {
                            return res.status(201).send({ error: false, message: "Student status not update" });
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

const studentProfile = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return re.status(200).send({ error: true, message: " Multer not working" });
            } else {
                const { id } = req.body;
                if (id == 0) {
                    return res.status(400).send({ error: true, message: "Please insert the Id" });
                } else {
                    dataBase.query('SELECT id, name, email, password From tbl_student WHERE id = ?', [id], function (error, findProfile, fields) {
                        if (findProfile == 0) {
                            return res.status(200).send({ error: true, message: "Student not found", data: null });
                        } else {
                            dataBase.query('SELECT id,name,contact From tbl_parents WHERE student_id = ?', [findProfile[0].id], function (error, findParent, fields) {
                                if (findParent == 0) {
                                    return res.status(200).send({ error: true, message: "Student not found", data: null });
                                } else {
                                    const results = {
                                        id: findProfile[0].id,
                                        name: findProfile[0].name,
                                        email: findProfile[0].email,
                                        password: findProfile[0].password,
                                        parents: findParent,
                                    }
                                    return res.status(200).send({ error: false, message: "Student Successfully found", data: results });
                                }
                            })
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "student Profile api not working", error: true });
    }
}

const studentProfileUpdate = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (!err) {
                const { id, name, old_password, new_password } = req.body;
                if (id == 0 || name == 0 || old_password == 0 || new_password == 0) {
                    return res.status(200).send({ error: true, message: "Please insert all fields" });
                } else {
                    dataBase.query('SELECT * From tbl_student WHERE id = "' + id + '" AND password = "' + old_password + '"', function (error, findStudent, fields) {
                        if (findStudent == 0) {
                            return res.status(200).send({ error: true, message: "Please enter correct old password", data: null });
                        } else {
                            dataBase.query('UPDATE tbl_student set name = ?,password = ? WHERE id = ?', [name, new_password, id], function (error, updateProfile, fields) {
                                if (updateProfile) {
                                    return res.status(200).send({ error: false, message: "Profile successfully update", data: null });
                                } else {
                                    return res.status(200).send({ error: true, message: "Profile not successfully update", data: null });
                                }
                            })
                        }
                    })
                }
            } else {
                return res.status(200).send({ error: true, messsage: "Multer not be working" });
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "student profile update api not be working" });
    }
}

module.exports = { Login, login, studentName, Logout, studentProfile, studentProfileUpdate };