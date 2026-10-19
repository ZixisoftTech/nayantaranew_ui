const dataBase = require('../../config/db');
const { personName } = require('../lists');

const addStudents = (req, res, next) => {
    try {
        const data = req.body;
        const parent = req.body.parent;
        if (data.franchise_id == 0 || data.department_id == 0 || data.name == 0 || data.student_roll_no == 0 || data.password == 0 || data.confirmpassword == 0) {
            return res.status(200).send({ error: true, message: "Please insert all field", data: null });
        } else {
            dataBase.query('SELECT * From tbl_student WHERE franchise_id = "' + data.franchise_id + '" AND student_roll_no = "' + data.student_roll_no + '"', function (error, findcontact, fields) {
                if (findcontact != 0) {
                    return res.status(200).send({ error: true, message: "student roll number already exists", data: null });
                } else {
                    const value = parent.map(item => item.contact);
                    dataBase.query('SELECT * from tbl_parents WHERE franchise_id = "' + data.franchise_id + '" AND contact in (?)', [value], function (error, results, fields) {
                        if (results != 0) {
                            return res.status(200).send({ error: true, message: "Parent contact number already exists" });
                        } else {
                            const VALUES = [data.franchise_id, data.department_id, data.name, data.student_roll_no, data.email, data.contact, data.password];
                            dataBase.query('INSERT INTO tbl_student (franchise_id,department_id,name,student_roll_no,email,contact,password) VALUES (?)', [VALUES], function (error, student, fields) {
                                if (student == 0) {
                                    return res.status(200).send({ error: true, message: "Stuent not successfully added", data: null });
                                } else {
                                    for (let i = 0; i < parent.length; i++) {
                                        parent[i]["student_id"] = student.insertId;
                                    }
                                    var conatcts = [];
                                    var parents = [];
                                    parent.forEach(element => {
                                        if (element.contact == '') {
                                            conatcts.push(element)
                                        }
                                        else {
                                            parents.push(element)
                                        }
                                    });
                                    const VALUES = parents.map(item => [data.franchise_id, item.student_id, item.name, item.contact, item.email, item.password]);
                                    dataBase.query('INSERT INTO tbl_parents (franchise_id,student_id,name,contact,email,password) VALUES ?', [VALUES], function (error, parent, fields) {
                                        if (parent == 0) {
                                            return res.status(200).send({ error: true, message: "Parent not successfuly added", data: null });
                                        } else {
                                            return res.status(200).send({ error: false, message: "Data successfully added", data: parent });
                                        }
                                    });
                                }
                            })
                        }
                    })
                }
            })
        }
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "AddStudent api not working" });
    }
}

const getSubscription = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert the Id" });
        }
        else {
            dataBase.query('SELECT *,(tbl_subscriptions.talktime_minutes/60) as talk_time from tbl_subscriptions WHERE franchise_id = ?', [id], function (error, findSubscription, fields) {
                if (findSubscription == 0) {
                    return res.status(200).send({ error: true, message: "subscriptions data not found", data: null });
                }
                else {
                    return res.status(200).send({ error: false, message: "Subscriptions data successfully found", data: findSubscription });
                }
            })
        }
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "getSubscriptionById api not working" });
    }
}

const getFranchise = (req, res, next) => {
    try {
        const findFranchise = 'SELECT * from tbl_franchise';
        dataBase.query(findFranchise, (error, results, fields) => {
            if (results.length > 0) {
                res.send(results);
            } else {
                res.send("Data Not Found");
            }
        })
    } catch (error) {
        res.send(error);
    }
}

const getDepartmentById = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert the Id" });
        }
        else {
            dataBase.query('SELECT * From tbl_department where franchise_id = ?', [id], function (error, findFranchise, fields) {
                if (findFranchise == 0) {
                    return res.status(200).send({ error: true, message: "Frsnchise Not Found", data: null });
                } else {
                    dataBase.query('SELECT * From tbl_department WHERE franchise_id = "' + findFranchise[0].franchise_id + '"', function (error, departmentName, fields) {
                        return res.status(200).send({ error: false, message: "Department successfully found", data: departmentName });
                    })
                }
            })
        }
    } catch (err) {
        return { message: err, status: 400 };
    }
}

const departmentGetById = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert the Id" });
        }
        else {
            dataBase.query('SELECT * From tbl_department where id = ?', [id], function (error, findFranchise, fields) {
                if (findFranchise == 0) {
                    return res.status(200).send({ error: true, message: "Departmemnt Not Found", data: null });
                } else {
                    return res.status(200).send({ error: false, message: "Department successfully found", data: findFranchise });
                }
            })
        }
    } catch (error) {
        return res.status(401).send({ error: true, message: "Department By id api not working" });
    }
}


const deleteStudents = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.send(200).send({ error: true, message: "Please provide id" });
        } else {
            dataBase.query('DELETE tbl_student,tbl_parents FROM tbl_student LEFT JOIN tbl_parents ON tbl_student.id = tbl_parents.student_id WHERE tbl_student.id = "' + id + '"', function (error, results, fields) {
                if (results == 0) {
                    return res.status(200).send({ error: true, message: "Data not deleted", data: null });
                } else {
                    return res.status(200).send({ error: false, message: "Data successfully deleted", data: null });
                }
            })
        }
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "student delete api not working" });
    }
}

async function deleteData(students_id) {
    return new Promise((resolve, reject) => {
        dataBase.query('DELETE tbl_student,tbl_parents FROM tbl_student LEFT JOIN tbl_parents ON tbl_student.id = tbl_parents.student_id WHERE tbl_student.id = "' + students_id + '"', function (error, parents, fields) {
            return error ? reject(error) : resolve(parents)
        });
    })
}

const bulkDelete = (req, res, next) => {
    try {
        const { studentid } = req.body;
        const student_ids = JSON.parse(studentid);
        if (student_ids == 0) {
            return res.status(200).send({ error: true, message: "Please provide id" });
        } else {
            student_ids.map(async (student_id, key) => {
                deleteData(student_id);
            })
            return res.status(200).send({ error: false, message: "Data successfully deleted", data: null });
        }
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "student delete api not working" });
    }
}

async function updateDepartment(students_id, departmentId) {
    return new Promise((resolve, reject) => {
        dataBase.query('UPDATE `tbl_student` SET `department_id`= "' + departmentId + '" WHERE `id`= "' + students_id + '"', function (error, parents, fields) {
            return error ? reject(error) : resolve(parents)
        });
    })
}

const bulkDepartmentUpdate = (req, res, next) => {
    try {
        const { studentid, departmentId } = req.body;
        const student_ids = JSON.parse(studentid);
        if (student_ids == 0 || departmentId == 0) {
            return res.status(200).send({ error: true, message: "Please insert studentid and departmentId" });
        } else {
            student_ids.map(async (student_id, key) => {
                await updateDepartment(student_id, departmentId);
            })
            return res.status(200).send({ error: false, message: "Department successfully update", data: null })
        }
    } catch (error) {
        return res.status(200).send({ error: true, message: "student bulk department update api not working" });
    }
}

const getStudentsByDepartmentId = (request, response, next) => {

    var id = request.query.id;

    if (id == 0 || id == "") {
        var draw = request.query.draw;
        var output = {
            'draw': draw,
            'iTotalRecords': 0,
            'iTotalDisplayRecords': 0,
            'aaData': []
        };
        response.json(output);
    } else {
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
     OR tbl_student.student_roll_no LIKE '%${search_value}%'
     OR tbl_student.contact LIKE '%${search_value}%'
     OR tbl_student.email LIKE '%${search_value}%' 
     )
     `;

        //Total number of records without filtering

        dataBase.query('SELECT COUNT(*) AS Total FROM tbl_student WHERE tbl_student.department_id = "' + id + '"', function (error, data) {

            var total_records = data[0].Total;


            //Total number of records with filtering

            dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_student WHERE tbl_student.department_id = ${id} AND ${search_query}`, function (error, data) {
                var total_records_with_filter = data[0].Total;

                var query = `
                SELECT tbl_student.*,CONCAT(FLOOR(tbl_student.total_talktime / 60)) as minutes,tbl_department.name as department_name,tbl_franchise.franchiseName as franchise_name from tbl_student left join tbl_department ON tbl_department.id = tbl_student.department_id LEFT JOIN tbl_franchise ON tbl_franchise.Id = tbl_student.franchise_id WHERE tbl_student.department_id = ${id} AND ${search_query}
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

                var data_arr = [];

                dataBase.query(query, function (error, data) {
                    data.forEach(function (row, index) {
                        var action = `<a href="javascript:void(0);" 
                    data-toggle="modal" data-target=".edit"
                    class="btn-sm" onclick="getMin(${row.id})" > <i
                        class="bx bx-edit-alt"></i> </a>`;

                        data_arr.push({
                            '_ref': { name: 'student', student: row.id, franchise: row.franchise_id, department: row.department_id },
                            'index': ++start,
                            'name': row.name,
                            'roll_no': row.student_roll_no,
                            'contact': row.contact,
                            'email': row.email,
                            'minutes': row.minutes,
                            'franchise_name': row.franchise_name,
                            'department_name': row.department_name,
                            'action': action
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
    }
}

const getStudentParent = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert All Field" });
        }
        else {
            dataBase.query('SELECT tbl_student.*,tbl_department.name as department_name,tbl_parents.name as parent_name,tbl_parents.contact as number, tbl_parents.email as mail, tbl_parents.password as pass from tbl_student left join tbl_department ON tbl_department.id = tbl_student.department_id LEFT JOIN tbl_parents ON tbl_parents.student_id = tbl_student.id WHERE tbl_student.id = "' + id + '"', function (error, findStudent, fields) {
                if (findStudent == 0) {
                    return res.status(200).send({ error: true, message: "Students not found", data: null });
                }
                else {
                    return res.status(200).send({ error: false, message: "Student Successfully found", data: findStudent })
                }
            });
        }
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "getDepartment Api not working" });
    }
}

const editStudentsById = (req, res, next) => {
    try {
        const id = req.body.id;
        const data = req.body;
        const parent = req.body.parent;
        if (id == 0 || data.department_id == 0 || data.name == 0) {
            return res.status(200).send({ error: true, message: "Please all field required" });
        } else {
            const sql = 'UPDATE tbl_student SET `department_id`= "' + data.department_id + '",`name` = "' + data.name + '",`email` = "' + data.email + '",`contact` = "' + data.contact + '",`password` = "' + data.password + '" WHERE id = "' + id + '"';
            dataBase.query(sql, function (error, student, fields) {
                if (student == 0) {
                    return res.status(200).send({ error: true, message: "Stuent data not be update", data: null });
                } else {
                    dataBase.query('DELETE FROM tbl_parents WHERE student_id = ?', [id], function (error, results, fields) {
                        if (results == 0) {
                            return res.status(200).send({ error: true, message: "Data not successfully deleted" });
                        } else {
                            dataBase.query('SELECT * from tbl_student WHERE id = "' + id + '"', function (error, findStudent, fields) {
                                if (findStudent == 0) {
                                    return res.status(200).send({ error: true, message: "Student not found", data: null });
                                } else {
                                    const value = parent.map(item => item.contact);
                                    dataBase.query('SELECT * FROM tbl_parents WHERE franchise_id = ? AND contact IN (?)', [data.franchise_id, value], function (error, results, fields) {
                                        if (error) {
                                            console.error(error);
                                            return res.status(500).send({ error: true, message: "Error occurred during parent contact number check" });
                                        }

                                        if (results.length > 0) {
                                            return res.status(200).send({ error: true, message: "Parent contact number already exists" });
                                        } else {
                                            parent.forEach(item => {
                                                item.student_id = id;
                                            });

                                            const contacts = parent.filter(item => item.contact === '');
                                            const parents = parent.filter(item => item.contact !== '');

                                            const sql = 'INSERT INTO tbl_parents (franchise_id, name, contact, email, password, student_id, total_talktime) VALUES ?';
                                            const VALUES = parents.map(item => [findStudent[0].franchise_id, item.name, item.contact, item.email, item.password, item.student_id, findStudent[0].total_talktime]);

                                            dataBase.query(sql, [VALUES], function (error, parent, fields) {
                                                if (error) {
                                                    console.error(error);
                                                    return res.status(500).send({ error: true, message: "Error occurred during parent insertion" });
                                                }

                                                return res.status(200).send({ error: false, message: "Parent data successfully added", data: parent });
                                            });
                                        }
                                    });

                                }
                            });
                        }
                    })
                }
            })
        }
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "AddStudent api not working" });
    }
}


const statusDeactive = (req, res, next) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert All field" });
        }
        else {
            dataBase.query('SELECT * From tbl_student WHERE id = ?', [id], function (error, results, fields) {
                if (results == 0) {
                    return res.status(200).send({ err: true, message: "Student not found", data: null });
                } else {
                    dataBase.query('UPDATE tbl_student SET login_status = ? WHERE id = "' + results[0].id + '"', [status], (error, results, fields) => {
                        if (results) {
                            return res.status(200).send({ error: false, message: "status successfully update" });
                        }
                        else {
                            return res.status(200).send({ error: false, message: "status not successfully update" });
                        }
                    })
                }
            })
        }
    } catch (error) {
        res.send(error);
    }
}

async function updateStatus(student_id, status) {
    return new Promise((resolve, reject) => {
        dataBase.query('UPDATE tbl_student SET login_status = "' + status + '" WHERE id = "' + student_id + '"', function (error, parents, fields) {
            return error ? reject(error) : resolve(parents)
        });
    })
}

const bulkStatusUpdate = (req, res, next) => {
    try {
        const { studentid, status } = req.body;
        const student_ids = JSON.parse(studentid);
        if (student_ids == 0) {
            return res.status(200).send({ error: true, message: "Please insert All field" });
        }
        else {
            student_ids.map(async (student_id, key) => {
                await updateStatus(student_id, status);
            })
            return res.status(200).send({ error: false, message: "Status successfully update", data: null })
        }
    } catch (error) {
        res.send(error);
    }
}

const departmentDay = (req, res, next) => {
    try {
        const findDay = 'SELECT day1,day2,day3,day4,day5,day6,day7 FROM tbl_department';
        dataBase.query(findDay, (error, results, fields) => {
            if (results.length == 0) {
                res.send("Department day is not found");
            } else {
                res.send(results);
            }
        })
    } catch (error) {
        res.send("Api Not Working");
    }
}

const getByStudentId = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert the id" });
        } else {
            dataBase.query('SELECT *, CONCAT(FLOOR(tbl_student.total_talktime / 60)) as talk_time from tbl_student where id = "' + id + '"', function (error, findStudent, fields) {
                if (findStudent == 0) {
                    return res.status(200).send({ error: true, message: "Student not found", data: null });
                } else {
                    return res.status(200).send({ error: false, message: "Student successfully found", data: findStudent[0] });
                }
            })
        }
    } catch (error) {
        return res.status(200).send({ error: true, message: "getByStudentId api not working", data: null });
    }
}

const getCallHistoryByStudentId = (request, response, next) => {

    var id = request.query.id;

    var start_date = request.query.start_date;

    var end_date = request.query.end_date;

    if (id == 0 || id == "") {
        var draw = request.query.draw;
        var output = {
            'draw': draw,
            'iTotalRecords': 0,
            'iTotalDisplayRecords': 0,
            'aaData': []
        };
        response.json(output);
    } else {
        if (start_date != 0 || start_date != "" && end_date != 0 || end_date != "") {

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

            var search_query = `
            AND (student_name LIKE '%${search_value}%'
            )
            `;

            //Total number of records without filtering

            dataBase.query("SELECT COUNT(*) AS Total FROM tbl_callhistory", function (error, data) {

                var total_records = data[0].Total;

                //Total number of records with filtering

                dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_callhistory WHERE DATE(tbl_callhistory.created_at) BETWEEN '${start_date}' AND '${end_date}' ${search_query}`, function (error, data) {

                    var total_records_with_filter = data[0].Total;

                    var query = `
                    SELECT *,CCONCAT(LPAD(FLOOR(minute / 60),2,"0"), ":", LPAD(MOD(minute, 60),2,"0")) as minutes,DATE_FORMAT(tbl_callhistory.created_at, "%d-%m-%Y") as dates,DATE_FORMAT(tbl_callhistory.created_at,'%H:%i:%s') as times from tbl_callhistory WHERE tbl_callhistory.student_id = ${id} AND DATE(tbl_callhistory.created_at) BETWEEN '${start_date}' AND '${end_date}' ${search_query} 
                ORDER BY ${column_name} ${column_sort_order} 
                LIMIT ${start}, ${length}
                `;

                    var data_arr = [];

                    dataBase.query(query, function (error, data) {
                        data.forEach(function (row, index) {
                            data_arr.push({
                                '_ref': { student: row.student_id, parent: row.parent_id },
                                'index': ++start,
                                'date': row.dates + ' and ' + row.times,
                                'student_name': row.student_name,
                                'parent_name': row.parent_name,
                                'minutes': row.minutes
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
        } else {
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

            var search_query = `
            AND (student_name LIKE '%${search_value}%'
            )
            `;

            //Total number of records without filtering

            dataBase.query("SELECT COUNT(*) AS Total FROM tbl_callhistory", function (error, data) {

                var total_records = data[0].Total;

                //Total number of records with filtering

                dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_callhistory WHERE 1 ${search_query}`, function (error, data) {

                    var total_records_with_filter = data[0].Total;

                    var query = `
                    SELECT *,CONCAT(LPAD(FLOOR(minute / 60),2,"0"), ":", LPAD(MOD(minute, 60),2,"0")) as minutes,DATE_FORMAT(tbl_callhistory.created_at, "%d-%m-%Y") as dates,DATE_FORMAT(tbl_callhistory.created_at,'%H:%i:%s') as times from tbl_callhistory WHERE tbl_callhistory.student_id = ${id} ${search_query} 
                    ORDER BY ${column_name} ${column_sort_order} 
                    LIMIT ${start}, ${length}
                    `;

                    var data_arr = [];

                    dataBase.query(query, function (error, data) {
                        data.forEach(function (row, index) {
                            data_arr.push({
                                '_ref': { student: row.student_id, parent: row.parent_id },
                                'index': ++start,
                                'date': row.dates + ' and ' + row.times,
                                'student_name': row.student_name,
                                'parent_name': row.parent_name,
                                'minutes': row.minutes
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
        }
    }
};

const getTarnsactionByStudentId = (request, response, next) => {
    var id = request.query.id;

    var start_date = request.query.start_date;

    var end_date = request.query.end_date;

    if (id == 0 || id == "") {
        var draw = request.query.draw;
        var output = {
            'draw': draw,
            'iTotalRecords': 0,
            'iTotalDisplayRecords': 0,
            'aaData': []
        };
        response.json(output);
    } else {
        if (start_date != 0 || start_date != "" && end_date != 0 || end_date != "") {
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

            var search_query = `
         AND (plan_name LIKE '%${search_value}%'
         )
        `;

            //Total number of records without filtering

            dataBase.query('SELECT COUNT(*) AS Total FROM tbl_plan_purchase', function (error, data) {
                var total_records = data[0].Total;

                //Total number of records with filtering

                dataBase.query(`SELECT COUNT(*) AS Total from tbl_plan_purchase right join tbl_student ON tbl_plan_purchase.student_id = tbl_student.id WHERE tbl_student.id = ${id} AND DATE(tbl_plan_purchase.created_at) BETWEEN '${start_date}' AND '${end_date}' ${search_query}`, function (error, data) {
                    var total_records_with_filter = data[0].Total;

                    var query = `
                    SELECT tbl_student.*,tbl_plan_purchase.plan_name as plan_name,tbl_plan_purchase.plan_price as price, CONCAT(LPAD(FLOOR(minute / 60),2,"0"), ":", LPAD(MOD(minute, 60),2,"0")) as minute, DATE_FORMAT(tbl_plan_purchase.created_at, "%d-%m-%Y") as dates from tbl_student right join tbl_plan_purchase ON tbl_plan_purchase.student_id = tbl_student.id WHERE tbl_student.id = ${id} AND DATE(tbl_plan_purchase.created_at) BETWEEN '${start_date}' AND '${end_date}' ${search_query}
                    ORDER BY ${column_name} ${column_sort_order} 
                    LIMIT ${start}, ${length}`;

                    var data_arr = [];

                    dataBase.query(query, function (error, data) {
                        data.forEach(function (row, index) {
                            data_arr.push({
                                '_ref': { name: 'student', student: row.id },
                                'index': ++start,
                                'purchase_date': row.dates,
                                'name': row.name,
                                'plan_name': row.plan_name,
                                'price': row.price,
                                'minute': row.minute
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
        } else {
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

            var search_query = `
            AND (plan_name LIKE '%${search_value}%' 
            )
            `;

            //Total number of records without filtering

            dataBase.query('SELECT COUNT(*) AS Total FROM tbl_plan_purchase', function (error, data) {
                var total_records = data[0].Total;

                //Total number of records with filtering

                dataBase.query(`SELECT COUNT(*) AS Total from tbl_plan_purchase right join tbl_student ON tbl_plan_purchase.student_id = tbl_student.id WHERE tbl_student.id = ${id} ${search_query}`, function (error, data) {

                    var total_records_with_filter = data[0].Total;

                    var query = `
                    SELECT tbl_student.*,tbl_plan_purchase.plan_name as plan_name,tbl_plan_purchase.plan_price as price,CONCAT(FLOOR(tbl_plan_purchase.plan_min / 60)) as minute,DATE_FORMAT(tbl_plan_purchase.created_at, "%d-%m-%Y") as dates from tbl_student right join tbl_plan_purchase ON tbl_plan_purchase.student_id = tbl_student.id WHERE tbl_student.id = ${id}
                    ORDER BY ${column_name} ${column_sort_order} 
                    LIMIT ${start}, ${length}`;

                    var data_arr = [];

                    dataBase.query(query, function (error, data) {
                        data.forEach(function (row, index) {
                            data_arr.push({
                                '_ref': { name: 'student', student: row.id },
                                'index': ++start,
                                'purchase_date': row.dates,
                                'name': row.name,
                                'plan_name': row.plan_name,
                                'price': row.price,
                                'minute': row.minute
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
        }
    }
};

// tbl_parentskip.student_id is the roll no from the uploaded file when no such student existed, and the
// student's id when the student was found but the parent was a duplicate. Show the roll no either way.
const PARENT_SKIP_FROM = `tbl_parentskip
    LEFT JOIN tbl_student skip_s ON skip_s.id = tbl_parentskip.student_id AND skip_s.franchise_id = tbl_parentskip.franchise_id
        AND NOT EXISTS (SELECT 1 FROM tbl_student r WHERE r.franchise_id = tbl_parentskip.franchise_id AND r.student_roll_no = tbl_parentskip.student_id)`;
const PARENT_SKIP_ROLL = 'COALESCE(skip_s.student_roll_no, tbl_parentskip.student_id)';

const getStudentsByFranchise = (request, response, next) => {

    const id = Number(request.params.id) || 0;

    var draw = request.query.draw;

    var start = Math.max(0, Number(request.query.start) || 0);

    var length = Math.max(1, Number(request.query.length) || 10);

    var order_data = request.query.order;

    if (typeof order_data == 'undefined') {
        var column_name = 'tbl_student.id';

        var column_sort_order = 'desc';
    }
    else {
        var column_index = request.query.order[0]['column'];

        // sort by whitelisted SQL columns; the DataTables keys (index, student_name, ...) aren't all real columns
        var sort_columns = { index: 'tbl_student.id', student_name: 'tbl_student.name', student_roll_no: 'tbl_student.student_roll_no', contact: 'tbl_student.contact', email: 'tbl_student.email', password: 'tbl_student.password', department_name: 'tbl_department.name', status: 'tbl_student.login_status' };

        var column_name = sort_columns[request.query.columns[column_index]['data']] || 'tbl_student.id';

        var column_sort_order = request.query.order[0]['dir'] == 'asc' ? 'asc' : 'desc';
    }

    //search data

    var search_value = dataBase.escape('%' + ((request.query.search && request.query.search['value']) || '') + '%');

    var search_query = `
     AND (tbl_student.name LIKE ${search_value} 
     OR tbl_student.student_roll_no LIKE ${search_value}
     OR tbl_student.email LIKE ${search_value}
     OR tbl_student.contact LIKE ${search_value}
     OR tbl_student.password LIKE ${search_value}
     )
    `;

    //Total number of records without filtering

    dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_student WHERE tbl_student.franchise_id = ${id}`, function (error, data) {

        var total_records = data[0].Total;

        //Total number of records with filtering

        dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_student WHERE tbl_student.franchise_id = ${id} ${search_query}`, function (error, data) {

            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT tbl_student.*, tbl_department.name as department_name FROM tbl_student LEFT JOIN tbl_department ON tbl_department.id = tbl_student.department_id WHERE tbl_student.franchise_id = ${id} ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

            var data_arr = [];

            dataBase.query(query, function (error, data) {

                data.forEach(function (row, index) {

                    if (row.login_status == 1) {
                        var statusbtn = '<button onclick="statusDeactive(' + row.id + ')" id="active" class="btn-success" value="0">active</button>';
                    } else {
                        var statusbtn = '<button class="btn-danger" onclick="statusActive(' + row.id + ')" id="inactive" value="1">inactive</button>';
                    }

                    var action = `<a href="javascript:void(0);" 
                data-toggle="modal" data-target=".edit"
                class="btn-sm" onclick="getSubscriptionById(${row.id})" > <i
                    class="bx bx-edit-alt"></i> </a>
                        <a href="javascript:void(0);" id="sa-params" class="btn-sm delete"
                            data-id=${row.id}>
                            <i class="bx bx-trash-alt"></i>
                        </a>`;

                    data_arr.push({
                        '_ref': { student: row.id, department: row.department_id },
                        'index': ++start,
                        'checkbox': `<input type="checkbox" value="${row.id}" class="checkbox" data-id="${row.id}"></input>`,
                        'student_name': personName(row.name, row.student_roll_no),
                        'student_roll_no': row.student_roll_no,
                        'contact': row.contact || null,
                        'email': row.email || null,
                        'password': row.password,
                        'department_name': row.department_name,
                        'status': statusbtn,
                        'action': action
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

const getStudentsSkipByFranchise = (request, response, next) => {

    const id = Number(request.params.id) || 0;

    var draw = request.query.draw;

    var start = Math.max(0, Number(request.query.start) || 0);

    var length = Math.max(1, Number(request.query.length) || 10);

    var order_data = request.query.order;

    if (typeof order_data == 'undefined') {
        var column_name = 'tbl_studentskip.id';

        var column_sort_order = 'desc';
    }
    else {
        var column_index = request.query.order[0]['column'];

        // sort by whitelisted SQL columns; the DataTables keys (index, student_name, ...) aren't all real columns
        var sort_columns = { index: 'tbl_studentskip.id', student_roll_no: 'tbl_studentskip.student_roll_no', student_name: 'tbl_studentskip.name', contact: 'tbl_studentskip.contact', email: 'tbl_studentskip.email', password: 'tbl_studentskip.password', department: 'tbl_department.name' };

        var column_name = sort_columns[request.query.columns[column_index]['data']] || 'tbl_studentskip.id';

        var column_sort_order = request.query.order[0]['dir'] == 'asc' ? 'asc' : 'desc';
    }

    //search data

    var search_value = dataBase.escape('%' + ((request.query.search && request.query.search['value']) || '') + '%');

    var search_query = `
     AND (tbl_studentskip.name LIKE ${search_value} 
     OR tbl_studentskip.student_roll_no LIKE ${search_value}
     OR tbl_studentskip.email LIKE ${search_value}
     OR tbl_studentskip.contact LIKE ${search_value}
     OR tbl_studentskip.password LIKE ${search_value}
     OR tbl_department.name LIKE ${search_value}
     )
    `;

    //Total number of records without filtering

    dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_studentskip WHERE tbl_studentskip.franchise_id = ${id}`, function (error, data) {

        var total_records = data[0].Total;

        //Total number of records with filtering

        dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_studentskip LEFT JOIN tbl_department ON tbl_department.id = tbl_studentskip.department_id WHERE tbl_studentskip.franchise_id = ${id} ${search_query}`, function (error, data) {

            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT tbl_studentskip.*, tbl_department.name AS department_name FROM tbl_studentskip LEFT JOIN tbl_department ON tbl_department.id = tbl_studentskip.department_id WHERE tbl_studentskip.franchise_id = ${id} ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

            var data_arr = [];

            dataBase.query(query, function (error, data) {

                data.forEach(function (row, index) {

                    var action = `<a href="javascript:void(0);" id="sa-params" class="btn-sm delete"
                                data-id=${row.id}>
                                <i class="bx bx-trash-alt"></i>
                            </a>`;

                    data_arr.push({
                        'index': ++start,
                        'checkbox': `<input type="checkbox" value="${row.id}" class="checkbox" data-id="${row.id}"></input>`,
                        'student_roll_no': row.student_roll_no,
                        'student_name': personName(row.name, row.student_roll_no),
                        'contact': row.contact || null,
                        'email': row.email || null,
                        'password': row.password,
                        'department': row.department_name,
                        'action': action,
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

const getParentsByFranchise = (request, response, next) => {

    const id = Number(request.params.id) || 0;

    var draw = request.query.draw;

    var start = Math.max(0, Number(request.query.start) || 0);

    var length = Math.max(1, Number(request.query.length) || 10);

    var order_data = request.query.order;

    if (typeof order_data == 'undefined') {
        var column_name = 'tbl_parents.id';

        var column_sort_order = 'desc';
    }
    else {
        var column_index = request.query.order[0]['column'];

        // sort by whitelisted SQL columns; the DataTables keys (index, student_name, ...) aren't all real columns
        var sort_columns = { index: 'tbl_parents.id', student_roll_no: 'tbl_student.student_roll_no', student_name: 'tbl_student.name', name: 'tbl_parents.name', contact: 'tbl_parents.contact', email: 'tbl_parents.email', password: 'tbl_parents.password', action: 'tbl_parents.status' };

        var column_name = sort_columns[request.query.columns[column_index]['data']] || 'tbl_parents.id';

        var column_sort_order = request.query.order[0]['dir'] == 'asc' ? 'asc' : 'desc';
    }

    //search data

    var search_value = dataBase.escape('%' + ((request.query.search && request.query.search['value']) || '') + '%');

    var search_query = `
     AND (tbl_parents.name LIKE ${search_value}
     OR tbl_parents.contact LIKE ${search_value}
     OR tbl_parents.email LIKE ${search_value}
     OR tbl_parents.password LIKE ${search_value}
     OR tbl_student.student_roll_no LIKE ${search_value}
     OR tbl_student.name LIKE ${search_value}
     )
    `;

    //Total number of records without filtering

    dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_parents WHERE tbl_parents.franchise_id = ${id}`, function (error, data) {

        var total_records = data[0].Total;

        //Total number of records with filtering

        dataBase.query(`SELECT COUNT(*) AS Total
        FROM tbl_parents
        LEFT JOIN tbl_student ON tbl_parents.student_id = tbl_student.id
        WHERE tbl_parents.franchise_id = ${id} ${search_query}`, function (error, data) {
            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT tbl_parents.*, tbl_student.student_roll_no as roll_no, tbl_student.name AS student_name FROM tbl_parents LEFT JOIN tbl_student ON tbl_student.id = tbl_parents.student_id WHERE tbl_parents.franchise_id = ${id} ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

            var data_arr = [];

            dataBase.query(query, function (error, data) {
                if (data == undefined) {
                    var output = {
                        'draw': draw,
                        'iTotalRecords': 0,
                        'iTotalDisplayRecords': 0,
                        'aaData': []
                    };
                    response.json(output);
                } else {
                    data.forEach(function (row, index) {
                        // a read-only login state, shown under "Login Status" (it was an unclickable button in the Action menu)
                        var statusbtn = row.status == 1
                            ? '<span class="nt-badge nt-badge-success">Logged in</span>'
                            : '<span class="nt-badge nt-badge-muted">Not logged in</span>';
                        data_arr.push({
                            '_ref': { name: 'parent', parent: row.id, student: row.student_id },
                            'index': ++start,
                            'student_roll_no': row.roll_no,
                            'student_name': personName(row.student_name, row.roll_no),
                            'name': personName(row.name),
                            'contact': row.contact,
                            'email': row.email,
                            'password': row.password,
                            'action': statusbtn
                        });
                    });
                    var output = {
                        'draw': draw,
                        'iTotalRecords': total_records,
                        'iTotalDisplayRecords': total_records_with_filter,
                        'aaData': data_arr
                    };

                    response.json(output);
                }

            });

        });

    });

};

const getParentsSkipByFranchise = (request, response, next) => {

    const id = Number(request.params.id) || 0;

    var draw = request.query.draw;

    var start = Math.max(0, Number(request.query.start) || 0);

    var length = Math.max(1, Number(request.query.length) || 10);

    var order_data = request.query.order;

    if (typeof order_data == 'undefined') {
        var column_name = 'tbl_parentskip.id';

        var column_sort_order = 'desc';
    }
    else {
        var column_index = request.query.order[0]['column'];

        // sort by whitelisted SQL columns; the DataTables keys (index, student_name, ...) aren't all real columns
        var sort_columns = { index: 'tbl_parentskip.id', student_roll_no: PARENT_SKIP_ROLL, name: 'tbl_parentskip.name', contact: 'tbl_parentskip.contact', email: 'tbl_parentskip.email', password: 'tbl_parentskip.password' };

        var column_name = sort_columns[request.query.columns[column_index]['data']] || 'tbl_parentskip.id';

        var column_sort_order = request.query.order[0]['dir'] == 'asc' ? 'asc' : 'desc';
    }

    //search data

    var search_value = dataBase.escape('%' + ((request.query.search && request.query.search['value']) || '') + '%');

    var search_query = `
     AND (tbl_parentskip.name LIKE ${search_value}
     OR tbl_parentskip.contact LIKE ${search_value}
     OR tbl_parentskip.email LIKE ${search_value}
     OR tbl_parentskip.password LIKE ${search_value}
     OR ${PARENT_SKIP_ROLL} LIKE ${search_value}
     )
    `;

    //Total number of records without filtering

    dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_parentskip WHERE tbl_parentskip.franchise_id = ${id}`, function (error, data) {

        var total_records = data[0].Total;

        //Total number of records with filtering

        dataBase.query(`SELECT COUNT(*) AS Total FROM ${PARENT_SKIP_FROM} WHERE tbl_parentskip.franchise_id = ${id} ${search_query}`, function (error, data) {

            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT tbl_parentskip.*, ${PARENT_SKIP_ROLL} AS roll_no FROM ${PARENT_SKIP_FROM} WHERE tbl_parentskip.franchise_id = ${id} ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

            var data_arr = [];

            dataBase.query(query, function (error, data) {
                if (data == undefined) {
                    var output = {
                        'draw': draw,
                        'iTotalRecords': 0,
                        'iTotalDisplayRecords': 0,
                        'aaData': []
                    };
                    response.json(output);
                } else {
                    data.forEach(function (row, index) {

                        var action = `<a href="javascript:void(0);" id="sa-params" class="btn-sm delete"
                                data-id=${row.id}>
                                <i class="bx bx-trash-alt"></i>
                            </a>`;

                        data_arr.push({
                            'index': ++start,
                            'checkbox': `<input type="checkbox" value="${row.id}" class="checkbox" data-id="${row.id}"></input>`,
                            'student_roll_no': row.roll_no,
                            'name': row.name,
                            'contact': row.contact,
                            'email': row.email,
                            'password': row.password,
                            'action': action,
                        });
                    });
                    var output = {
                        'draw': draw,
                        'iTotalRecords': total_records,
                        'iTotalDisplayRecords': total_records_with_filter,
                        'aaData': data_arr
                    };

                    response.json(output);
                }

            });

        });

    });

};

const deleteSkipDataStudent = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.send(200).send({ error: true, message: "Please provide id" });
        } else {
            dataBase.query('DELETE FROM `tbl_studentskip` WHERE tbl_studentskip.id = "' + id + '"', function (error, results, fields) {
                if (results == 0) {
                    return res.status(200).send({ error: true, message: "student skip data not deleted", data: null });
                } else {
                    return res.status(200).send({ error: false, message: "student skip data successfully deleted", data: null });
                }
            })
        }
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "student skip data delete api not working" });
    }
}

const deleteSkipDataParent = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.send(200).send({ error: true, message: "Please provide id" });
        } else {
            dataBase.query('DELETE FROM `tbl_parentskip` WHERE tbl_parentskip.id = "' + id + '"', function (error, results, fields) {
                if (results == 0) {
                    return res.status(200).send({ error: true, message: "parent skip data not deleted", data: null });
                } else {
                    return res.status(200).send({ error: false, message: "parent skip data successfully deleted", data: null });
                }
            })
        }
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "parent skip data delete api not working" });
    }
}

async function deleteStudentSkipData(students_id) {
    return new Promise((resolve, reject) => {
        dataBase.query('DELETE FROM `tbl_studentskip` WHERE tbl_studentskip.id = "' + students_id + '"', function (error, parents, fields) {
            return error ? reject(error) : resolve(parents)
        });
    })
}

const bulkDeleteSkipStudent = (req, res, next) => {
    try {
        const { studentid } = req.body;
        const student_ids = JSON.parse(studentid);
        if (student_ids == 0) {
            return res.status(200).send({ error: true, message: "Please provide id" });
        } else {
            student_ids.map(async (student_id, key) => {
                deleteStudentSkipData(student_id);
            })
            return res.status(200).send({ error: false, message: "Data successfully deleted", data: null });
        }
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "student bulk data delete api not working" });
    }
}

async function deleteParentSkipData(students_id) {
    return new Promise((resolve, reject) => {
        dataBase.query('DELETE FROM `tbl_parentskip` WHERE tbl_parentskip.id = "' + students_id + '"', function (error, parents, fields) {
            return error ? reject(error) : resolve(parents)
        });
    })
}

const bulkDeleteSkipParent = (req, res, next) => {
    try {
        const { studentid } = req.body;
        const student_ids = JSON.parse(studentid);
        if (student_ids == 0) {
            return res.status(200).send({ error: true, message: "Please provide id" });
        } else {
            student_ids.map(async (student_id, key) => {
                deleteParentSkipData(student_id);
            })
            return res.status(200).send({ error: false, message: "Data successfully deleted", data: null });
        }
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "parent bulk data delete api not working" });
    }
}

module.exports = { addStudents, departmentGetById, departmentDay, getFranchise, statusDeactive, getDepartmentById, getStudentsByDepartmentId, deleteStudents, getSubscription, editStudentsById, getStudentParent, getByStudentId, getCallHistoryByStudentId, getTarnsactionByStudentId, getStudentsByFranchise, getParentsByFranchise, bulkDelete, bulkDepartmentUpdate, bulkStatusUpdate, getStudentsSkipByFranchise, getParentsSkipByFranchise, deleteSkipDataStudent, deleteSkipDataParent, bulkDeleteSkipStudent, bulkDeleteSkipParent };