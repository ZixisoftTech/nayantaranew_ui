try { if (typeof process.loadEnvFile === 'function') process.loadEnvFile(require('path').join(__dirname, '.env.local')); } catch (e) { /* production: no .env.local */ }
const loginRoutes = require("./routes/franchise_routes/loginRoutes");
const express = require('express');
const cors = require('cors');
const app = express();
const port = 8085;
// const port = 8000;
// var basePath = 'http://localhost/nayantara/nayantarafrontend';
// var basePath = 'http://192.168.29.47/nayantarafrontend';
var basePath = process.env.FRONTEND_URL || 'http://nayantarabyspacs.co.in';

app.use(express.json());
app.use(cors(
    {
        origin: '*'
    }
))

const bodyParser = require("body-parser");
const fs = require("fs");
const multer = require('multer')
const csv = require('fast-csv');
const path = require('path')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './uploads/')
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
var upload = multer({
    storage: storage
});

app.post('/import-csv', upload.single("import-csv"), (req, res) => {
    uploadCsv(__dirname + '/uploads/' + req.file.filename, req.body);
    res.redirect(`${basePath}/franchise/manage_students.php`)
});

async function getDepartmentData(franch_id, student_id) {
    return new Promise((resolve, reject) => {
        dataBase.query('select * from `tbl_department` where `id`= "' + student_id + '" and `franchise_id`= "' + franch_id + '"', function (error, results, fields) {
            return error ? reject(error) : resolve(results)
        });
    })
}

async function getStudent(franch_id, student_id) {
    return new Promise((resolve, reject) => {
        dataBase.query('select * from `tbl_student` where `student_roll_no`= "' + student_id + '" and `franchise_id`= "' + franch_id + '"', function (error, results, fields) {
            return error ? reject(error) : resolve(results)
        });
    })
}

// function uploadCsv(uriFile, body) {
//     let stream = fs.createReadStream(uriFile);
//     let csvDataColl = [];
//     let fileStream = csv
//         .parse()
//         .on("data", function (data) {
//             data.push(body.franch_id);
//             csvDataColl.push(data);
//         })
//         .on("end", function () {
//             csvDataColl.shift();
//             const filteredData = csvDataColl.filter((row, index) => {
//                 const lastRow = index > 0 ? csvDataColl[index - 1] : null;
//                 const currentFranchiseId = row[1];
//                 const lastFranchiseId = lastRow ? lastRow[1] : null;
//                 return currentFranchiseId !== lastFranchiseId;
//             });

//             filteredData.map(async (student_id, key) => {
//                 var department = await getDepartmentData(body.franch_id, student_id[3]);
//                 if (department[0] == undefined) {
//                     var sql = 'INSERT INTO tbl_studentskip (name,student_roll_no,password,department_id,franchise_id) VALUES (?)';
//                     const VALUES = student_id
//                     dataBase.query(sql, [student_id], function (error, res) {
//                         console.log(error || res);
//                     })
//                 } else {
//                     var student = await getStudent(body.franch_id, student_id[1]);
//                     if (student[0] == undefined) {
//                         var sql = 'INSERT INTO tbl_student (name,student_roll_no,password,department_id,franchise_id) VALUES (?)';
//                         const VALUES = student_id
//                         dataBase.query(sql, [student_id], function (error, res) {
//                             console.log(error || res);
//                         })
//                     } else {
//                         var sql = 'INSERT INTO tbl_studentskip (name,student_roll_no,password,department_id,franchise_id) VALUES (?)';
//                         const VALUES = student_id
//                         dataBase.query(sql, [student_id], function (error, res) {
//                             console.log(error || res);
//                         })
//                     }
//                 }
//             })
//             fs.unlinkSync(uriFile)
//         });

//     stream.pipe(fileStream);
// }

async function uploadCsv(uriFile, body) {
    console.log("body data------", body);

    let stream = fs.createReadStream(uriFile);
    let csvDataColl = [];

    let fileStream = csv
        .parse()
        .on("data", function (data) {
            data.push(body.franch_id);
            csvDataColl.push(data);
        })
        .on("end", async function () {

            csvDataColl.shift(); // remove header

            for (const student_id of csvDataColl) {

                const department = await getDepartmentData(body.franch_id, student_id[3]);

                // ================= STUDENT SKIP =================
                if (!department[0]) {
                    const sql = `
                        INSERT INTO tbl_studentskip
                        (franchise_id, department_id, name, student_roll_no, contact, password, status, created_at, updated_at)
                        VALUES (?)
                    `;

                    const insertData = [
                        body.franch_id,
                        student_id[3],
                        student_id[0],
                        student_id[1],
                        student_id[4],
                        student_id[2],
                        1,
                        new Date(),
                        new Date()
                    ];

                    dataBase.query(sql, [insertData], console.log);
                    continue;
                }

                // ================= CHECK STUDENT =================
                const student = await getStudent(body.franch_id, student_id[1]);

                if (!student[0]) {

                    // -------- INSERT STUDENT --------
                    const studentSql = `
                        INSERT INTO tbl_student
                        (franchise_id, department_id, name, student_roll_no, contact, password,
                         other_ref_1, other_ref_2, other_ref_3, defaultplan, autorecharge)
                        VALUES (?)
                    `;

                    const studentInsertData = [
                        body.franch_id,
                        student_id[3],
                        student_id[0],
                        student_id[1],
                        student_id[4],
                        student_id[2],
                        student_id[5],
                        student_id[6],
                        student_id[7],
                        student_id[8],
                        student_id[9]
                    ];

                    dataBase.query(studentSql, [studentInsertData], (err, res) => {
                        if (err) {
                            console.error(err);
                            return;
                        }

                        const studentDbId = res.insertId;

                        // ================= INSERT PARENTS =================
                        const parentSql = `
                            INSERT INTO tbl_parents
                            (student_id, franchise_id, name, contact, email, password, otp, status, fcm_token, created_at, updated_at, total_talktime)
                            VALUES (?)
                        `;

                        const parents = [
                            { name: student_id[10], contact: student_id[11] },
                            { name: student_id[12], contact: student_id[13] },
                            { name: student_id[14], contact: student_id[15] },
                            { name: student_id[16], contact: student_id[17] },
                            { name: student_id[18], contact: student_id[19] },
                        ];

                        parents.forEach(p => {
                            if (p.name && p.contact) {
                                const parentInsertData = [
                                    studentDbId,
                                    body.franch_id,
                                    p.name,
                                    p.contact,
                                    null,
                                    null,
                                    null,
                                    1,
                                    null,
                                    new Date(),
                                    new Date(),
                                    0
                                ];

                                dataBase.query(parentSql, [parentInsertData], err => {
                                    if (err) console.error(err);
                                });
                            }
                        });
                    });

                } else {
                    // ================= DUPLICATE STUDENT =================
                    const sql = `
                        INSERT INTO tbl_studentskip
                        (franchise_id, department_id, name, student_roll_no, contact, password, status, created_at, updated_at)
                        VALUES (?)
                    `;

                    const insertData = [
                        body.franch_id,
                        student_id[3],
                        student_id[0],
                        student_id[1],
                        student_id[4],
                        student_id[2],
                        1,
                        new Date(),
                        new Date()
                    ];

                    dataBase.query(sql, [insertData], console.log);
                }
            }

            fs.unlinkSync(uriFile); // delete CSV after all inserts
        });

    stream.pipe(fileStream);
}

app.post('/imports-csv', upload.single("imports-csv"), (req, res) => {
    uploadsCsv(__dirname + '/uploads/' + req.file.filename, req.body);
    res.redirect(`${basePath}/franchise/manage_students.php`)
});

async function getParent(contact) {
    return new Promise((resolve, reject) => {
        dataBase.query('select * from `tbl_parents` where `contact`= "' + contact + '"', function (error, results, fields) {
            return error ? reject(error) : resolve(results)
        });
    })
}

function uploadsCsv(uriFile, body) {
    let stream = fs.createReadStream(uriFile);
    var csvDataColl = []
    let fileStream = csv
        .parse()
        .on("data", function (data) {
            data.push(body.franchis_id);
            csvDataColl.push(data);
        })
        .on("end", function () {
            csvDataColl.shift();
            const filteredData = csvDataColl.filter((row, index) => {
                const lastRow = index > 0 ? csvDataColl[index - 1] : null;
                const currentFranchiseId = row[2];
                const lastFranchiseId = lastRow ? lastRow[2] : null;
                return currentFranchiseId !== lastFranchiseId;
            });
            filteredData.map(async (student_id, key) => {
                var student = await getStudent(body.franchis_id, student_id[0]);
                if (student[0] != undefined) {
                    var parent = await getParent(student_id[2]);
                    if (parent[0] == undefined) {
                        var sql = 'INSERT INTO tbl_parents (student_id,name,contact,email,password,franchise_id) VALUES (?)';
                        student_id[0] = student[0].id
                        dataBase.query(sql, [student_id], function (error, res) {
                            console.log(error || res);
                        })
                    } else {
                        var sql = 'INSERT INTO tbl_parentskip (student_id,name,contact,email,password,franchise_id) VALUES (?)';
                        student_id[0] = student[0].id
                        dataBase.query(sql, [student_id], function (error, res) {
                            console.log(error || res);
                        })
                    }
                } else {
                    var sql = 'INSERT INTO tbl_parentskip (student_id,name,contact,email,password,franchise_id) VALUES (?)';
                    var VALUES = student_id
                    dataBase.query(sql, [student_id], function (error, res) {
                        console.log(error || res);
                    })
                }
            })
            fs.unlinkSync(uriFile)
        })
    stream.pipe(fileStream);
};

const dataBase = require('./config/db');
const franchiseDashboard = require('./routes/student_routes/dashboard.route');
const loginStudent = require('./routes/student_routes/loginRoute');
const addFranchise = require('./routes/addFranchiseRoute');
const addDepartment = require('./routes/addDepartmentRoute');
const manageSubscription = require('./routes/manageSubscriptions');
const franchiseStudents = require('./routes/franchise_routes/franchise_students');
const loginParent = require('./routes/parents_routes/login');
const phonepePayement = require('./routes/parents_routes/payement_getway_routes');
const adminLogin = require('./routes/adminLoginRoutes');
const assignplan = require('./routes/assignplan');
const callHistory = require('./routes/callhistory_routes');
const transaction = require('./routes/transaction_routes');
const login_message = require('./routes/login_message_route');
const dashboard = require('./routes/dashboard.route');
const lookup = require('./routes/lookup_routes');
const { log } = require('console');
const { getDepartment } = require('./models/super_admin/addDepartment');

app.use(require('./routes/lists_routes'));
app.use('/api', transaction);
app.use('/api', callHistory);
app.use('/api', assignplan);
app.use('/api', adminLogin);
app.use('/parent', loginParent);
app.use('/api', loginStudent);
app.use('/managestudents', franchiseStudents);
app.use('/franchise', loginRoutes);
app.use('/subscription', manageSubscription);
app.use('/api', phonepePayement);
app.use('/api', addDepartment);
app.use('/api', addFranchise);
app.use('/api', require('./routes/settings_routes'));
app.use('/api/uploads/franchise', express.static(path.join(__dirname, 'uploads/franchise')));
app.use('/api', login_message);
app.use('/api', dashboard);
app.use('/api', lookup);
app.use('/api', franchiseDashboard);

app.use("/franchise/api", loginRoutes);
require('./models/call_rules').startAllotmentJob();

app.listen(port, () => {
    console.log(`Server is running http://${dataBase.config.host}:${port}`);
})