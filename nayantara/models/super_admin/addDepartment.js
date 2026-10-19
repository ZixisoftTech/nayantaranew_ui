const dataBase = require("../../config/db");
const { ensureColumns } = require("../schema");

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// House settings stored on each department; missing columns are added at startup.
ensureColumns('tbl_department', {
    max_call_duration_sec: 'INT(11) NOT NULL DEFAULT 120', // the 2 minute cap the call API used before; 0 = unlimited
    allotment_day: "VARCHAR(10) NOT NULL DEFAULT 'Sunday'",
    allotment_time: "TIME NOT NULL DEFAULT '07:00:00'",
    weekly_video_mins: 'INT(11) NOT NULL DEFAULT 0',
    weekly_audio_mins: 'INT(11) NOT NULL DEFAULT 0',
    parent_notice: 'TEXT NULL',
    student_notice: 'TEXT NULL',
});

/** Validates the house settings in a request body. Returns { values } or { message } on error. */
const readHouseSettings = (body) => {
    const values = {};
    const numbers = {
        max_call_duration_sec: 'Max call duration',
        weekly_video_mins: 'Weekly video mins',
        weekly_audio_mins: 'Weekly audio mins',
    };
    for (const [field, label] of Object.entries(numbers)) {
        if (body[field] === undefined) continue;
        const value = body[field] === '' ? 0 : Number(body[field]);
        if (!Number.isInteger(value) || value < 0) {
            return { message: `${label} must be a positive whole number` };
        }
        values[field] = value;
    }
    if (body.allotment_day !== undefined) {
        if (!DAYS.includes(body.allotment_day)) return { message: 'Please select a valid allotment day' };
        values.allotment_day = body.allotment_day;
    }
    if (body.allotment_time !== undefined) {
        if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(body.allotment_time)) return { message: 'Please enter a valid allotment time' };
        values.allotment_time = body.allotment_time;
    }
    for (const field of ['parent_notice', 'student_notice']) {
        if (body[field] === undefined) continue;
        const notice = String(body[field]).trim();
        if (notice.length > 2000) return { message: 'Notices can be at most 2000 characters' };
        values[field] = notice || null;
    }
    return { values };
};

const getFranchise = (req, res, next) => {
    try {
        dataBase.query('SELECT Id,franchiseName FROM tbl_franchise WHERE status = 1', function (error, Findfranchises, fields) {
            if (Findfranchises == 0) {
                return res.status(200).send({ error: true, message: "Franchise data active this momment", data: null });
            } else {
                return res.status(200).send({ error: false, message: "Franchise data successfully found", data: Findfranchises });
            }
        })
    } catch (err) {
        return res.status(400).send({ error: true, message: "Get Franchise api not working" });
    }
}

const addDepartment = (req, res, next) => {
    try {
        const data = req.body;
        const department = req.body.department;
        if (data.franchise_id == 0 || data.name == 0 || data.device_name == 0) {
            return res.status(200).send({ error: true, message: "Please insert franchise,department and deviceName" });
        }
        const settings = readHouseSettings(data);
        if (settings.message) {
            return res.status(200).send({ error: true, message: settings.message });
        } else {
            const row = { franchise_id: data.franchise_id, name: data.name, device_name: data.device_name, ...settings.values };
            dataBase.query('INSERT INTO tbl_department SET ?', [row], function (error, results, fields) {
                if (results == 0) {
                    return res.status(200).send({ error: true, message: "department not insert", data: null })
                }
                else {
                    for (let i = 0; i < department.length; i++) {
                        department[i]["department_id"] = results.insertId;
                    }
                    const VALUES = department.map(item => [item.day, item.start_time, item.end_time, item.department_id]);
                    dataBase.query('INSERT INTO tbl_department_timeslots (day,start_time,end_time,department_id) VALUES ?', [VALUES], function (error, results, fields) {
                        if (results == 0) {
                            return res.status(200).send({ error: true, message: "department timeslots not insert", data: null });
                        } else {
                            return res.status(200).send({ error: false, message: "department timeslots successfully insert", data: results });
                        }
                    });
                }
            });
        }
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "Add department api ot working" });
    }
}

const getDepartment = (request, response, next) => {

    var draw = request.query.draw;

    var start = request.query.start;

    var length = request.query.length;

    var order_data = request.query.order;

    if (typeof order_data == 'undefined') {
        var column_name = 'tbl_department.id';
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
     (name LIKE '%${search_value}%' 
     OR device_name LIKE '%${search_value}%'
     )
     `;

    //Total number of records without filtering

    dataBase.query("SELECT COUNT(*) AS Total FROM tbl_department", function (error, data) {

        var total_records = data[0].Total;


        //Total number of records with filtering

        dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_department WHERE ${search_query}`, function (error, data) {
            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT tbl_department.*, tbl_franchise.franchiseName as franchise_name from tbl_department left join tbl_franchise ON tbl_franchise.Id = tbl_department.franchise_id
            WHERE ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

            var data_arr = [];

            dataBase.query(query, function (error, data) {
                data.forEach(function (row, index) {
                    if (row.status == 1) {
                        var statusbtn = '<button onclick="statusDeactive(' + row.id + ')" id="active" class="btn-success" value="0">active</button>';
                    } else {
                        var statusbtn = '<button class="btn-danger" onclick="statusActive(' + row.id + ')" id="inactive" value="1">inactive</button>';
                    }
                    var action = `<a href="javascript:void(0);" 
                                                                        data-toggle="modal" data-target=".edit"
                                                                        class="btn-sm" onclick ="getUpdateValue(${row.id})"><i
                                                                         class="bx bx-edit-alt"></i> </a>
                                                                    <a href="javascript:void(0);" 
                                                                        data-toggle="modal" data-target=".view"
                                                                        class="btn-sm" onclick ="getDays(${row.id})"><i
                                                                         class="fas fa-eye"></i> </a>
                                                                    <a href="javascript:void(0);" id="sa-params" class="btn-sm delete" data-id=${row.id}>
                                                                <i class="bx bx-trash-alt"></i>
                                                                    </a>`;

                    data_arr.push({
                        '_ref': { name: 'department', department: row.id, franchise: row.franchise_id },
                        'index': ++start,
                        'id': row.id,
                        'name': row.name,
                        'device_name': row.device_name,
                        'franchise_name': row.franchise_name,
                        'status': statusbtn,
                        'action': action,
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

const getDepartmentDay = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(404).send({ error: true, message: "please insert id" });
        }
        else {
            dataBase.query('SELECT * From tbl_department_timeslots WHERE department_id = "' + id + '"', function (error, finddays, fields) {
                if (finddays == 0) {
                    return res.status(402).send({ error: true, message: "Days not found", data: null });
                }
                else {
                    return res.status(200).send({ error: false, message: "Days successfully find", data: finddays });
                }
            })
        }
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "getDepartmentDay api not working" });
    }
}

const deleteDepartment = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(201).send({ error: true, message: "Data not found by id", data: null });
        }
        else {
            dataBase.query('DELETE tbl_department,tbl_department_timeslots FROM tbl_department INNER JOIN tbl_department_timeslots ON tbl_department.id = tbl_department_timeslots.department_id WHERE tbl_department.id = ?', [id], function (error, results, fields) {
                if (results == 0) {
                    return res.status(200).send({ error: true, message: " department not deleted", data: null });
                } else {
                    return res.status(200).send({ error: false, message: "department successfully deleted", data: null });
                }
            })
        }
    }
    catch (error) {
        res.status(401).send({ error: true, message: "deleteDepartment api not working" });
    }
}

const getDepartmentId = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert the id" });
        }
        else {
            dataBase.query('SELECT tbl_department.*,tbl_franchise.franchiseName as franchise_name from tbl_department left join tbl_franchise ON tbl_franchise.Id = tbl_department.franchise_id WHERE tbl_department.id = "' + id + '"', function (error, department, fields) {
                if (department == 0) {
                    return res.status(200).send({ error: true, message: "department data not found", data: null });
                }
                else {
                    dataBase.query('SELECT * From tbl_department_timeslots WHERE department_id = "' + department[0].id + '"', function (error, timeslots, fields) {
                        if (timeslots == 0) {
                            return res.status(200).send({ error: true, message: "departmet timeslots not found", data: null });
                        }
                        else {
                            const departments = {
                                department: department,
                                timeslots: timeslots
                            }
                            return res.status(200).send({ error: false, message: "department successsfully found", data: departments })
                        }
                    })
                }
            })
        }
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "getdepartment Bi Id api not working" });
    }
}

const editDepartment = (req, res, next) => {
    try {
        const data = req.body;
        const department = req.body.department;
        if (data.id == 0 || data.franchise_id == 0 || data.department_Name == 0 || data.device_name == 0) {
            return res.send(200).send({ error: true, message: "Please insert the all field" });
        }
        const settings = readHouseSettings(data);
        if (settings.message) {
            return res.status(200).send({ error: true, message: settings.message });
        }
        else {
            const row = { name: data.name, device_name: data.device_name, franchise_id: data.franchise_id, ...settings.values };
            dataBase.query('UPDATE tbl_department SET ? WHERE id = ?', [row, data.id], function (error, results, fields) {
                if (results == 0) {
                    return res.status(401).send({ error: true, message: "data not update", data: null })
                } else {
                    dataBase.query('DELETE FROM tbl_department_timeslots WHERE department_id = "' + data.id + '"', function (error, results, fields) {
                        if (results) {
                            for (let i = 0; i < department.length; i++) {
                                department[i]["department_id"] = data.id;
                            }
                            const VALUES = department.map(item => [item.day, item.start_time, item.end_time, item.department_id]);
                            dataBase.query('INSERT INTO tbl_department_timeslots (day,start_time,end_time,department_id) VALUES ?', [VALUES], function (error, results, fields) {
                                if (results == 0) {
                                    return res.status(400).send({ error: true, message: "Data not update department timeslots", data: null });
                                } else {
                                    return res.status(200).send({ error: false, message: "Data insert in successfully department timeslots", data: results });
                                }
                            });
                        } else {
                            return res.status(200).send({ error: true, message: "Data not successfully deleted" });
                        }
                    });
                }
            });
        }
    }
    catch (error) {
        return res.status(401).send({ error: true, message: "Add department api ot working" });
    }
}

const statusChange = (req, res, next) => {
    try {
        const id = req.params.id;
        const status = req.body;
        dataBase.query('SELECT status FROM tbl_department WHERE id = "' + id + '"', (error, results, fields) => {
            if (results.length == 0) {
                return res.send("Data Not Found");
            } else {
                dataBase.query('UPDATE tbl_department SET ? WHERE id = "' + id + '"', [status], (error, results, fields) => {
                    res.send(results);
                })
            }
        })
    } catch (error) {
        res.send(error);
    }
}

module.exports = { getFranchise, addDepartment, statusChange, getDepartment, deleteDepartment, getDepartmentId, editDepartment, getDepartmentDay };