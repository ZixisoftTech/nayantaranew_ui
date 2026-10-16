const dataBase = require('../../config/db');

const getCallHistory = (request, response, next) => {

    var id = request.query.id;

    var start_date = request.query.start_date;

    var end_date = request.query.end_date;
    if (id == 0 || id == "") {
        var draw = request.query.draw;
        var output = {
            'draw': draw,
            'iTotalRecords': 0,
            'iTotalDisplayRecords': 0,
            'aaData': []
        };
        response.json(output);
    } else {
        if (start_date != 0 || start_date != "" && end_date != 0 || end_date != "") {

            var draw = request.query.draw;

            var start = request.query.start;

            var length = request.query.length;

            var order_data = request.query.order;

            if (typeof order_data == 'undefined') {
                var column_name = 'tbl_callhistory.id';

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
            AND (student_name LIKE '%${search_value}%'
            )
            `;

            //Total number of records without filtering

            dataBase.query("SELECT COUNT(*) AS Total FROM tbl_callhistory", function (error, data) {

                var total_records = data[0].Total;

                //Total number of records with filtering

                dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_callhistory WHERE DATE(tbl_callhistory.created_at) BETWEEN '${start_date}' AND '${end_date}' ${search_query}`, function (error, data) {

                    var total_records_with_filter = data[0].Total;

                    var query = `
                SELECT tbl_student.*,tbl_callhistory.student_name as studentname,tbl_callhistory.parent_name as parentname,tbl_callhistory.parent_id as parentid,CONCAT(LPAD(FLOOR(minute / 60),2,"0"), ":", LPAD(MOD(minute, 60),2,"0")) as minutes,DATE_FORMAT(tbl_callhistory.created_at, "%d-%m-%Y") as dates from tbl_student left join tbl_callhistory ON tbl_callhistory.student_id = tbl_student.id WHERE tbl_student.department_id = ${id} AND DATE(tbl_callhistory.created_at) BETWEEN '${start_date}' AND '${end_date}' ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

                    var data_arr = [];

                    dataBase.query(query, function (error, data) {
                        data.forEach(function (row, index) {
                            data_arr.push({
                                '_ref': { student: row.id, parent: row.parentid },
                                'index': ++start,
                                'date': row.dates,
                                'student_name': row.studentname,
                                'parent_name': row.parentname,
                                'minutes': row.minutes
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
        } else {
            var draw = request.query.draw;

            var start = request.query.start;

            var length = request.query.length;

            var order_data = request.query.order;

            if (typeof order_data == 'undefined') {
                var column_name = 'tbl_callhistory.id';

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
            AND (student_name LIKE '%${search_value}%'
            )
            `;

            //Total number of records without filtering

            dataBase.query("SELECT COUNT(*) AS Total FROM tbl_callhistory", function (error, data) {

                var total_records = data[0].Total;

                //Total number of records with filtering

                dataBase.query(`SELECT COUNT(*) AS Total FROM tbl_callhistory WHERE 1 ${search_query}`, function (error, data) {

                    var total_records_with_filter = data[0].Total;

                    var query = `
                SELECT tbl_student.*,tbl_callhistory.student_name as studentname,tbl_callhistory.parent_name as parentname,tbl_callhistory.parent_id as parentid,CONCAT(LPAD(FLOOR(minute / 60),2,"0"), ":", LPAD(MOD(minute, 60),2,"0")) as minutes,DATE_FORMAT(tbl_callhistory.created_at, "%d-%m-%Y") as dates from tbl_student left join tbl_callhistory ON tbl_callhistory.student_id = tbl_student.id WHERE tbl_student.department_id = ${id}  ${search_query} 
            ORDER BY ${column_name} ${column_sort_order} 
            LIMIT ${start}, ${length}
            `;

                    var data_arr = [];

                    dataBase.query(query, function (error, data) {
                        data.forEach(function (row, index) {
                            data_arr.push({
                                '_ref': { student: row.id, parent: row.parentid },
                                'index': ++start,
                                'date': row.dates,
                                'student_name': row.studentname,
                                'parent_name': row.parentname,
                                'minutes': row.minutes
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
    }
};

module.exports = { getCallHistory };