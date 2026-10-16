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


const addMessage = (req, res, next) => {
    try {
        const { message } = req.body;
        if (message == 0) {
            return res.status(200).send({ error: true, message: "Pleaseinsert the message", data: null });
        } else {
            dataBase.query('INSERT INTO tbl_login_message (message) VALUES (?)', [message], function (error, addMessage, fields) {
                if (addMessage == 0) {
                    return res.status(200).send({ error: true, message: "Message not successfully add", data: null });
                } else {
                    return res.status(200).send({ error: false, message: "Message successfuly add", data: addMessage });
                }
            })
        }
    } catch (error) {
        return res.status(200).send({ error: true, message: "login message api not working" });
    }
}

const getMessage = (req, res, next) => {
    try {
        dataBase.query('SELECT * From tbl_login_message', function (error, messageGet, fields) {
            if (messageGet == 0) {
                return res.status(200).send({ error: true, message: "Message not found", data: null });
            } else {
                return res.status(200).send({ error: false, message: "Message successfully found", data: messageGet[0] });
            }
        })
    } catch (error) {
        return res.status(200).send({ error: true, message: "get message api not working" });
    }
}

const updateMessage = (req, res, next) => {
    try {
        Upload(req, res, (err) => {
            if (err) {
                return res.status(200).send({ error: true, message: "Multer not be working" });
            } else {
                const { id, message } = req.body;
                if (message == 0) {
                    return res.status(200).send({ error: true, message: "Please enter message" });
                } else {
                    dataBase.query('UPDATE tbl_login_message SET message = ? WHERE id = ?', [message,id], function (error, updateMessage, fields) {
                        if (updateMessage) {
                            return res.status(200).send({ error: false, message: "Message successfully update", data: updateMessage });
                        } else {
                            return res.status(200).send({ error: true, message: "Message not update", data: null });
                        }
                    })
                }
            }
        })
    } catch (error) {
        return res.status(200).send({ error: true, message: "updateMessage api not working" });
    }
}

module.exports = { addMessage, getMessage, updateMessage };