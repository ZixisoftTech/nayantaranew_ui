const dataBase = require('../../config/db');

const countFranchise = (req, res) => {
    try {
        dataBase.query('SELECT COUNT(*) AS count FROM tbl_franchise', function (error, results, fileds) {
            if (results) {
                return res.status(200).send({ erorr: false, message: "successfully found franchise count", data: results });
            } else {
                return res.status(202).send({ error: true, message: "not found franchise count", data: null });
            }
        })
    } catch (error) {
        return res.status(500).send({ error: true, message: "Failed to count Franchise", data: null });
    }
}

const totalBalanceActiveStudent = (req, res) => {
    try {
        dataBase.query('SELECT CEIL(SUM(tbl_student.total_talktime / 60)) AS sum_balance FROM tbl_student WHERE login_status = "1"', function (error, result, fields) {
            if (result) {
                return res.status(200).send({ error: true, message: "successfully found total balance", data: result })
            } else {
                return res.status(202).send({ error: false, message: "not found total balance", data: null });
            }
        })
    } catch (error) {
        return res.status(200).send({ error: true, message: "failed to total balance active student", data: null });
    }
}

const totalUsedBalanceActicveStudent = (req, res) => {
    try {
        dataBase.query('SELECT CEIL(SUM(tbl_callhistory.minute / 60)) AS used_balance FROM tbl_callhistory', function (error, result, fields) {
            if (result) {
                return res.status(200).send({ error: true, message: "successfully found total used balance", data: result })
            } else {
                return res.status(202).send({ error: false, message: "not found total balance", data: null });
            }
        })
    } catch (error) {
        return res.status(200).send({ error: true, message: "failed to total used balance active student", data: null });
    }
}

const totalStudentActive = (req, res) => {
    try {
        dataBase.query('SELECT COUNT(*) AS count FROM tbl_student where login_status = "1"', function (error, result, fields) {
            if (result) {
                return res.status(200).send({ error: true, message: "successfully found total used balance", data: result })
            } else {
                return res.status(202).send({ error: false, message: "not found total balance", data: null });
            }
        })
    } catch (error) {
        return res.status(200).send({ error: true, message: "failed to total student active", data: null });
    }
}

const totalUniqueDeviceName = (req, res) => {
    try {
        dataBase.query('SELECT SUM(unique_device_count) AS total_unique_devices FROM( SELECT COUNT(DISTINCT device_name) AS unique_device_count FROM tbl_department ) AS subquery', function (error, result, fields) {
            if (result) {
                return res.status(200).send({ error: true, message: "successfully found total unique device", data: result })
            } else {
                return res.status(202).send({ error: false, message: "not found total unique device", data: null });
            }
        })
    } catch (eror) {
        return res.status(200).send({ error: true, message: "failed to total unique device", data: null });
    }
}

module.exports = { countFranchise, totalBalanceActiveStudent, totalUsedBalanceActicveStudent, totalStudentActive, totalUniqueDeviceName }