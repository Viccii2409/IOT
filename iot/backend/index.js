var cors = require('cors'),
    express = require('express'),
    app = express(),
    server = require('http').createServer(app)

var bodyParser = require('body-parser');
var mqtt = require('mqtt')
var mysql = require('mysql2');
var moment = require('moment');
app.use(cors())
app.use(bodyParser.json());

var port = '5678'
server.listen(port, function () {
    console.log('Server listening on port ' + port)
})

// ------------------ Initialize------------------ 
// Kết nối CSDL
var con = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "123456",
    database: "iot"
});
con.connect((err) => {
    if (err) throw err;
    console.log("Connected!");

    // Tạo các bảng trong CSDL
    var sql1 =
        `CREATE TABLE IF NOT EXISTS sensors(
            id int(10) not null primary key auto_increment, 
            time datetime not null, 
            temperature float not null, 
            humidity float not null, 
            light float not null)`
    con.query(sql1, (err) => {
        if (err) throw err;
    });
    var sql2 =
        `CREATE TABLE IF NOT EXISTS actions(
            id int(10) not null primary key auto_increment, 
            time datetime not null, 
            name text not null,
            action text not null)`
    con.query(sql2, (err) => {
        if (err) throw err;
    });
});

// ------------------ Api------------------ 
// Lấy 10 giá trị CẢM BIẾN gần nhất
app.get('/api/lastest_sensors', function (req, res) {
    var num = 0
    var sql1 = `SELECT COUNT(id) AS NumberOfSensors FROM sensors`
    con.query(sql1, function (err, result) {
        if (err) throw err;
        num = result[0].NumberOfSensors

        num = num >= 10 ? num - 10 : num
        var sql = `SELECT * FROM sensors LIMIT ${num}, 10`
        con.query(sql, function (err, result) {
            if (err) throw err;
            res.json(result)
        });
    });
})

// Lấy tổng số trang của CẢM BIẾN
// Mỗi trang 20 giá trị, nên có 200 giá trị thì có 200/20 = 10 trang
app.get('/api/total_pages_sensors', function (req, res) {
    var params = req.query
    var varPerPage = 20
    if (Object.keys(req.query).length === 0) {
        var num = 0
        var sql1 = `SELECT COUNT(id) AS NumberOfSensors FROM sensors`
        con.query(sql1, function (err, result) {
            if (err) throw err;
            num = result[0].NumberOfSensors

            res.json(num === 0 ? 0 : Math.round(num/varPerPage) - 1)
        });
    } else if (params.date_from && params.date_to) {
        var datetime_from = moment(params.date_from).format('yyyy-MM-DD')
        var datetime_to = moment(params.date_to).format('yyyy-MM-DD')

        var sql = `SELECT COUNT(id) AS NumberOfSensors FROM sensors
            where time between '${datetime_from}' and '${datetime_to}'`

        con.query(sql, function (err, result) {
            if (err) throw err;
            num = result[0].NumberOfSensors

            res.json(num === 0 ? 0 : Math.round(num/varPerPage) - 1)
        });
    } else {
        res.json(1)
    }
})

// Lấy danh sách giá trị CẢM BIẾN (theo trang, theo khoảng thời gian)
app.get('/api/list_sensors', function (req, res) {
    var params = req.query
    var varPerPage = 20
    var varSort = (params.sorted == 1 ? 'desc' : 'asc')
    if (Object.keys(req.query).length <= 2) {
        var sql = `SELECT * FROM sensors 
            order by time ${varSort}
            limit ${params.page ? varPerPage * (params.page) : 0}, ${varPerPage};`

        con.query(sql, function (err, result) {
            if (err) throw err;
            res.json(result)
        });
    } else if (params.date_from && params.date_to) {
        var datetime_from = moment(params.date_from).format('yyyy-MM-DD')
        var datetime_to = moment(params.date_to).format('yyyy-MM-DD') 

        var sql = `SELECT * FROM sensors 
            where time between '${datetime_from}' and '${datetime_to}'
            order by time ${varSort}
            limit ${params.page ? varPerPage * (params.page) : 0}, ${varPerPage};`

        con.query(sql, function (err, result) {
            if (err) throw err;
            res.json(result)
        });
    } else {
        res.json(1)
    }
})

// Lấy tổng số trang của HÀNH ĐỘNG BẤM NÚT
app.get('/api/total_pages_actions', function (req, res) {
    var params = req.query
    var varPerPage = 10
    if (Object.keys(req.query).length === 0) {
        var num = 0
        var sql1 = `SELECT COUNT(id) AS NumberOfActions FROM actions`
        con.query(sql1, function (err, result) {
            if (err) throw err;
            num = result[0].NumberOfActions

            res.json(num === 0 ? 0 : Math.round(num/varPerPage) - 1)
        });
    } else if (params.date_from && params.date_to) {
        var datetime_from = moment(params.date_from).format('yyyy-MM-DD')
        var datetime_to = moment(params.date_to).format('yyyy-MM-DD')

        var sql = `SELECT COUNT(id) AS NumberOfActions FROM actions
            where time between '${datetime_from}' and '${datetime_to}'`

        con.query(sql, function (err, result) {
            if (err) throw err;
            num = result[0].NumberOfActions

            res.json(num === 0 ? 0 : Math.round(num/varPerPage) - 1)
        });
    } else {
        res.json(1)
    }
})

// Lấy danh sách giá trị HÀNH ĐỘNG BẤM NÚT (theo trang, theo khoảng thời gian)
app.get('/api/list_actions', function (req, res) {
    var params = req.query
    var varPerPage = 10
    var varSort = (params.sorted == 1 ? 'desc' : 'asc')
    if (Object.keys(req.query).length <= 2) {
        var sql = `SELECT * FROM actions 
            order by time ${varSort}
            limit ${params.page ? varPerPage * (params.page) : 0}, ${varPerPage};`

        con.query(sql, function (err, result) {
            if (err) throw err;
            res.json(result)
        });
    } else if (params.date_from && params.date_to) {
        var datetime_from = moment(params.date_from).format('yyyy-MM-DD')
        var datetime_to = moment(params.date_to).format('yyyy-MM-DD')

        var sql = `SELECT * FROM actions 
            where time between '${datetime_from}' and '${datetime_to}'
            order by time ${varSort}
            limit ${params.page ? varPerPage * (params.page) : 0}, ${varPerPage};`

        con.query(sql, function (err, result) {
            if (err) throw err;
            res.json(result)
        });
    } else {

    }
})

// Lấy số lượng bật, tắt của Hành động bấm nút
app.get('/api/on_off_actions', function (req, res) {
    var name = req.query.name
    var sql = `SELECT 
                    SUM(CASE WHEN action = 'on' THEN 1 ELSE 0 END) as on_action,
                    SUM(CASE WHEN action = 'off' THEN 1 ELSE 0 END) as off_action
                FROM actions
                WHERE name = '${name}';`

    con.query(sql, function (err, result) {
        if (err) throw err;
        res.json(result[0])
    });
})

// ------------------ MQTT------------------ 
const client = mqtt.connect('mqtt://localhost:1883');

// Kết nối MQTT
client.on('connect', () => {
    console.log('MQTT connected');
});
client.on('error', (error) => {
    // console.log(error);
});

// Xử lý message nhận được khi subcribe 1 topic
client.on('message', (topic, message) => {
    // Message nhần được từ MQTT
    var rawMess = message.toString()
    try {
        // Chuyển tin nhắn nhận được sang JSON
        var jsonData = JSON.parse(rawMess)
        if (jsonData.temperature != "nan" && jsonData.humidity != "nan" && jsonData.light != "nan") {
            // Lưu các giá trị CẢM BIẾN vào CSDL
            var sql =
                `INSERT INTO 
                sensors (time, temperature, humidity, light) 
                VALUES 
                ("${getStringDateTime()}", "${jsonData.temperature}", "${jsonData.humidity}", "${jsonData.light}")`
            con.query(sql, function (err, result) {
                if (err) throw err;
            });
        }
    } catch (error) {
        console.log('1 of them is nan')
    }
});
// Subscribe topic 'esp/sensor' để lấy giá trị CẢM BIẾN
client.subscribe('esp/sensor');

// Lưu HÀNH ĐỘNG BẤM NÚT vào CSDL
app.post('/api/action/save', function (req, res) {
    myAction = req.body;
    client.publish(`esp/${myAction.name.toLowerCase()}`, myAction.action);
    var sql =
        `INSERT INTO 
        actions (time, name, action) 
        VALUES 
        ("${getStringDateTime()}", "${myAction.name}", "${myAction.action}")`
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.json({message: 'Ok'});
    });
})

// Lấy datetime format theo dạng MySQL
function getStringDateTime() {
    var n = new Date();
    var month = n.getMonth() + 1;
    var result = n.getFullYear() + "-" + month + "-" + n.getDate() + " " + n.getHours() + ":" + n.getMinutes() + ":" + n.getSeconds();
    return result;
}