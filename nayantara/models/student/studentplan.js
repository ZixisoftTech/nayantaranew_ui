const dataBase = require('../../config/db');
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

const getAvailablemin = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(401).send({ error: true, message: "Multer not be use" });
            } else {
                const { id } = req.body;
                if (id == 0) {
                    return res.status(200).send({ error: true, message: "Please insert the student Id" });
                }
                else {
                    dataBase.query('SELECT * From tbl_student WHERE id = "' + id + '"', function (error, results, fields) {
                        if (results == 0) {
                            return res.status(401).send({ error: true, message: "student not found", data: error });
                        }
                        else {
                            console.log(results);
                            const secTime = results[0].total_talktime;
                            const computeMinutes = Math.floor(secTime / 60);
                            const sec = secTime % 60;
                            // Convert minutes and seconds to strings with leading zeros if necessary
                            const minutesString = String(computeMinutes).padStart(2, '0');
                            const secondsString = String(sec).padStart(2, '0');

                            const time = minutesString + ':' + secondsString;
                            results[0].time = time;
                            return res.status(200).send({ error: false, message: "Student successfully get available minute", data: results[0] });
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "Get availble min api not working" });
    }
}

const getWebAvailbalemin = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(400).send({ error: true, message: "Please insert the student Id" });
        }
        else {
            dataBase.query('SELECT * From tbl_student WHERE id = "' + id + '"', function (error, results, fields) {
                if (results == 0) {
                    return res.status(200).send({ error: true, message: "student not found", data: null });
                }
                else {
                    const secTime = results[0].total_talktime;
                    const computeMinutes = Math.floor(secTime / 60);
                    const sec = secTime % 60;
                    // Convert minutes and seconds to strings with leading zeros if necessary
                    const minutesString = String(computeMinutes).padStart(2, '0');
                    const secondsString = String(sec).padStart(2, '0');

                    const time = minutesString + ':' + secondsString;
                    results[0].time = time;
                    return res.status(200).send({ error: false, message: "Student successfully get available minute", data: results[0] });
                }
            })
        }
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "Get availble min api not working" });
    }
}

const updateAvailablemin = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            const { id, meetinglink, availablemin } = req.body;
            if (err) {
                return res.status(401).send({ error: true, message: "Multer not be use" });
            }
            else {
                if (meetinglink == 0 || id == 0 || availablemin == 0) {
                    return res.status(200).send({ error: true, message: "Please insert the all field" });
                }
                else {
                    dataBase.query('SELECT * From tbl_callhistory WHERE meeting_link = ?', [meetinglink], function (error, status, fields) {
                        if (status[0].status == 3) {
                            dataBase.query('SELECT * From tbl_parents WHERE student_id = ?', [id], function (error, parentfound, fields) {
                                if (parentfound == 0) {
                                    return res.status(401).send({ error: true, message: "student not found", data: null });
                                }
                                else {
                                    const talktime_minutes = parentfound[0].total_talktime - availablemin;
                                    dataBase.query('UPDATE tbl_parents SET total_talktime = ? WHERE student_id = ?', [talktime_minutes, id], function (error, updatemin, fields) {
                                        if (updatemin) {
                                            dataBase.query('SELECT * FROM tbl_student WHERE id = "' + parentfound[0].student_id + '"', function (error, studentfound, results) {
                                                if (studentfound == 0) {
                                                    return res.status(402).send({ error: true, message: "Student not found", data: null });
                                                }
                                                else {
                                                    const talktime_minutes = studentfound[0].total_talktime - availablemin;
                                                    dataBase.query('UPDATE tbl_student SET total_talktime = ? WHERE id = "' + studentfound[0].id + '"', [talktime_minutes], function (error, Updatemin, fields) {
                                                        if (Updatemin) {
                                                            return res.status(200).send({ error: false, message: "Time Successfully update" });
                                                        }
                                                        else {
                                                            return res.status(401).send({ error: true, message: "Time not successfully update", data: null });
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                        else {
                            return res.status(200).send({ error: true, message: "Available minutes not be update" });
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "Upadte Availbale min api not working" });
    }
}

const getSchedule = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            const { id } = req.body;
            if (err) {
                return res.status(401).send({ error: true, message: "Multer not working" });
            }
            else {
                dataBase.query('SELECT id,name,department_id From tbl_student WHERE id = ?', [id], function (error, results, fields) {
                    if (results == 0) {
                        return res.status(204).send({ error: true, message: "student schedule not found by id", data: null });
                    }
                    else {
                        dataBase.query('SELECT * from tbl_department_timeslots WHERE department_id = ?', [results[0].department_id], function (error, results, fields) {
                            if (results == 0) {
                                return res.status(204).send({ error: true, message: "student schedule not successfully get by id", data: null });
                            }
                            else {
                                var blank = [];
                                var full = [];
                                for (let i = 0; i < results.length; i++) {
                                    const element = results[i];
                                    if (element.start_time == "" || element.end_time == "" || element.start_time == "" && element.end_time == "") {
                                        blank.push(element);
                                    } else {
                                        full.push(element);
                                    }
                                }
                                return res.status(200).send({ error: false, message: "student schedule successfully get by id", data: full });
                            }
                        })
                    }
                })
            }
        })
    }
    catch (error) {
        return res.send(401).send({ error: true, message: "Api not working student schedule get" });
    }
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

const gettimeSchedule = (req, res, next) => {
    try {
        const { id } = req.body;
        dataBase.query('SELECT id,name,department_id From tbl_student WHERE id = ?', [id], function (error, results, fields) {
            if (results == 0) {
                return res.status(204).send({ error: true, message: "student schedule not found by id", data: null });
            } else {
                const weekend = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Satuarday"];
                const date_time = new Date();
                let day = weekend[date_time.getDay()];
                const currentTime = getCurrentTime();
                currentTime.then((value) => {
                    const stringValue = String(value);
                    dataBase.query('SELECT * From tbl_department_timeslots WHERE tbl_department_timeslots.department_id = "' + results[0].department_id + '" AND tbl_department_timeslots.day = "' + day + '" AND tbl_department_timeslots.start_time <= "' + stringValue + '" and tbl_department_timeslots.end_time >= "' + stringValue + '"', function (error, results, fields) {
                        if (results == 0) {
                            return res.status(200).send({ error: true, message: "This is not your login time", data: null });
                        } else {
                            return res.status(200).send({ error: false, message: "student schedule successfully get by id", data: results });
                        }
                    })
                })
            }
        })
    }
    catch (error) {
        return res.send(401).send({ error: true, message: "Api not working student schedule get" });
    }
}

const getWebScheduleById = (request, response, next) => {

    var id = request.params.id;

    var draw = request.query.draw;

    var start = request.query.start;

    var length = request.query.length;

    var order_data = request.query.order;

    if (typeof order_data == 'undefined') {
        var column_name = 'tbl_department_timeslots.id';
        var column_sort_order = 'desc';
    }
    else {
        var column_index = request.query.order[0]['column'];

        var column_name = request.query.columns[column_index]['data'];

        var column_sort_order = request.query.order[0]['dir'];
    }

    //search data

    var search_value = request.query.search['value'];

    var search_query = `
     (tbl_department_timeslots.day LIKE '%${search_value}%' 
     OR tbl_department_timeslots.start_time LIKE '%${search_value}%'
     OR tbl_department_timeslots.end_time LIKE '%${search_value}%'
     )
     `;

    //Total number of records without filtering

    dataBase.query('SELECT COUNT(*) as Total,tbl_department_timeslots.department_id AS department FROM tbl_student left join tbl_department_timeslots ON tbl_department_timeslots.department_id = tbl_student.department_id WHERE tbl_student.id = "' + id + '"', function (error, data) {

        var total_records = data[0].Total;


        //Total number of records with filtering

        dataBase.query(`SELECT COUNT(*) as Total,tbl_department_timeslots.department_id AS department FROM tbl_student left join tbl_department_timeslots ON tbl_department_timeslots.department_id = tbl_student.department_id WHERE tbl_student.id = '${id}' AND ${search_query}`, function (error, data) {
            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT tbl_department_timeslots.*,tbl_department_timeslots.department_id as depart_id,tbl_department_timeslots.day as day,tbl_department_timeslots.start_time as start_time,tbl_department_timeslots.end_time as end_time from tbl_student left join tbl_department_timeslots ON tbl_department_timeslots.department_id = tbl_student.department_id
            WHERE tbl_student.id = '${id}' AND ${search_query}
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

            var data_arr = [];

            dataBase.query(query, function (error, data) {

                data.forEach(function (row, index) {
                    data_arr.push({
                        'index': ++start,
                        'day': row.day,
                        'start_time': row.start_time,
                        'end_time': row.end_time,
                    });
                });

                var output = {
                    'draw': draw,
                    'iTotalRecords': total_records,
                    'iTotalDisplayRecords': total_records_with_filter,
                    'aaData': data_arr
                };

                // return response.status(200).send({error: false, message:"Data Successsfully Found", data: output})
                response.json(output);

            });

        });

    });
}

const parentLoginStatus = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(400).send({ error: true, message: "Multer not working", data: null });
            } else {
                const { id } = req.body;
                if (id == 0) {
                    return res.status(200).send({ error: true, message: "Please insert the student Id", data: null });
                } else {
                    dataBase.query('SELECT id, name, status From tbl_parents WHERE student_id = ?', [id], function (error, results, fields) {
                        if (results == 0) {
                            return res.status(401).send({ error: true, message: "Parents status not get", data: null });
                        }
                        else {
                            return res.status(200).send({ error: false, message: "Parents status get", data: results });
                        }
                    })
                }
            }
        })
    } catch (error) {
        return res.status(401).send({ error: true, message: "Api not working" });
    }
}

const parentWebLoginStatus = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(400).send({ error: true, message: "Please insert the student Id", data: null });
        } else {
            dataBase.query('SELECT * From tbl_parents WHERE student_id = ?', [id], function (error, results, fields) {
                if (results == 0) {
                    return res.status(200).send({ error: true, message: "Parents status not get", data: null });
                }
                else {
                    return res.status(200).send({ error: false, message: "Parents status get", data: results });
                }
            })
        }
    } catch (error) {
        return res.status(401).send({ error: true, message: "parentWebLoginStatus Api not working" });
    }
}

const studentLoginStatus = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            const id = req.params.id;
            if (err) {
                return res.status(400).send({ error: true, message: "Multer not working", data: null });
            }
            else {
                dataBase.query('SELECT id,name,status From tbl_student WHERE id = ?', [id], function (error, results, fields) {
                    if (results == 0) {
                        return res.status(204).send({ error: true, message: "Student status not found" });
                    }
                    else {
                        return res.status(200).send({ error: false, message: "Student status successfully get", data: results[0] });
                    }
                })
            }
        })
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "Api not working", data: null });
    }
}

const getParentById = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            const { id } = req.body;
            if (id == 0) {
                return res.status(401).send({ error: true, message: "Please insert id" });
            }
            else {
                dataBase.query('SELECT id,name,status from tbl_parents WHERE total_talktime != "' + 0 + '" AND student_id = ?', [id], function (error, results, fields) {
                    if (results == 0) {
                        return res.status(200).send({ error: true, message: "Parents not found" });
                    }
                    else {
                        return res.status(200).send({ error: false, message: "Parents successfully found", data: results });
                    }
                })
            }
        })
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "getParents Api not Working" });
    }
}

const getTarnsition = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(202).send({ error: true, message: "Multer not working" });
            }
            else {
                const { id } = req.body;
                if (id == 0) {
                    return res.status(200).send({ error: true, message: "Please insert parent id", data: null });
                }
                else {
                    dataBase.query('SELECT tbl_plan_purchase. id,plan_id,parent_id,student_id,plan_name,plan_price,(tbl_plan_purchase.plan_min/60) as plan_min,day,DATE_FORMAT(created_at, "%Y-%m-%d") as date,TIME_FORMAT(created_at,"%h:%i:%s") as time,updated_at From tbl_plan_purchase WHERE student_id = ?', [id], function (error, transition, fields) {
                        if (transition == 0) {
                            return res.status(200).send({ error: true, message: "Student transition not found", data: null });
                        }
                        else {
                            return res.status(200).send({ error: false, message: "Student Transition successfuly get", data: transition });
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "getTransition api not wprking" });
    }
}

const callhistory = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(401).send({ error: true, message: "Multer not working" });
            }
            else {
                const { id } = req.body;
                if (id == 0) {
                    return res.status(202).send({ error: true, message: "Please insert student id" });
                }
                else {
                    dataBase.query('SELECT id,student_id,student_name,parent_id,parent_name,CONCAT(LPAD(FLOOR(minute / 60),2,"0"), ":", LPAD(MOD(minute, 60),2,"0")) AS `minute`,day,DATE_FORMAT(created_at, "%Y-%m-%d") as date,TIME_FORMAT(created_at,"%h:%i:%s") as time,updated_at From tbl_callhistory WHERE student_id = ?', [id], function (error, results, fields) {
                        if (results == 0) {
                            return res.status(202).send({ error: true, message: "Student call history not successfully get", data: null });
                        }
                        else {
                            // var secTime = results[0].minute;
                            // var computeMinutes = Math.floor(secTime/60);
                            // var result = secTime % 60;
                            // const minutes = computeMinutes+':'+result;
                            // results[0].minutes = minutes;
                            return res.status(200).send({ error: false, message: "Student call history successfully get", data: results });

                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "Student get call history api not working" });
    }
}

const studentCall = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(402).send({ error: true, message: "Multer not be working" });
            }
            else {
                const { studentId, parentId, status } = req.body;
                if (studentId == 0 || parentId == 0) {
                    return res.status(402).send({ error: true, message: "Please insert studentId and parentId" });
                }
                else {
                    dataBase.query('SELECT id,name FROM tbl_student WHERE id = ?', [studentId], function (error, student, fields) {
                        if (student == 0) {
                            return res.status(402).send({ error: true, message: "Student not found", data: null });
                        }
                        else {
                            dataBase.query('SELECT id,name FROM tbl_parents WHERE id = ?', [parentId], function (error, parent, fields) {
                                if (parent == 0) {
                                    return res.status(402).send({ error: true, message: "Parent not found", data: null });
                                }
                                else {
                                    const meetinglink = 'plugintestroom' + student[0].id + parent[0].id;
                                    const sql = 'INSERT INTO tbl_callhistory (student_id,student_name,parent_id,parent_name,meeting_link,status) VALUES (?)';
                                    const VALUES = [student[0].id, student[0].name, parent[0].id, parent[0].name, meetinglink, status];
                                    dataBase.query(sql, [VALUES], function (error, insertcall, fields) {
                                        if (insertcall) {
                                            return res.status(200).send({ error: false, message: "add student Call history successfully", data: insertcall });
                                        }
                                        else {
                                            return res.status(202).send({ error: true, message: "student Call history not successfully add", data: error });
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "Student Call Log api not working" });
    }
}

const updateCallStatus = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(401).send({ error: true, message: "Multer not be working" });
            }
            else {
                const { id, status, availablemin } = req.body;
                if (id == 0 || status == 0) {
                    return res.status(402).send({ error: true, message: "Please insert id, status or another status" });
                }
                else {
                    if (status == 3) {
                        if (availablemin != 0) {
                            dataBase.query('UPDATE tbl_callhistory SET status = ?,minute = ? WHERE id = ?', [status, availablemin, id], function (error, updatemin, fields) {
                                if (availablemin) {
                                    return res.status(200).send({ error: false, message: "status and minute successfully update", data: availablemin });
                                }
                                else {
                                    return res.status(401).send({ error: true, message: "status and minute not successfully update" });
                                }
                            })
                        } else {
                            return res.status(201).send({ error: true, message: "Please insert available min" })
                        }
                    }
                    else {
                        dataBase.query('UPDATE tbl_callhistory SET status = ? WHERE id = ?', [status, id], function (error, update, fields) {
                            if (update) {
                                return res.status(401).send({ error: false, message: "Call history status update", data: update });
                            }
                            else {
                                return res.status(402).send({ error: true, message: "call history status not be update" });
                            }
                        })
                    }
                }
            }
        })
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "Upadte call status api not working" });
    }
}

const studentCallEnd = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(400).send({ error: true, message: "Multer not working" });
            }
            else {
                const { meetinglink, availablemin, status } = req.body;
                if (meetinglink == 0 || availablemin == 0 || status == 0) {
                    return res.status(200).send({ error: true, message: "All Field Required" });
                }
                else {
                    dataBase.query('SELECT * From tbl_callhistory WHERE meeting_link = ?', [meetinglink], function (error, callhistory, fileds) {
                        if (callhistory == 0) {
                            return res.status(200).send({ error: true, message: "Meetinglink not found", data: null });
                        }
                        else {
                            if (callhistory[0].status == 2) {
                                if (status == 3) {
                                    const sql = 'UPDATE `tbl_callhistory` SET `minute`= "' + availablemin + '",`status`= "' + status + '"  WHERE `meeting_link` = "' + meetinglink + '"';
                                    const VALUES = [availablemin, status];
                                    dataBase.query(sql, [VALUES], function (error, results, fields) {
                                        if (results) {
                                            dataBase.query('SELECT * From tbl_parents WHERE student_id = ?', [callhistory[0].student_id], function (error, parentfound, fields) {
                                                if (parentfound == 0) {
                                                    return res.status(401).send({ error: true, message: "student not found", data: null });
                                                }
                                                else {
                                                    const talktime_minutes = parentfound[0].total_talktime - availablemin;
                                                    dataBase.query('UPDATE tbl_parents SET total_talktime = ? WHERE student_id = ?', [talktime_minutes, callhistory[0].student_id], function (error, updatemin, fields) {
                                                        if (updatemin) {
                                                            dataBase.query('SELECT * FROM tbl_student WHERE id = "' + parentfound[0].student_id + '"', function (error, studentfound, results) {
                                                                if (studentfound == 0) {
                                                                    return res.status(402).send({ error: true, message: "Student not found", data: null });
                                                                }
                                                                else {
                                                                    const talktime_minutes = studentfound[0].total_talktime - availablemin;
                                                                    dataBase.query('UPDATE tbl_student SET total_talktime = ? WHERE id = "' + studentfound[0].id + '"', [talktime_minutes], function (error, Updatemin, fields) {
                                                                        if (Updatemin) {
                                                                            return res.status(200).send({ error: false, message: "Time Successfully update" });
                                                                        }
                                                                        else {
                                                                            return res.status(401).send({ error: true, message: "Time not successfully update", data: null });
                                                                        }
                                                                    })
                                                                }
                                                            })
                                                        }
                                                    })
                                                }
                                            })
                                        }
                                        else {
                                            return res.status(200).send({ error: true, message: "Available min and status not successfuly update" })
                                        }
                                    })
                                }
                                else {
                                    return res.status(200).send({ error: true, message: "Please insert status 3" });
                                }
                            }
                            else {
                                return res.status(200).send({ error: true, message: "Parent not be call attend" });
                            }
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "Student call end api not working" });
    }
}

// const getTransWebById = (req, res, next) => {
//     try {
//         const id = req.params.id;
//         if (id == 0) {
//             return res.status(400).send({ error: true, message: "Please insert the Id" });
//         }
//         else {
//             dataBase.query('SELECT tbl_plan_purchase. id,plan_id,parent_id,student_id,plan_name,plan_price,(tbl_plan_purchase.plan_min/60) as plan_min,day,DATE_FORMAT(created_at, "%Y-%m-%d") as date,TIME_FORMAT(created_at,"%h:%i:%s") as time,updated_at From tbl_plan_purchase WHERE student_id = ?', [id], function (error, findPlan, fields) {
//                 if (findPlan == 0) {
//                     return res.status(200).send({ error: true, message: "Plan not be successfully get", data: null });
//                 } else {
//                     return res.status(200).send({ error: false, message: "Plan successfully get", data: findPlan })
//                 }
//             })
//         }
//     }
//     catch (error) {
//         return res.status(400).send({ error: true, message: "getTransWebById api not working" });
//     }
// }

const getTransWebById = (request, response, next) => {

    var id = request.params.id;
    // console.log("id =>",id);

    var draw = request.query.draw;

    var start = request.query.start;

    var length = request.query.length;

    var order_data = request.query.order;

    if (typeof order_data == 'undefined') {
        var column_name = 'tbl_plan_purchase.id';
        var column_sort_order = 'desc';
    }
    else {
        var column_index = request.query.order[0]['column'];

        var column_name = request.query.columns[column_index]['data'];

        var column_sort_order = request.query.order[0]['dir'];
    }

    //search data

    var search_value = request.query.search['value'];

    var search_query = `(tbl_plan_purchase.plan_name LIKE '%${search_value}%'
    OR tbl_plan_purchase.plan_min/60 LIKE '%${search_value}%'
    OR tbl_plan_purchase.plan_price LIKE '%${search_value}%'
    OR tbl_student.name LIKE '%${search_value}%'
    )`
    // "OR tbl_student.name LIKE '%" + search_value +"%'"

    //Total number of records without filtering

    dataBase.query('SELECT COUNT(*) AS Total FROM tbl_plan_purchase WHERE tbl_plan_purchase.student_id = "' + id + '"', function (error, data) {
        var total_records = data[0].Total;

        //Total number of records with filtering

        dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_plan_purchase WHERE tbl_plan_purchase.student_id = '${id}'`, function (error, data) {

            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT tbl_plan_purchase. id,plan_id,parent_id,student_id,plan_name,plan_price,(tbl_plan_purchase.plan_min/60) as plan_min,day,TIME_FORMAT(tbl_plan_purchase.created_at,"%h:%i:%s") as time,DATE_FORMAT(tbl_plan_purchase.created_at, "%Y-%m-%d") as date,tbl_student.name as student_name from tbl_plan_purchase left join tbl_student ON tbl_student.id = tbl_plan_purchase.student_id WHERE tbl_plan_purchase.student_id = '${id}' AND ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

            var data_arr = [];

            dataBase.query(query, function (error, data) {
                data.forEach(function (row, index) {
                    data_arr.push({
                        'index': ++start,
                        'date': row.date,
                        'student_name': row.student_name,
                        'plan_name': row.plan_name,
                        'plan_price': row.plan_price,
                        'plan_min': row.plan_min,
                    });
                });

                var output = {
                    'draw': draw,
                    'iTotalRecords': total_records,
                    'iTotalDisplayRecords': total_records_with_filter,
                    'aaData': data_arr
                };

                // return response.status(200).send({error: false, message:"Data Successsfully Found", data: output})
                response.json(output);

            });

        });

    });

};

// const getwebCallHistory = (req, res, next) => {
//     try {
//         const id = req.params.id;
//         if (id == 0) {
//             return res.status(400).send({ error: true, message: "Please insert the Id" });
//         } else {
//             dataBase.query('SELECT * From tbl_callhistory WHERE student_id = ?', [id], function (error, findCallHistory, fields) {
//                 if (findCallHistory == 0) {
//                     return res.status(200).send({ error: true, message: "Student callhistory not found", data: null });
//                 } else {
//                     return res.status(200).send({ error: false, message: "Student callhistory successfully found", data: findCallHistory });
//                 }
//             })
//         }
//     }
//     catch (error) {
//         return res.status(400).send({ error: true, message: "getwebCallHistory api not working" });
//     }
// }

const getwebCallHistory = (request, response, next) => {

    var id = request.params.id;

    var draw = request.query.draw;

    var start = request.query.start;

    var length = request.query.length;

    var order_data = request.query.order;

    if (typeof order_data == 'undefined') {
        var column_name = 'tbl_callhistory.id';
        var column_sort_order = 'desc';
    }
    else {
        var column_index = request.query.order[0]['column'];

        var column_name = request.query.columns[column_index]['data'];

        var column_sort_order = request.query.order[0]['dir'];
    }

    //search data

    var search_value = request.query.search['value'];

    var search_query = `(tbl_callhistory.student_name LIKE '%${search_value}%'
    OR tbl_callhistory.parent_name LIKE '%${search_value}%'
    )`;

    //Total number of records without filtering

    dataBase.query('SELECT COUNT(*) AS Total FROM tbl_callhistory WHERE tbl_callhistory.student_id = "' + id + '"', function (error, data) {
        var total_records = data[0].Total;

        //Total number of records with filtering

        dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_callhistory WHERE tbl_callhistory.student_id = '${id}'`, function (error, data) {
            // console.log("error =>",error);
            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT id,student_id,student_name,parent_id,parent_name,CONCAT(LPAD(FLOOR(minute / 60),2,"0"), ":", LPAD(MOD(minute, 60),2,"0")) AS minute,DATE_FORMAT(created_at, "%Y-%m-%d") as date,TIME_FORMAT(created_at,"%h:%i:%s") as time,updated_at From tbl_callhistory WHERE student_id = '${id}' AND ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

            var data_arr = [];

            dataBase.query(query, function (error, data) {
                data.forEach(function (row, index) {
                    data_arr.push({
                        'index': ++start,
                        'date': row.date,
                        'student_name': row.student_name,
                        'parent_name': row.parent_name,
                        'minute': row.minute,
                    });
                });

                var output = {
                    'draw': draw,
                    'iTotalRecords': total_records,
                    'iTotalDisplayRecords': total_records_with_filter,
                    'aaData': data_arr
                };

                // return response.status(200).send({error: false, message:"Data Successsfully Found", data: output})
                response.json(output);

            });

        });

    });

};

const studentIssue = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (!err) {
                const { student_id, subject, message, status } = req.body;
                if (student_id == 0 || subject == 0 || message == 0 || status == 0) {
                    return res.status(200).send({ error: true, message: "Please insert the all fileds" });
                } else {
                    dataBase.query('SELECT * From tbl_student WHERE id = "' + student_id + '"', function (error, findStudent, fields) {
                        if (findStudent == 0) {
                            return res.status(200).send({ error: true, message: "Student not found", data: null });
                        } else {
                            const sql = 'INSERT INTO tbl_student_issue (student_id,student_name,subject,message,status) VALUES (?)'
                            const Values = [student_id, findStudent[0].name, subject, message, status];
                            dataBase.query(sql, [Values], function (error, insertIssue, fields) {
                                if (insertIssue == 0) {
                                    return res.status(200).send({ error: true, message: "Student issue not insert", data: null });
                                } else {
                                    return res.status(200).send({ error: false, message: "Student issue successfully insert", data: insertIssue });
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
        return res.status(400).send({ error: true, message: "studentIssue api not working" });
    }
}

// const getStudentIssue = (req, res, next) => {
//     try {
//         dataBase.query('SELECT tbl_student_issue.*, tbl_student.name as student_name from tbl_student_issue left join tbl_student ON tbl_student.id = tbl_student_issue.student_id', function (error, getIssue, fields) {
//             if (getIssue == 0) {
//                 return res.status(200).send({ error: true, message: "student issue not found", data: null });
//             } else {
//                 return res.status(200).send({ error: false, message: "student issue successfully found", data: getIssue });
//             }
//         })
//     } catch (error) {
//         return res.status(200).send({ error: true, message: "get student issue api not working" });
//     }
// }

const getStudentIssue = (request, response, next) => {

    var draw = request.query.draw;

    var start = request.query.start;

    var length = request.query.length;

    var order_data = request.query.order;

    if (typeof order_data == 'undefined') {
        var column_name = 'tbl_student_issue.id';
        var column_sort_order = 'desc';
    }
    else {
        var column_index = request.query.order[0]['column'];

        var column_name = request.query.columns[column_index]['data'];

        var column_sort_order = request.query.order[0]['dir'];
    }

    //search data

    var search_value = request.query.search['value'];

    var search_query = `
     AND (student_name LIKE '%${search_value}%' 
     OR subject LIKE '%${search_value}%' 
     OR message LIKE '%${search_value}%'
     )
     `;

    //Total number of records without filtering

    dataBase.query("SELECT COUNT(*) AS Total FROM tbl_student_issue", function (error, data) {

        var total_records = data[0].Total;

        //Total number of records with filtering

        dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_student_issue WHERE 1 ${search_query}`, function (error, data) {
            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT tbl_student_issue.*, tbl_student.student_roll_no FROM tbl_student_issue LEFT JOIN tbl_student ON tbl_student_issue.student_id = tbl_student.id
            WHERE 1 ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

            var data_arr = [];

            dataBase.query(query, function (error, data) {
                data.forEach(function (row, index) {
                    data_arr.push({
                        '_ref': { student: row.student_id },
                        'index': ++start,
                        'student_name': row.student_name,
                        'roll_no': row.student_roll_no,
                        'subject': row.subject,
                        'message': row.message,
                    });
                });

                var output = {
                    'draw': draw,
                    'iTotalRecords': total_records,
                    'iTotalDisplayRecords': total_records_with_filter,
                    'aaData': data_arr
                };

                response.json(output);

            });

        });

    });

};

const getStatusByStudentId = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(200).send({ error: true, message: "Multer errror" });
            }
            else {
                const { id } = req.body;
                if (id == 0) {
                    return res.status(200).send({ error: true, message: "Please insert the id" });
                }
                else {
                    dataBase.query('select id, student_name, status from tbl_callhistory WHERE student_id = "' + id + '" ORDER BY id DESC LIMIT 1', function (error, results, fields) {
                        if (results == 0) {
                            return res.status(200).send({ error: true, message: "student status not successfully get", data: null });
                        }
                        else {
                            return res.status(200).send({ error: false, message: "student status successfully found", data: results[0] });
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "Api not working" });
    }
}

const updateStudentStatus = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(200).send({ error: true, message: "Multer not be working" });
            }
            else {
                const { meetinglink, status } = req.body;
                if (meetinglink == 0 || status == 0) {
                    return res.status(200).send({ error: true, message: "Please insert meetinglink and status" });
                }
                else {
                    dataBase.query('SELECT * From tbl_callhistory WHERE meeting_link = ?', [meetinglink], function (error, getStatus, fields) {
                        if (getStatus == 0) {
                            return res.status(200).send({ error: true, message: "Mettinglonk not found", data: null });
                        }
                        else {
                            if (getStatus[0].status == 3) {
                                return res.status(200).send({ error: true, message: "call already ended" });
                            }
                            else {
                                dataBase.query('UPDATE tbl_callhistory SET status = ? WHERE meeting_link = ?', [status, meetinglink], function (error, updateStatus, fields) {
                                    if (updateStatus) {
                                        // dataBase.query('UPDATE tbl_parents SET status = "' + status + '" where id = "' + getStatus[0].parent_id + '"', function (error, statusUpdate, fields) {
                                        //     if (statusUpdate) {
                                        return res.status(200).send({ error: false, message: "Parent call accept", data: updateStatus });
                                        //     }
                                        // });
                                    }
                                    else {
                                        return res.status(200).send({ error: true, message: "Parent call not accept", data: null });
                                    }
                                })
                            }
                        }
                    })
                }
            }
        })
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "Update Student Status api not working" });
    }
}

// const getStudentSummary = (req, res, next) => {
//     try {
//         dataBase.query('SELECT tbl_student.*,CONCAT(FLOOR(tbl_student.total_talktime / 60)) AS `talk_time_min`, tbl_franchise.franchiseName as franchise_name,tbl_department.name as department_name, (SELECT CONCAT(FLOOR((SUM(`minute`))/60)) as m FROM `tbl_callhistory` WHERE `student_id`=tbl_student.id) as used_min from tbl_student left join tbl_franchise ON tbl_franchise.Id = tbl_student.franchise_id left join tbl_department ON tbl_department.id = tbl_student.department_id', function (error, getStudent, fields) {
//             if (getStudent == 0) {
//                 return res.status(200).send({ error: true, message: "Students not found", data: null });
//             } else {
//                 return res.status(200).send({ error: true, message: "Students found", data: getStudent });

//             }
//         })
//     } catch (error) {
//         return res.status(200).send({ error: true, message: "get student summary api not working", data: null });
//     }
// }

const getStudentSummary = (request, response, next) => {

    var draw = request.query.draw;

    var start = request.query.start;

    var length = request.query.length;

    var order_data = request.query.order;

    if (typeof order_data == 'undefined') {
        var column_name = 'tbl_student.id';
        var column_sort_order = 'desc';
    }
    else {
        var column_index = request.query.order[0]['column'];

        var column_name = request.query.columns[column_index]['data'];

        var column_sort_order = request.query.order[0]['dir'];
    }

    //search data

    var search_value = request.query.search['value'];

    var search_query = `
     (tbl_student.name LIKE '%${search_value}%' 
     OR student_roll_no LIKE '%${search_value}%'
     )
     `;

    //Total number of records without filtering

    dataBase.query("SELECT COUNT(*) AS Total FROM tbl_student", function (error, data) {

        var total_records = data[0].Total;


        //Total number of records with filtering

        dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_student WHERE ${search_query}`, function (error, data) {
            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT tbl_student.*,CONCAT(FLOOR(tbl_student.total_talktime / 60)) AS talk_time_min, tbl_franchise.franchiseName as franchise_name,tbl_department.name as department_name, (SELECT CONCAT(FLOOR((SUM(minute))/60)) as m FROM tbl_callhistory WHERE student_id=tbl_student.id) as used_min from tbl_student left join tbl_franchise ON tbl_franchise.Id = tbl_student.franchise_id left join tbl_department ON tbl_department.id = tbl_student.department_id
            WHERE ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

            var data_arr = [];

            dataBase.query(query, function (error, data) {
                data.forEach(function (row, index) {
                    data_arr.push({
                        '_ref': { name: 'student', student: row.id, franchise: row.franchise_id, department: row.department_id },
                        'index': ++start,
                        'name': row.name,
                        'student_roll_no': row.student_roll_no,
                        'franchise_name': row.franchise_name,
                        'department_name': row.department_name,
                        'talk_time_min': row.talk_time_min,
                        'used_min': row.used_min,
                    });
                });

                var output = {
                    'draw': draw,
                    'iTotalRecords': total_records,
                    'iTotalDisplayRecords': total_records_with_filter,
                    'aaData': data_arr
                };

                // return response.status(200).send({error: false, message:"Data Successsfully Found", data: output})
                response.json(output);

            });

        });

    });

};

const getStudentFranchiseId = (req, res, next) => {
    try {
            const id = req.params.id;
            if (id == '') {
                return res.status(400).send({ error: true, message: "Please select the franchise", data: null });
            }
            else {
                dataBase.query('SELECT * From tbl_student WHERE franchise_id = "'+id+'"', function (error, results, fields) {
                    if (results == 0) {
                        return res.status(204).send({ error: true, message: "Student status not found" });
                    }
                    else {
                        return res.status(200).send({ error: false, message: "Student successfully get", data: results });
                    }
                })
            }
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "Api not working", data: null });
    }
}

module.exports = { getTarnsition, getWebScheduleById, getAvailablemin, getWebAvailbalemin, updateAvailablemin, getSchedule, gettimeSchedule, parentWebLoginStatus, parentLoginStatus, studentLoginStatus, getParentById, callhistory, studentCall, updateCallStatus, studentCallEnd, getTransWebById, getwebCallHistory, studentIssue, getStudentIssue, getStatusByStudentId, updateStudentStatus, getStudentSummary, getStudentFranchiseId };