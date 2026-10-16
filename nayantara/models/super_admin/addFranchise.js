const dataBase = require('../../config/db');

const getStateName = async (req, res, next) => {
    try {
        dataBase.query('SELECT * From tbl_states', (error, findState, fields) => {
            if (findState == 0) {
                return res.status(200).send({ error: true, message: "state not found", data: null });
            }
            else {
                return res.status(200).send({ error: false, message: "state successfully found", data: findState });
            }
        })
    } catch (error) {
        return res.status(400).send({ error: true, message: "State Name api not working" });
    }
}

const getCityByStateID = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(401).send({ error: true, message: "Please insert Id" });
        }
        else {
            const findState = 'SELECT * From tbl_states where id = "' + id + '"';
            dataBase.query(findState, (error, stateId, fields) => {
                if (stateId == 0) {
                    return res.status(401).send({ error: true, message: "state ID Not found in city", data: null });
                } else {
                    const state = stateId;
                    const findCityByStateID = 'SELECT * From tbl_cities WHERE state_id = "' + state[0].id + '" ';
                    dataBase.query(findCityByStateID, (error, cityName, fields) => {
                        if (cityName == 0) {
                            return res.status(402).send({ error: true, message: "City not found", data: null });
                        }
                        else {
                            res.send(cityName);
                        }
                    })
                }
            })
        }
    } catch (error) {
        return res.status(401).send({ error: true, message: "City name by id api not working" });
    }
}

const getPalnPermission = (req, res, next) => {
    try {
        const id = req.params.id;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please enter the id" });
        } else {
            dataBase.query('SELECT by_plan_permision From tbl_franchise WHERE Id = "' + id + '"', function (error, findPlanPermission, fileds) {
                if (findPlanPermission == 0) {
                    return res.status(200).send({ error: true, message: "Plan permission not found", data: null });
                } else {
                    return res.status(200).send({ error: false, message: "Plan permission successfully found", data: findPlanPermission });
                }
            })
        }
    } catch (error) {
        return res.status(400).send({ error: true, message: "get plan permission api not working" });
    }
}

const addFranchise = (req, res, next) => {
    try {
        const { franchiseName, franchiserName, email, password, address, state, city, pincode, room_id, hash, by_plan_permision, remark } = req.body;
        if (franchiseName == 0 || franchiserName == 0 || email == 0 || password == 0 || address == 0 || state == 0 || city == 0 || pincode == 0 || room_id == 0 || by_plan_permision === '') {
            return res.status(401).send({ error: true, message: "Please insert all field" });
        }
        else {
            dataBase.query('SELECT * From tbl_franchise WHERE email = "' + email + '"', (error, findEmail, fields) => {
                if (findEmail == 0) {
                    const Values = [franchiseName, franchiserName, email, password, address, state, city, pincode, room_id, hash, by_plan_permision, remark];
                    dataBase.query('INSERT INTO tbl_franchise (franchiseName, franchiserName, email, password, address, state, city, pincode, room_id, hash, by_plan_permision, remark) VALUES (?)', [Values], (error, addFranchise, fields) => {
                        if (addFranchise == 0) {
                            return res.status(200).send({ error: true, message: "Franchise not successfully add", data: null });
                        } else {
                            return res.status(200).send({ error: false, message: "Franchise successsfully add", data: addFranchise });
                        }
                    })
                } else {
                    return res.status(200).send({ error: true, message: "Email already exists", data: null });
                }
            })
        }
    } catch (error) {
        return res.status(400).send({ error: true, message: "add franchise api not working" });
    }
}

const deleteFranchise = (req, res, next) => {
    try {
        const id = req.params.Id;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert the id" });
        }
        else {
            dataBase.query('DELETE FROM tbl_franchise WHERE Id = "' + id + '"', function (error, results, fields) {
                if (results) {
                    return res.status(200).send({ error: false, message: "Farnchise Successfully deleted", data: null });
                } else {
                    return res.status(200).send({ error: true, message: "Franchise not deleted", data: null });
                }
            });
        }
    } catch (error) {
        return res.status(401).send({ error: true, message: "delete franchise api not working" });
    }
}

const getFranchise = (request, response, next) => {

    var draw = request.query.draw;

    var start = request.query.start;

    var length = request.query.length;

    var order_data = request.query.order;

    if (typeof order_data == 'undefined') {
        var column_name = 'tbl_franchise.id';
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
     (franchiseName LIKE '%${search_value}%' 
     OR franchiserName LIKE '%${search_value}%'
     OR email LIKE '%${search_value}%'
     OR password LIKE '%${search_value}%'
     OR address LIKE '%${search_value}%'
     OR pincode LIKE '%${search_value}%'
     OR room_id LIKE '%${search_value}%'
     )
     `;

    //Total number of records without filtering

    dataBase.query("SELECT COUNT(*) AS Total FROM tbl_franchise", function (error, data) {

        var total_records = data[0].Total;


        //Total number of records with filtering

        dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_franchise WHERE ${search_query}`, function (error, data) {
            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT tbl_franchise.*, tbl_states.name as state_name,tbl_cities.name as cities_name from tbl_franchise left join tbl_states ON tbl_states.id = tbl_franchise.state left join tbl_cities ON tbl_cities.id = tbl_franchise.city
            WHERE ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

            var data_arr = [];

            dataBase.query(query, function (error, data) {
                data.forEach(function (row, index) {

                    if (row.status == 1) {
                        var statusbtn = '<button onclick="statusChange(' + row.Id + ')" id="active" class="btn-success" value="0">active</button>';
                    } else {
                        var statusbtn = '<button class="btn-danger" onclick="statuschange(' + row.Id + ')" id="inactive" value="1">inactive</button>';
                    }

                    if (row.by_plan_permision == 1) {
                        var plan_permision = 'YES';
                    } else {
                        var plan_permision = 'NO';
                    }

                    var action = `<a href="javascript:void(0);" 
                    data-toggle="modal" data-target=".edit"
                    class="btn-sm" onclick="getUpdateValue(${row.Id})" > <i
                        class="bx bx-edit-alt"></i> </a>
                            <a href="javascript:void(0);" id="sa-params" class="btn-sm delete"
                                data-id=${row.Id}>
                                <i class="bx bx-trash-alt"></i>
                            </a>`;

                    data_arr.push({
                        '_ref': { franchise: row.Id },
                        'index': ++start,
                        'franchiseName': row.franchiseName,
                        'franchiserName': row.franchiserName,
                        'email': row.email,
                        'password': row.password,
                        'address': row.address,
                        'state_name': row.state_name,
                        'cities_name': row.cities_name,
                        'pincode': row.pincode,
                        'room_id': row.room_id,
                        'hash': row.hash,
                        'plan_permision': plan_permision,
                        'remark': row.remark,
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
                response.json(output);
            });

        });

    });
}

const getFranchiseId = (req, res, next) => {
    try {
        const id = req.params.Id;
        if (id == 0) {
            return res.status(200).send({ error: true, message: "Please insert Id" });
        }
        else {
            dataBase.query('SELECT * From tbl_franchise WHERE Id ="' + id + '"', (error, results, fields) => {
                if (results == 0) {
                    return res.status(200).send({ error: true, message: "Franchise not found by ID", data: null });
                } else {
                    return res.status(200).send({ error: false, message: "Franchise Successfuly Founnd By Id", data: results });
                }
            })
        }
    } catch (err) {
        res.send("Api Not Working");
        return res.status(401).send({ error: true, message: "get franchiseById api not working", data: null });
    }
}

const editFranchise = (req, res, next) => {
    try {
        const updateData = req.body;
        if (updateData.id == 0) {
            return res.status(401).send({ error: true, message: "Please insert the ID" });
        }
        else {
            dataBase.query('UPDATE tbl_franchise SET ? WHERE Id = ?', [updateData, updateData.id], (error, results, fields) => {
                if (results) {
                    return res.status(200).send({ error: false, message: "Franchise Successfully Update", data: results });
                } else {
                    return res.status(200).send({ error: true, message: "Franchise not successfully Update", data: null });
                }
            })
        }
    } catch (error) {
        return res.status(402).send({ error: true, message: "Update Franchise api not working" });
    }
}

const statusDeactive = (req, res, next) => {
    try {
        const id = req.params.Id;
        const status = req.body;
        if (id == 0) {
            return res.send(200).send({ error: true, message: "Please inseert the id" });
        }
        else {
            dataBase.query('UPDATE tbl_franchise SET ? WHERE Id = "' + id + '"', [status], (error, results, fields) => {
                if (results) {
                    res.send(results);
                } else {
                    return res.status(200).send({ error: true, message: "Status not be update", data: null });
                }
            })
        }
    } catch (error) {
        return res.status(401).send({ error: true, message: "Status deactive api not working" });
    }
}

module.exports = { addFranchise, deleteFranchise, getFranchise, getFranchiseId, editFranchise, getStateName, getCityByStateID, statusDeactive, getPalnPermission };