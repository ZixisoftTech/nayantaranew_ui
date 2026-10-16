const dataBase = require('../../config/db');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (email == 0 || password == 0) {
            return res.status(400).send({ error: true, message: "Please insert email and password" });
        } else {
            dataBase.query('SELECT * FROM tbl_franchise WHERE email = "' + email + '"', (error, findFranchise, fileds) => {
                if (findFranchise == 0) {
                    return res.status(200).send({ error: true, message: "Please enter correct email" });
                } else {
                    if (findFranchise[0].password != password) {
                        return res.status(200).send({ error: true, message: "please enter correct password", data: null });
                    } else {
                        if (findFranchise[0].status == 0) {
                            return res.status(200).send({ error: true, message: "Franchie not active this moment" });
                        } else {
                            const id = findFranchise[0].Id;
                            const franchisetoken = jwt.sign({ userId: id, role: "franchise" }, "helloiamabhisheklodhi");
                            findFranchise[0].franchisetoken = franchisetoken;
                            return res.status(200).send({ error: false, message: "Franchise successfully Login", data: findFranchise });
                        }
                    }
                }
            })
        }
    } catch (error) {
        return res.status(400).send({ error: true, message: "Parent login api not working" });
    }
}

const franchiseName = async (req, res, next) => {
    try {
        const { franchisetoken } = req.body;
        if (franchisetoken == 0) {
            return res.status(400).send({ error: true, message: "Please insert the Franchise token" });
        }
        else {
            const { userId } = jwt.verify(franchisetoken, "helloiamabhisheklodhi");
            if (userId == 0) {
                return res.status(400).send({ error: true, message: "Not Authorised", data: null });
            } else {
                dataBase.query('SELECT * FROM tbl_franchise WHERE id = "' + userId + '"', (error, results, fileds) => {
                    return res.status(200).send({ error: false, message: "Authorised successfuy get name", data: results[0] });
                });
            }
        }
    } catch (error) {
        return res.status(401).send({ error: true, message: "Franchise name api not working" });
    }
}

module.exports = { login, franchiseName };