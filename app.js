const express = require('express');
const mysql = require('mysql');
const excel = require("exceljs");
const app = express();

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const connection = mysql.createConnection({
    user: 'sql12395844',
    host: 'sql12.freesqldatabase.com',
    database: 'sql12395844',
    password: 'pd7qx4vWmp',
    port: 3306,
});

connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('connected as id ' + connection.threadId);
});

// const pool = new Client({
//     user: 'sql12395844',
//     host: 'sql12.freesqldatabase.com',
//     database: 'sql12395844',
//     password: 'pd7qx4vWmp',
//     port: 3306,
// })

// pool.connect()
//     .then(val => {
//         console.log(`connected to db`)
//     })

app.get('/', (req, res) => {
    res.render('index', { data: [] });
})

app.post('/saveReport', async (req, res) => {
    console.log(req.body);
    const query = req.body.query;
    const title = req.body.title;

    if (!query && !title) {
        res.status(400).json({ err: 'please enter query and title' });
        return;
    }

    connection.query(query, (error, results, fields) => {
        connection.query(`INSERT INTO reports(title, query) VALUES(?, ?)`, [title, query], (rError, rResults, rFields) => {
            console.log("######", rError, rResults, rFields)
            res.redirect(`queryResult/${rResults.insertId}`);
        });
    })

    // const data = [
    //     { emp_id: 1, emp_name: 'Shivam', desig: 'Engineer', basic_pay: 500000 },
    //     { emp_id: 2, emp_name: 'Shivam', desig: 'Engineer', basic_pay: 500000 },
    //     { emp_id: 3, emp_name: 'Shivam', desig: 'Engineer', basic_pay: 500000 },
    //     { emp_id: 4, emp_name: 'Shivam', desig: 'Engineer', basic_pay: 500000 },
    //     { emp_id: 5, emp_name: 'Shivam', desig: 'Engineer', basic_pay: 500000 }
    // ];

    // res.render('index', { data: data });

})

app.get('/reports', (req, res) => {
    connection.query('SELECT * FROM reports', (error, results, fields) => {
        console.log(error, results, fields)
        res.render('reportList', { data: results });
    })
})

app.get('/queryResult/:id', (req, res) => {
    connection.query('SELECT * FROM reports WHERE id = ?', [req.params.id], (error, results, fields) => {
        console.log("@@@@@@", results[0])
        if (results && results.length > 0) {
            let query = results[0].query;
            connection.query(query, (rError, rResults, rFields) => {
                res.render('queryResult', { data: rResults, id: req.params.id });
            })
        }
        else {
            res.render('queryResult', { data: [] });
        }
    })
})

app.get('/downloadReport/:id', (req, res) => {
    connection.query('SELECT * FROM reports WHERE id = ?', [req.params.id], (error, results, fields) => {
        console.log("@@@@@@", results[0])
        if (results && results.length > 0) {
            let query = results[0].query;
            connection.query(query, (rError, rResults, rFields) => {
                //res.render('queryResult', { data: rResults });
                let workbook = new excel.Workbook();
                let worksheet = workbook.addWorksheet("report");

                worksheet.columns = [
                    { header: "Id", key: "id", width: 5 },
                    { header: "Name", key: "emp_name", width: 25 },
                    { header: "Designation", key: "desig", width: 25 },
                    { header: "Basic Pay", key: "basic_pay", width: 10 },
                ];

                // Add Array Rows
                worksheet.addRows(rResults);

                // res is a Stream object
                res.setHeader(
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
                res.setHeader(
                    "Content-Disposition",
                    "attachment; filename=" + "report.xlsx"
                );

                return workbook.xlsx.write(res).then(function () {
                    res.status(200).end();
                });
            })
        }
    })
})

app.get('/createTables', (req, res) => {
    const query = `CREATE TABLE reports(
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(256) NOT NULL,
                    query VARCHAR(512) NOT NULL );`;

    const queryToEMP = `CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        emp_name VARCHAR(256) NOT NULL,
        desig VARCHAR(256) NOT NULL,
        basic_pay INT NOT NULL);`;

    connection.query(query);
    connection.query(queryToEMP);
})

app.get('/api/getData', async (req, res) => {
    connection.query('SELECT * FROM employees', (error, results, fields) => {
        console.log(error, results, fields)
        res.json(results);
    })
})

app.get('/api/addData', async (req, res) => {
    connection.query('INSERT INTO employees(emp_name, desig, basic_pay) VALUES("Trigun", "CEO", 5000000)', (error, results, fields) => {
        console.log(error, results, fields)
        res.json(results);
    })
})

app.get('/api/getReports', async (req, res) => {
    connection.query('SELECT * FROM reports', (error, results, fields) => {
        console.log(error, results, fields)
        res.json(results);
    })
})


const port = process.env.PORT || 5667;

app.listen(port, () => {
    console.log(`listening at port ${port}`);
})