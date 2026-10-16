const crypto = require('crypto');
const axios = require('axios');
const dataBase = require("../../config/db");

const generateTransactionId = () => {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000);
    const merchantPrefix = 'T';
    const transactionId = `${merchantPrefix}${timestamp}${randomNum}`;
    return transactionId;
}

const phonepePayement = async (req, res) => {
    try {
        const { id, name, number, amount } = req.body;
        const data = {
            "merchantId": "PGTESTPAYUAT",
            "merchantTransactionId": generateTransactionId(),
            "merchantUserId": "MUID" + Date.now(),
            "name": name,
            "amount": amount * 100,
            "redirectUrl": `http://localhost:8085/api/payement-status/${id}`,
            "redirectMode": "POST",
            "callbackUrl": `http://localhost:8085/api/payement-status/${id}`,
            "mobileNumber": number,
            "paymentInstrument": {
                "type": "PAY_PAGE"
            }
        }
        const payload = JSON.stringify(data);
        const payloadMain = Buffer.from(payload).toString('base64');
        const key = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
        const keyIndex = 1;
        const string = payloadMain + '/pg/v1/pay' + key;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + '###' + keyIndex;

        const URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
        const options = {
            method: 'POST',
            url: URL,
            headers: { accept: 'application/json', 'Content-Type': 'application/json', 'X-VERIFY': checksum },
            data: {
                request: payloadMain
            }
        };

        axios
            .request(options)
            .then(function (response) {
                return res.status(200).send(response.data.data.instrumentResponse.redirectInfo.url);
            })
            .catch(function (error) {
                console.error(error);
            });

    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to phonepe payement", data: null });
    }
};

const payementStatus = async (req, res) => {
    try {
        const merchantTransactionId = res.req.body.transactionId
        const merchantId = res.req.body.merchantId
        const keyIndex = 1;
        const key = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
        const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + key;
        const sha256 = crypto.createHash('sha256').update(string).digest('hex');
        const checksum = sha256 + '###' + keyIndex;

        const urls = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${merchantTransactionId}`;

        const options = {
            method: 'GET',
            url: urls,
            headers: { accept: 'application/json', 'Content-Type': 'application/json', 'X-VERIFY': checksum, 'X-MERCHANT-ID': merchantTransactionId },
        };

        const makeRequest = () => {
            axios.request(options).then(function (response) {
                console.log(response.data);
                if (response.data) {
                    if (response.data.data.paymentInstrument.type == 'NETBANKING') {
                        dataBase.query('INSERT INTO `tbl_transaction`(`parent_id`, `transactionId`, `type`, `amount`, `state`, `response_code`) VALUES (?,?,?,?,?,?)', [req.params.id, response.data.data.transactionId, response.data.data.paymentInstrument.type, response.data.data.amount / 100, response.data.data.state, response.data.data.responseCode], (error, result) => {
                            if (error) {
                                return res.status(200).json({ error: true, message: `${error}`, data: null })
                            }
                            if (result.affectedRows === 1) {
                                return res.status(200).json({ error: false, message: "SUCCESS", data: null })
                            } else {
                                return res.status(200).json({ error: true, message: "FAILED", data: null })
                            }
                        })
                    } else {
                        if (response.data.data.paymentInstrument.type == 'UPI') {
                            dataBase.query('INSERT INTO `tbl_transaction`(`parent_id`, `transactionId`, `type`, `ifsc`, `amount`, `state`, `response_code`) VALUES (?,?,?,?,?,?,?)', [req.params.id, response.data.data.transactionId, response.data.data.paymentInstrument.type, response.data.data.paymentInstrument.ifsc, response.data.data.amount / 100, response.data.data.state, response.data.data.responseCode], (error, result) => {
                                if (error) {
                                    return res.status(200).json({ error: true, message: `${error}`, data: null })
                                }
                                if (result.affectedRows === 1) {
                                    return res.status(200).json({ error: false, message: "SUCCESS", data: null })
                                } else {
                                    return res.status(200).json({ error: true, message: "FAILED", data: null })
                                }
                            })
                        } else {
                            dataBase.query('INSERT INTO `tbl_transaction`(`parent_id`, `transactionId`, `type`, `cardType`, `amount`, `state`, `response_code`) VALUES (?,?,?,?,?,?,?)', [req.params.id, response.data.data.transactionId, response.data.data.paymentInstrument.type, response.data.data.paymentInstrument.cardType, response.data.data.amount / 100, response.data.data.state, response.data.data.responseCode], (error, result) => {
                                if (error) {
                                    return res.status(200).json({ error: true, message: `${error}`, data: null })
                                }
                                if (result.affectedRows === 1) {
                                    return res.status(200).json({ error: false, message: "SUCCESS", data: null })
                                } else {
                                    return res.status(200).json({ error: true, message: "FAILED", data: null })
                                }
                            })
                        }
                    }
                }
            })
                .catch(function (error) {
                    if (error.response.status === 429) {
                        // const retryAfterSeconds = parseInt(error.response.headers['retry-after'], 10);
                        console.log(`Rate limit exceeded. Retrying after seconds.`);
                        setTimeout(() => {
                            // Retry the request after the specified delay
                            makeRequest();
                        }, 1000); // Convert seconds to milliseconds
                    } else {
                        console.error("Failed Api =>", error);
                    }
                });
        };
        makeRequest();
    } catch (error) {
        return res.status(500).json({ error: true, message: "Failed to phonepe status", data: null });
    }
}

module.exports = { phonepePayement, payementStatus };