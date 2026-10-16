const dataBase = require('../../config/db');

const totalActiveStudent = (req, res) => {
    try {
        const id = req.params.id;
        if (id === '') {
            return res.status(200).send({ error: true, message: "Id not found", data: null });
        } else {
            dataBase.query('SELECT COUNT(*) as active_student FROM tbl_student WHERE login_status = "1" and franchise_id = "' + id + '"', function (error, result, fields) {
                if (result) {
                    return res.status(200).send({ error: false, message: "Successfully found active student", data: result });
                } else {
                    return res.status(200).send({ error: false, message: "Not found active student", data: null });
                }
            })
        }
    } catch (error) {
        return res.status(500).send({ error: true, message: "failed to total active student", data: null });
    }
};

const totalInactiveStudent = (req, res) => {
    try {
        const id = req.params.id;
        if (id === '') {
            return res.status(200).send({ error: true, message: "Id not found", data: null });
        } else {
            dataBase.query('SELECT COUNT(*) as inactive_student FROM tbl_student WHERE login_status = "0" and franchise_id = "' + id + '"', function (error, result, fields) {
                if (result) {
                    return res.status(200).send({ error: false, message: "Successfully found inactive student", data: result });
                } else {
                    return res.status(200).send({ error: false, message: "Not found inactive student", data: null });
                }
            })
        }
    } catch (error) {
        return res.status(500).send({ error: true, message: "failed to total inactive student", data: null });
    }
}

const totalCallMade = (req, res) => {
    try {
        const id = req.params.id;
        if (id === '') {
            return res.status(200).send({ error: true, message: "Id not found", data: null });
        } else {
            dataBase.query('SELECT COUNT(*) AS call_made FROM tbl_student JOIN tbl_callhistory ON tbl_callhistory.student_id = tbl_student.id WHERE tbl_student.franchise_id = "' + id + '"', function (error, result, fields) {
                if (result) {
                    return res.status(200).send({ error: false, message: "successfully found call made", data: result });
                } else {
                    return res.status(200).send({ error: true, message: "not found call made", data: null });
                }
            })
        }
    } catch (error) {
        return res.status(500).send({ error: true, message: "Failed total call made", data: null });
    }
}

const totalUsage = (req, res) => {
    try {
        const id = req.params.id;
        if (id === '') {
            return res.status(200).send({ error: true, message: "Id not found", data: null });
        } else {
            dataBase.query('SELECT SUM(ROUND(tbl_callhistory.minute / 60)) AS used_balance FROM tbl_student JOIN tbl_callhistory ON tbl_callhistory.student_id = tbl_student.id WHERE tbl_student.franchise_id = "' + id + '"', function (error, result, fields) {
                if (result) {
                    return res.status(200).send({ error: false, message: "successfully found total use balance", data: result });
                } else {
                    return res.status(200).send({ error: true, message: "not found total use balance", data: null });
                }
            })
        }
    } catch (error) {
        return res.status(500).send({ error: true, message: "Failed total use balance", data: null });
    }
}

const totalAvailable = (req, res) => {
    try {
        const id = req.params.id;
        if (id === '') {
            return res.status(200).send({ error: true, message: "Id not found", data: null });
        } else {
            dataBase.query('SELECT SUM(ROUND(tbl_student.total_talktime / 60)) AS available_balance FROM tbl_student WHERE tbl_student.franchise_id = "' + id + '"', function (error, result, fields) {
                if (result) {
                    return res.status(200).send({ error: false, message: "successfully found total available balance", data: result });
                } else {
                    return res.status(200).send({ error: true, message: "not found total available balance", data: null });
                }
            })
        }
    } catch (error) {
        return res.status(500).send({ error: true, message: "Failed total available balance", data: null });
    }
}

const totalDepartment = (req, res) => {
    try {
        const id = req.params.id;
        if (id === '') {
            return res.status(200).send({ error: true, message: "Id not found", data: null });
        } else {
            dataBase.query('SELECT COUNT(*) AS total_department FROM tbl_department WHERE franchise_id = "' + id + '"', function (error, result, fields) {
                if (result) {
                    return res.status(200).send({ error: false, message: "successfully found total department", data: result });
                } else {
                    return res.status(200).send({ error: true, message: "not found total department", data: null });
                }
            })
        }
    } catch (error) {
        return res.status(500).send({ error: true, message: "Failed total department", data: null });
    }
}

module.exports = { totalActiveStudent, totalInactiveStudent, totalCallMade, totalUsage, totalAvailable, totalDepartment }