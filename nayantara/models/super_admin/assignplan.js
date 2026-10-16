const dataBase = require('../../config/db');

const getPlanByFranchiseId = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert the Id" });
        } else {
            dataBase.query('SELECT *,(tbl_subscriptions.talktime_minutes / 60) as talk_time From tbl_subscriptions WHERE status = "1" and franchise_id = "' + id + '"', function (error, findPlan, fields) {
                if (findPlan == 0) {
                    return res.status(200).send({ error: true, message: "Plan not found", data: null });
                } else {
                    return res.status(200).send({ error: false, message: "Plan successfully found", data: findPlan });
                }
            })
        }
    } catch (error) {
        return res.status(200).send({ error: true, message: "get Plan By FranchiseId api not working" });
    }
}

const getStudentsByFranchiseId = (request, response, next) => {
    var id = request.query.id;
    if (id == 0 || id == "") {
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

            if (request.query.columns[column_index]['data'] == "checkbox") {
                var column_name = 'tbl_student.id';
            }
            // console.log("column_name =>", request.query.columns[column_index]['data']);

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

        dataBase.query('SELECT COUNT(*) AS Total FROM tbl_student WHERE tbl_student.department_id = "' + id + '" AND tbl_student.login_status = "1"', function (error, data) {
            if (data == 0) {
                var output = {
                    'draw': draw,
                    'iTotalRecords': 0,
                    'iTotalDisplayRecords': 0,
                    'aaData': []
                };
                response.json(output);
            } else {

                var total_records = data[0].Total;


                //Total number of records with filtering

                dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_student WHERE tbl_student.department_id = ${id} AND tbl_student.login_status = "1" AND ${search_query}`, function (error, data) {
                    var total_records_with_filter = data[0].Total;

                    var query = `
                    SELECT tbl_student.*,CONCAT(FLOOR(tbl_student.total_talktime / 60)) as minutes,tbl_department.name as department_name,tbl_franchise.franchiseName as franchise_name from tbl_student left join tbl_department ON tbl_department.id = tbl_student.department_id LEFT JOIN tbl_franchise ON tbl_franchise.Id = tbl_student.franchise_id WHERE tbl_student.department_id = ${id} AND tbl_student.login_status = "1" AND ${search_query}
                    ORDER BY ${column_name} ${column_sort_order} 
                    LIMIT ${start}, ${length}
            `;

                    var data_arr = [];

                    dataBase.query(query, function (error, data) {
                        data.forEach(function (row, index) {

                            data_arr.push({
                                '_ref': { name: 'student', student: row.id, franchise: row.franchise_id, department: row.department_id },
                                'index': ++start,
                                'checkbox': `<input type="checkbox" value="${row.id}" class="checkbox" data-id="${row.id}"></input>`,
                                'name': row.name,
                                'student_roll_no': row.student_roll_no,
                                'contact': row.contact,
                                'email': row.email,
                                'department_name': row.department_name,
                                'franchise_name': row.franchise_name,
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
            }

        });
    }
}

const getStudentsById = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert the Id" });
        }
        else {
            dataBase.query('SELECT tbl_student.*,CONCAT(FLOOR(tbl_student.total_talktime / 60)) as talk_time,tbl_department.name as department_name,tbl_franchise.franchiseName as franchise_name from tbl_student left join tbl_department ON tbl_department.id = tbl_student.department_id left join tbl_franchise ON tbl_franchise.id = tbl_student.franchise_id WHERE tbl_student.department_id = "' + id + '"', function (error, student, fields) {
                if (student == 0) {
                    return res.status(200).send({ error: true, message: "Student not found in this department", data: null });
                }
                else {
                    return res.status(200).send({ error: false, message: "Student successfully found", data: student });
                }
            })
        }
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "GetStudents api not working" });
    }
}

const updateStudentsById = (req, res, next) => {
    try {
        const id = req.params.id;
        const { min } = req.body;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert the all field" });
        }
        else {
            var minute = min * 60;
            dataBase.query('UPDATE `tbl_student` SET `total_talktime`= "' + minute + '" WHERE `id`= "' + id + '"', function (error, student, fields) {
                if (student) {
                    dataBase.query('UPDATE `tbl_parents` SET `total_talktime`= "' + minute + '" WHERE `student_id`= "' + id + '"', function (error, parent, fields) {
                        if (parent) {
                            return res.status(200).send({ error: false, message: "Min successfully Update", data: null });
                        } else {
                            return res.status(200).send({ error: true, message: "Min not successfully Update", data: null })
                        }
                    });
                } else {
                    return res.status(200).send({ error: true, message: "Minute not update", data: null });
                }
            })
        }
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "GetStudents api not working" });
    }
}

const getDepartmentById = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert the Id" });
        } else {
            dataBase.query('SELECT * From tbl_department WHERE status = "1" AND franchise_id = ?', [id], function (error, getDepartment, fields) {
                if (getDepartment == 0) {
                    return res.status(200).send({ error: true, message: "Department not found", data: null });
                } else {
                    return res.status(200).send({ error: false, message: "Department successfully found", data: getDepartment });
                }
            })
        }
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "getDepartmentById api not working" });
    }
}

async function getParentId(students_id) {
    return new Promise((resolve, reject) => {
        dataBase.query('SELECT id From `tbl_parents` WHERE `student_id` = "' + students_id + '"', function (error, parents, fields) {
            return error ? reject(error) : resolve(parents)
        });
    })
}

const planassign = (req, res, next) => {
    try {
        const { studentid, planid } = req.body;
        const student_ids = JSON.parse(studentid);
        if (student_ids == 0 || planid == 0) {
            return res.status(200).send({ error: true, message: "Please select the student", data: null });
        } else {
            dataBase.query('SELECT * From tbl_subscriptions WHERE id = ?', [planid], async function (error, findSubscription, fields) {
                if (findSubscription == 0) {
                    return res.status(200).send({ error: true, message: "Subscription not approved this moment", data: null });
                } else {
                    student_ids.map(async (student_id, key) => {
                        var students_id = student_id
                        var findParentId = await getParentId(students_id);
                        const weekend = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Satuarday"];
                        var now = new Date();
                        var day = weekend[now.getDay()];
                        const sql = 'INSERT INTO tbl_plan_purchase (plan_id, plan_name, plan_price, plan_min, parent_id, student_id, day) VALUES (?)';
                        const VALUES = [findSubscription[0].id, findSubscription[0].plan_name, findSubscription[0].price, findSubscription[0].talktime_minutes, findParentId[0].id, students_id, day];
                        dataBase.query(sql, [VALUES], function (error, planPurchase, fields) {
                            if (!planPurchase) {
                                return res.status(200).send({ error: true, message: "plan not not successfully purchase", data: null });
                            } else {
                                dataBase.query('SELECT * From tbl_student WHERE id = "' + students_id + '"', function (error, student, fields) {
                                    var total_talktime = Number(student[0].total_talktime)
                                    var talktime_minutes = Number(findSubscription[0].talktime_minutes);
                                    var minutes = total_talktime + talktime_minutes;
                                    const update_student = "UPDATE `tbl_student` SET `total_talktime`=" + minutes + " WHERE `id`='" + students_id + "'";
                                    dataBase.query(update_student);
                                    const update_parent = "UPDATE `tbl_parents` SET `total_talktime`='" + minutes + "' WHERE `student_id`='" + students_id + "'";
                                    dataBase.query(update_parent);
                                });
                            }
                        });
                    });
                    return res.status(200).send({ error: false, message: "Subscription Plan Assain", data: null });
                }
            });
        }
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "BuySubscription api not working" });
    }
}

const getTransaction = (request, response, next) => {
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

                dataBase.query(`SELECT COUNT(*) AS Total from tbl_plan_purchase right join tbl_student ON tbl_plan_purchase.student_id = tbl_student.id WHERE tbl_student.department_id = ${id} AND DATE(tbl_plan_purchase.created_at) BETWEEN '${start_date}' AND '${end_date}' ${search_query}`, function (error, data) {
                    var total_records_with_filter = data[0].Total;

                    var query = `
                    SELECT tbl_student.*,tbl_plan_purchase.plan_name as plan_name,tbl_plan_purchase.plan_price as price, CONCAT(FLOOR(tbl_plan_purchase.plan_min / 60)) as minute, DATE_FORMAT(tbl_plan_purchase.created_at, "%d-%m-%Y") as dates from tbl_plan_purchase right join tbl_student ON tbl_plan_purchase.student_id = tbl_student.id WHERE tbl_student.department_id = ${id} AND DATE(tbl_plan_purchase.created_at) BETWEEN '${start_date}' AND '${end_date}' ${search_query}
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

                dataBase.query(`SELECT COUNT(*) AS Total from tbl_plan_purchase right join tbl_student ON tbl_plan_purchase.student_id = tbl_student.id WHERE tbl_student.department_id = ${id} ${search_query}`, function (error, data) {

                    var total_records_with_filter = data[0].Total;

                    var query = `
                    SELECT tbl_student.*,tbl_plan_purchase.plan_name as plan_name,tbl_plan_purchase.plan_price as price, CONCAT(FLOOR(tbl_plan_purchase.plan_min / 60)) as minute, DATE_FORMAT(tbl_plan_purchase.created_at, "%d-%m-%Y") as dates from tbl_student right join tbl_plan_purchase ON tbl_plan_purchase.student_id = tbl_student.id WHERE tbl_student.department_id = ${id}
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

const planAssignDepartmentId = (req, res, next) => {
    try {
        const { franchsie_id, department_id, plan_id } = req.body;
        if (franchsie_id == '' || department_id == '' || plan_id == '') {
            const missingFields = [];
            if (franchsie_id === '') missingFields.push('Franchise');
            if (department_id === '') missingFields.push('Department');
            if (plan_id === '') missingFields.push('Plan');
            const error = `The following fields are required: ${missingFields.join(', ')}`;
            return res.status(200).send({ error: true, message: `${error}`, data: null });
        } else {
            dataBase.query('SELECT * From tbl_subscriptions WHERE id = "' + plan_id + '"', async function (error, findSubscription, fields) {
                if (error) {
                    return res.status(200).send({ error: true, message: `${error}`, data: null });
                }
                if (findSubscription[0] == undefined) {
                    return res.status(200).send({ error: true, message: "Plan not found", data: null });
                } else {
                    if (findSubscription[0].status == 0) {
                        return res.status(200).send({ error: true, message: "Plan not active at this momment", data: null });
                    } else {
                        dataBase.query('SELECT * From tbl_student WHERE department_id = "' + department_id + '"', async function (error, findStudent, fields) {
                            if (error) {
                                return res.status(200).send({ error: true, message: `${error}`, data: null });
                            }
                            if (findStudent[0] == undefined) {
                                return res.status(200).send({ error: true, message: "Student not found in this department id", data: null });
                            } else {
                                findStudent.map(async (student_id, key) => {
                                    var students_id = student_id.id
                                    var findParentId = await getParentId(students_id);
                                    const weekend = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Satuarday"];
                                    var now = new Date();
                                    var day = weekend[now.getDay()];
                                    const sql = 'INSERT INTO tbl_plan_purchase (plan_id, plan_name, plan_price, plan_min, parent_id, student_id, day) VALUES (?)';
                                    const VALUES = [findSubscription[0].id, findSubscription[0].plan_name, findSubscription[0].price, findSubscription[0].talktime_minutes, findParentId[0].id, students_id, day];
                                    dataBase.query(sql, [VALUES], function (error, planPurchase, fields) {
                                        if (!planPurchase) {
                                            return res.status(200).send({ error: true, message: "plan not not successfully purchase", data: null });
                                        } else {
                                            dataBase.query('SELECT * From tbl_student WHERE id = "' + students_id + '"', function (error, student, fields) {
                                                var total_talktime = Number(student[0].total_talktime)
                                                var talktime_minutes = Number(findSubscription[0].talktime_minutes);
                                                var minutes = total_talktime + talktime_minutes;
                                                const update_student = "UPDATE `tbl_student` SET `total_talktime`=" + minutes + " WHERE `id`='" + students_id + "'";
                                                dataBase.query(update_student);
                                                const update_parent = "UPDATE `tbl_parents` SET `total_talktime`='" + minutes + "' WHERE `student_id`='" + students_id + "'";
                                                dataBase.query(update_parent);
                                            });
                                        }
                                    });
                                });
                                return res.status(200).send({ error: false, message: "Successfully Plan Assain", data: null });
                            }
                        });
                    }
                }
            });
        }
    }
    catch (error) {
        return res.status(500).send({ error: true, message: "Internal Server Error", data: null });
    }
}

module.exports = { getStudentsById, getDepartmentById, planassign, getTransaction, getPlanByFranchiseId, updateStudentsById, getStudentsByFranchiseId, planAssignDepartmentId };