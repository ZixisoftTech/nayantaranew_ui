const dataBase = require('../../config/db');
const jwt = require('jsonwebtoken');
const secretKey = "helloiamabhisheklodhi";

const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (email == 0) {
            return res.status(200).send({ error: true, message: "Please insert the email", data: null });
        } else {
            dataBase.query('SELECT * From tbl_admin WHERE email = ?', [email], function (error, findEmail, fields) {
                if (findEmail == 0) {
                    return res.status(200).send({ error: true, message: "Incorrect email", data: null });
                } else {
                    if (password == 0) {
                        return res.status(200).send({ error: true, message: "Please insert the passowrd", data: null });
                    } else {
                        if (findEmail[0].role === 'sub_admin') {
                            return res.status(200).send({ error: true, message: "Please sign in from the portal login page", data: null });
                        }
                        if (findEmail[0].password == password) {
                            const id = findEmail[0].id;
                            const admintoken = jwt.sign({ userId: id, role: "admin" }, secretKey);
                            findEmail[0].admintoken = admintoken;
                            return res.status(200).send({ error: false, message: "Admin successfully Login", data: findEmail[0] })
                        } else {
                            return res.status(200).send({ error: true, message: "Incorrect password", data: null });
                        }
                    }
                }
            })
        }
    } catch (error) {
        return res.status(200).send({ error: true, message: "admin login api not working" });
    }
}

const adminName = async (req, res, next) => {
    try {
        const { admintoken } = req.body;
        if (admintoken == 0) {
            return res.status(200).send({ error: true, message: "Please insert the admin token" });
        } else {
            const { userId } = jwt.verify(admintoken, secretKey);
            if (userId == 0) {
                return res.status(401).send({ error: true, message: "Not Authorised" });
            } else {
                dataBase.query('SELECT * FROM tbl_admin WHERE Id = "' + userId + '"', (error, findAdminName, fileds) => {
                    if (error || !findAdminName || findAdminName.length == 0) {
                        return res.status(200).send({ error: true, message: "Authorised name not found", data: null });
                    } else {
                        return res.status(200).send({ error: false, message: "Authorised name successsfully found", data: findAdminName[0] });
                    }
                });
            }
        }
    } catch (error) {
        return res.status(402).send({ error: true, message: "Admin name api not working" });
    }
};

const getAllData = (req, res) => {
    try {
        dataBase.query('SELECT * FROM `tbl_demo`', (error, result) => {
            if (error) {
                return res.status(200).json({ error: true, message: `${error}`, data: null });
            }
            if (result[0] == undefined) {
                return res.status(200).json({ error: true, message: "data not get successfully", data: null });
            } else {
                return res.status(200).json({ error: true, message: "data get successfully", data: result });
            }
        })
    } catch (error) {
        return res.status(500).json({ error: true, message: "failed to data get", data: null });
    }
}

module.exports = { adminLogin, adminName, getAllData };