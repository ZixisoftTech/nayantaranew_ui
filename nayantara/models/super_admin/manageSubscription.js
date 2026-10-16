const dataBase = require('../../config/db');

const addSubscription = (req, res, next) => {
    try {
        const { franchise_id, plan_name, price, talktime_minutes } = req.body;
        if (franchise_id == 0 || plan_name == 0 || price == 0 || talktime_minutes == 0) {
            return res.status(200).send({ error: true, message: "Please insert All field" });
        } else {
            const time = talktime_minutes * 60;
            const Values = [franchise_id, plan_name, price, time];
            dataBase.query('INSERT INTO tbl_subscriptions (franchise_id,plan_name,price,talktime_minutes) VALUES (?)', [Values], (error, results, fields) => {
                if (results) {
                    return res.status(200).send({ error: false, message: "subscription data successfully addedd", data: results });
                } else {
                    return res.status(402).send({ error: true, message: "Subscription not successfully add", data: null });
                }
            })
        }
    } catch (error) {
        return res.status(401).send({ error: true, message: "addSubscription api not working" });
    }
}

const getSubscription = (request, response, next) => {

    var draw = request.query.draw;

    var start = request.query.start;

    var length = request.query.length;

    var order_data = request.query.order;

    if (typeof order_data == 'undefined') {
        var column_name = 'tbl_subscriptions.id';
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
     (plan_name LIKE '%${search_value}%' 
     OR price LIKE '%${search_value}%'
     OR talktime_minutes LIKE '%${search_value}%'
     )
     `;

    //Total number of records without filtering

    dataBase.query("SELECT COUNT(*) AS Total FROM tbl_subscriptions", function (error, data) {

        var total_records = data[0].Total;

        //Total number of records with filtering

        dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_subscriptions WHERE ${search_query}`, function (error, data) {

            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT tbl_subscriptions.*,CONCAT(FLOOR(tbl_subscriptions.talktime_minutes / 60)) AS talk_time_min, tbl_franchise.franchiseName as franchise_name from tbl_subscriptions left join tbl_franchise ON tbl_franchise.Id = tbl_subscriptions.franchise_id
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
                    class="btn-sm" onclick="getUpdateValue(${row.id})" > <i
                        class="bx bx-edit-alt"></i> </a>
                            <a href="javascript:void(0);" id="sa-params" class="btn-sm delete"
                                data-id=${row.id}>
                                <i class="bx bx-trash-alt"></i>
                            </a>`;

                    data_arr.push({
                        '_ref': { franchise: row.franchise_id },
                        'index': ++start,
                        'franchise_name': row.franchise_name,
                        'plan_name': row.plan_name,
                        'price': row.price,
                        'talk_time_min': row.talk_time_min,
                        "status": statusbtn,
                        "action": action,
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
};

const deleteSubscriptionById = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(401).send({ error: true, message: "Please insert ID" });
        } else {
            dataBase.query('DELETE FROM tbl_subscriptions WHERE id = ?', [id], (error, results, fields) => {
                if (results) {
                    return res.status(200).send({ error: false, message: "Data is Sucessfully Deleted", data: null });
                } else {
                    return res.status(200).send({ error: true, message: "Data not successfully deleted", data: null })
                }
            });
        }
    } catch (error) {
        return res.status(401).send({ error: true, message: "delete subscription api not working" });
    }
}

const getSubscriptionById = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(401).send({ error: true, message: "Please insert the Id" });
        } else {
            dataBase.query('SELECT tbl_subscriptions.*,(tbl_subscriptions.talktime_minutes / 60) AS `talktime_minutes`,tbl_franchise.franchiseName as subscriptions_name from tbl_subscriptions left join tbl_franchise ON tbl_franchise.Id = tbl_subscriptions.franchise_id WHERE tbl_subscriptions.id = "' + id + '"', (error, results, fields) => {
                if (results == 0) {
                    return res.status(200).send({ error: true, message: "Suscription not found in database" });
                } else {
                    res.send(results);
                }
            });
        }
    } catch (error) {
        return res.status(202).send({ console: true, message: "get Subscription by id api not working" });
    }
}

const editSubscription = (req, res, next) => {
    try {
        const data = req.body;
        if (data.id == 0) {
            return res.status(401).send({ error: true, message: "Please insert the All field" });
        } else {
            const minutes = data.talktime_minutes * 60;
            dataBase.query('UPDATE tbl_subscriptions SET `franchise_id`="' + data.franchise_id + '",`plan_name`="' + data.plan_name + '",`price`="' + data.price + '",`talktime_minutes`="' + minutes + '"  WHERE id = ?', [data.id, data.franchise_id, data.plan_name, data.price, minutes], (error, results, fields) => {
                if (results) {
                    return res.status(200).send({ error: false, message: "Subscription are successfully Update", data: null });
                } else {
                    return res.status(200).send({ error: true, message: "Subscription are not successfully Update", data: null });
                }
            });
        }
    } catch (err) {
        return res.status(402).send({ error: true, message: "update subscription api not working" });
    }
}
const statusDeactive = (req, res, next) => {
    try {
        const id = req.params.id;
        const status = req.body;
        if (id == 0) {
            return req.status(401).send({ error: true, message: "Please insert the Id" });
        }
        else {
            dataBase.query('UPDATE tbl_subscriptions SET ? WHERE id = "' + id + '"', [status], (error, results, fields) => {
                if (results) {
                    res.send(results);
                } else {
                    return res.status(200).send({ error: true, message: "Status not succcessfully update" });
                }
            })
        }
    } catch (error) {
        return res.status(402).send({ error: true, message: "status update api not working" });
    }
}

module.exports = { addSubscription, statusDeactive, getSubscription, getSubscriptionById, deleteSubscriptionById, editSubscription };