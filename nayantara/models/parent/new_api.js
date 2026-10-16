const dataBase = require("../../config/db");
const multer = require("multer");

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

const getStudentByParentId = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(200).send({ error: true, message: "get student api nulter not working" });
            } else {
                const { id } = req.body;
                if (id == 0) {
                    return res.status(200).send({ error: true, message: "Please provide the id" });
                } else {
                    dataBase.query(`SELECT tbl_student.name,tbl_student.status FROM tbl_student LEFT JOIN tbl_parents ON tbl_student.id = tbl_parents.student_id WHERE tbl_parents.id = ${id}`, function (error, findStudent, fields) {
                        if (findStudent == 0) {
                            return res.status(200).send({ error: true, message: "Student not found", data: null })
                        } else {
                            return res.status(200).send({ error: false, message: "Student successfully found", data: findStudent[0] });
                        }
                    })
                }
            }
        })
    } catch (error) {
        return res.status(400).send({ error: true, message: "getStudentByParentId api not working" });
    }
}

module.exports = { getStudentByParentId };