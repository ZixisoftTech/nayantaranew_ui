const dataBase = require('../../config/db');

const getStudentName = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert the Id" });
        }
        else {
            dataBase.query('SELECT * from tbl_student WHERE department_id = "' + id + '"', function (error, studentNames, fields) {
                if (studentNames) {
                    return res.status(200).send({ error: true, message: "Students successfully found", data: studentNames });
                } else {
                    return res.status(200).send({ error: true, message: "Students Name not successfuly found", data: null });
                }
            })
        }
    }
    catch (error) {
        return res.status(400).send({ error: true, message: "get Student Name api not working" });
    }
}

const getDepartmentTimeSlots = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(400).send({ error: true, message: "Please insert the Student Id" });
        } else {
            dataBase.query('SELECT * From tbl_student WHERE id = "' + id + '"', function (error, getStudent, fields) {
                if (getStudent != 0) {
                    dataBase.query('SELECT * From tbl_department_timeslots WHERE department_id = "' + getStudent[0].department_id + '"', function (error, getDepartment, fields) {
                        if (getDepartment) {
                            return res.status(200).send({ error: false, message: "getDepartmet successfully Found", data: getDepartment });
                        } else {
                            return res.status(200).send({ error: true, message: "getDepartment not Found", data: null });
                        }
                    })
                } else {
                    return res.status(200).send({ error: true, message: "Student not found", data: null });
                }
            })
        }
    } catch (error) {
        return res.status(400).send({ error: true, message: "getDepartmentTimeSlots api not working" });
    }
}

module.exports = { getStudentName, getDepartmentTimeSlots };