const dataBase = require('../../config/db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { ensureColumns } = require('../schema');

/*
 * School settings stored on each franchise. Defaults keep the current behaviour (1 coin/min, no fee,
 * 0 = no daily limit) until a school is configured. Missing columns are added once at startup so
 * existing databases pick up the new fields without a manual migration.
 */
const SETTINGS_COLUMNS = {
    logo: 'VARCHAR(255) NULL DEFAULT NULL',
    allow_parental_recharge: 'TINYINT(1) NOT NULL DEFAULT 1',
    allow_audio_calls: 'TINYINT(1) NOT NULL DEFAULT 1',
    video_rate: 'DECIMAL(10,2) NOT NULL DEFAULT 1.00',
    audio_rate: 'DECIMAL(10,2) NOT NULL DEFAULT 1.00',
    activation_fee: 'DECIMAL(10,2) NOT NULL DEFAULT 0.00',
    max_calls_per_day: 'INT(11) NOT NULL DEFAULT 0',
    daily_duration_min: 'INT(11) NOT NULL DEFAULT 0',
    min_call_duration_sec: 'INT(11) NOT NULL DEFAULT 30',
};

ensureColumns('tbl_franchise', SETTINGS_COLUMNS);

/**
 * The school's email + password is its portal login, so the email can't belong to an admin / sub admin
 * (they'd win at sign-in) or to another school. Calls back with an error message or null.
 */
const loginEmailTaken = (email, franchiseId, callBack) => {
    dataBase.query(
        `SELECT (SELECT COUNT(*) FROM tbl_admin WHERE email = ?) AS admins,
                (SELECT COUNT(*) FROM tbl_franchise WHERE email = ? AND Id <> ?) AS schools`,
        [email, email, Number(franchiseId) || 0],
        (error, rows) => {
            if (error) return callBack('Unable to check the email');
            if (rows[0].admins > 0) return callBack('This email is used by an admin or sub admin login');
            if (rows[0].schools > 0) return callBack('Email already exists');
            return callBack(null);
        });
};

/** Validates the school settings in a request body. Returns { values } or { message } on error. */
const readSettings = (body) => {
    const values = {};
    for (const flag of ['allow_parental_recharge', 'allow_audio_calls']) {
        if (body[flag] !== undefined) values[flag] = (body[flag] === true || body[flag] == 1) ? 1 : 0;
    }
    const numbers = {
        video_rate: { label: 'Video rate', decimal: true },
        audio_rate: { label: 'Audio rate', decimal: true },
        activation_fee: { label: 'Parent account activation fee', decimal: true },
        max_calls_per_day: { label: 'Max calls per day' },
        daily_duration_min: { label: 'Daily duration allowance' },
        min_call_duration_sec: { label: 'Min call duration' },
    };
    for (const [field, rule] of Object.entries(numbers)) {
        if (body[field] === undefined || body[field] === '') continue;
        const value = Number(body[field]);
        if (!Number.isFinite(value) || value < 0 || (!rule.decimal && !Number.isInteger(value))) {
            return { message: `${rule.label} must be a ${rule.decimal ? 'positive number' : 'positive whole number'}` };
        }
        values[field] = value;
    }
    if (body.logo !== undefined) values.logo = body.logo || null;
    return { values };
};

const LOGO_DIR = path.join(__dirname, '../../uploads/franchise');
fs.mkdirSync(LOGO_DIR, { recursive: true });

const logoUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callBack) => callBack(null, LOGO_DIR),
        filename: (req, file, callBack) => callBack(null, 'logo-' + Date.now() + path.extname(file.originalname).toLowerCase()),
    }),
    limits: { fileSize: 512 * 1024 },
    fileFilter: (req, file, callBack) => {
        const ok = ['image/png', 'image/jpeg'].includes(file.mimetype) && ['.png', '.jpg', '.jpeg'].includes(path.extname(file.originalname).toLowerCase());
        callBack(ok ? null : new Error('Only JPG or PNG images are allowed'), ok);
    },
}).single('logo');

const uploadFranchiseLogo = (req, res, next) => {
    logoUpload(req, res, (error) => {
        if (error) {
            const message = error.code === 'LIMIT_FILE_SIZE' ? 'Logo must be 512 KB or smaller' : error.message;
            return res.status(200).send({ error: true, message, data: null });
        }
        if (!req.file) {
            return res.status(200).send({ error: true, message: "Please choose a logo", data: null });
        }
        return res.status(200).send({ error: false, message: "Logo successfully uploaded", data: { logo: 'api/uploads/franchise/' + req.file.filename } });
    });
}

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
        const settings = readSettings(req.body);
        if (settings.message) {
            return res.status(200).send({ error: true, message: settings.message });
        }
        else {
            loginEmailTaken(email, 0, (taken) => {
                if (!taken) {
                    const row = { franchiseName, franchiserName, email, password, address, state, city, pincode, room_id, hash, by_plan_permision, remark, ...settings.values };
                    dataBase.query('INSERT INTO tbl_franchise SET ?', [row], (error, addFranchise, fields) => {
                        if (addFranchise == 0) {
                            return res.status(200).send({ error: true, message: "Franchise not successfully add", data: null });
                        } else {
                            return res.status(200).send({ error: false, message: "Franchise successsfully add", data: addFranchise });
                        }
                    })
                } else {
                    return res.status(200).send({ error: true, message: taken, data: null });
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

    var start = Math.max(0, Number(request.query.start) || 0);

    var length = Math.max(1, Number(request.query.length) || 10);

    var order_data = request.query.order;

    if (typeof order_data == 'undefined') {
        var column_name = 'tbl_franchise.id';
        var column_sort_order = 'desc';
    }
    else {
        var column_index = request.query.order[0]['column'];

        // sort by whitelisted SQL columns; the DataTables keys (index, state_name, ...) aren't all real columns
        var sort_columns = { index: 'tbl_franchise.Id', franchiseName: 'tbl_franchise.franchiseName', franchiserName: 'tbl_franchise.franchiserName', email: 'tbl_franchise.email', password: 'tbl_franchise.password', address: 'tbl_franchise.address', state_name: 'tbl_states.name', cities_name: 'tbl_cities.name', pincode: 'tbl_franchise.pincode', plan_permision: 'tbl_franchise.by_plan_permision', remark: 'tbl_franchise.remark', status: 'tbl_franchise.status' };

        var column_name = sort_columns[request.query.columns[column_index]['data']] || 'tbl_franchise.Id';

        var column_sort_order = request.query.order[0]['dir'] == 'asc' ? 'asc' : 'desc';
    }

    //search data

    var search_value = dataBase.escape('%' + ((request.query.search && request.query.search['value']) || '') + '%');

    var search_query = `
     (tbl_franchise.franchiseName LIKE ${search_value} 
     OR franchiserName LIKE ${search_value}
     OR tbl_franchise.email LIKE ${search_value}
     OR password LIKE ${search_value}
     OR address LIKE ${search_value}
     OR pincode LIKE ${search_value}
     OR room_id LIKE ${search_value}
     OR tbl_states.name LIKE ${search_value}
     OR tbl_cities.name LIKE ${search_value}
     )
     `;

    //Total number of records without filtering

    dataBase.query("SELECT COUNT(*) AS Total FROM tbl_franchise", function (error, data) {

        var total_records = data[0].Total;


        //Total number of records with filtering

        dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_franchise left join tbl_states ON tbl_states.id = tbl_franchise.state left join tbl_cities ON tbl_cities.id = tbl_franchise.city WHERE ${search_query}`, function (error, data) {
            var total_records_with_filter = data[0].Total;

            var query = `
            SELECT tbl_franchise.*, tbl_states.name as state_name,tbl_cities.name as cities_name from tbl_franchise left join tbl_states ON tbl_states.id = tbl_franchise.state left join tbl_cities ON tbl_cities.id = tbl_franchise.city
            WHERE ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

            var data_arr = [];

            dataBase.query(query, function (error, data) {
                (data || []).forEach(function (row, index) {

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
                        'logo': row.logo,
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
        const settings = readSettings(updateData);
        if (updateData.id == 0) {
            return res.status(401).send({ error: true, message: "Please insert the ID" });
        }
        else if (settings.message) {
            return res.status(200).send({ error: true, message: settings.message });
        }
        else {
            Object.assign(updateData, settings.values);
            loginEmailTaken(updateData.email, updateData.id, (taken) => {
                if (taken) {
                    return res.status(200).send({ error: true, message: taken, data: null });
                }
                dataBase.query('UPDATE tbl_franchise SET ? WHERE Id = ?', [updateData, updateData.id], (error, results, fields) => {
                    if (results) {
                        return res.status(200).send({ error: false, message: "Franchise Successfully Update", data: results });
                    } else {
                        return res.status(200).send({ error: true, message: "Franchise not successfully Update", data: null });
                    }
                })
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

module.exports = { uploadFranchiseLogo, addFranchise, deleteFranchise, getFranchise, getFranchiseId, editFranchise, getStateName, getCityByStateID, statusDeactive, getPalnPermission };