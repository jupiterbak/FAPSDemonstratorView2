/*#####################################################################################*/
/* General options	
/*#####################################################################################*/
const uuidv = require('uuid/v1');
var http = require('http');
var express = require('express'),
    app = module.exports.app = express();
var bodyParser = require("body-parser");
var webserver = http.createServer(app);
var io = require('socket.io').listen(webserver);
var amqp = require('amqplib/callback_api');
var amqp_connection = null;
var amqp_ch = null;

const fs = require('fs');
port = process.env.PORT || 8090;

const winston = require('winston');
const logger = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        winston.format.splat(),
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.colorize({ all: true }),
        winston.format.printf((log) => {
            return `${log.timestamp} - [${log.level}] | [${log.service}] : ${log.message}`;
        })
    ),
    defaultMeta: { service: 'FAPS SCREEN' },
});

/*#####################################################################################*/
/* Socket IO
/*#####################################################################################*/

//SocketIO handler
io.on('connection', function(socket) {
    logger.info("Socket IO Connection");
    socket.on('disconnect', function() {
        logger.info("Socket IO Disconnection");
    });
});

/*#####################################################################################*/
/* Energy data
/*#####################################################################################*/
var energy_data = [],
    totalPoints = 144;
var list_axis_1 = [],
    list_axis_2 = [],
    list_axis_3 = [];

var last_conveyor_data = {};

function msToTimeLast10Minutes(s) {
    var time_last_10_mins = s - (s % (10 * 60 * 1000));
    var _d = new Date(time_last_10_mins);

    return _d.toISOString();
}

function addData(_new_data) {
    // Do a random walk
    if (energy_data.length == 0) {
        var t_ms_now = Date.now() - (10 * 60 * 1000);
        while (energy_data.length < totalPoints) {
            var axis_1 = Math.floor(80 + (Math.random() * 10)),
                axis_2 = Math.floor(20 + (Math.random() * 30)),
                axis_3 = Math.floor(130 + (Math.random() * 10)),
                components = Math.floor(5 + (Math.random() * 10)),
                conveyor = Math.floor(20 + (Math.random() * 30));
            energy_data.push({
                '_id': uuidv(),
                '_v': 0,
                'ts': msToTimeLast10Minutes(t_ms_now),
                'axis_1': axis_1,
                'axis_2': axis_2,
                'axis_3': axis_3,
                'components': components,
                'conveyor': conveyor,
                'dem': axis_1 + axis_2 + axis_3 + conveyor + components
            });
            t_ms_now = t_ms_now - (10 * 60 * 1000);
        }
    }

    if (energy_data.length == totalPoints) {
        energy_data.pop();
    }
    energy_data.unshift(_new_data);

    // Zip the generated y values with the x values
    var res = [];
    for (var i = 0; i < energy_data.length; ++i) {
        res.push(energy_data[i]);
    }
    return res;
}


/*#####################################################################################*/
/* AMQP CLIENT
/*#####################################################################################*/
// connect to brocker
amqp.connect("amqp://esys:esys@cloud.faps.uni-erlangen.de", function(err, conn) {
    if (err != null) {
        logger.error('AMQP Connection Error: ' + err.toString());
        return;
    }
    amqp_connection = conn;

    amqp_connection.on('error', function(err) {
        logger.error("AMQP Generated event 'error': " + err);
    });

    amqp_connection.on('close', function() {
        logger.info("AMQP Connection closed.");
        process.exit();
    });

    amqp_connection.createChannel(function(err, ch) {
        if (err != null) {
            logger.error('AMQP Chanel Error: ' + error.toString());
            return;
        }

        amqp_ch = ch;
        amqp_ch.assertExchange("FAPS_DEMONSTRATOR_ImageProcessing_ProcessingResults_Debug", 'fanout', { durable: false });
        amqp_ch.assertExchange("FAPS_DEMONSTRATOR_ImageProcessing_ProcessingSignals", 'fanout', { durable: false });
        amqp_ch.assertExchange("FAPS_DEMONSTRATOR_LiveStreamData_MachineData", 'fanout', { durable: false });
        // test client
        amqp_ch.assertQueue('FAPS_DEMONSTRATOR_LiveStreamData_MachineData_VisQueue', { exclusive: true }, function(err, q) {
            if (err) {
                logger.error('AMQP Queue Assertion Error: ' + err.toString());
            } else {
                logger.info(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
                ch.bindQueue(q.queue, "FAPS_DEMONSTRATOR_LiveStreamData_MachineData", '');

                // generate random energy value
                var last_fetch = 0;

                ch.consume(q.queue, function(msg) {
                    //console.log(" [x] %s", msg.content.toString());
                    _obj = JSON.parse(msg.content.toString());

                    list_axis_1.push(Math.abs(_obj.value.data.Portal_Wirkleistung_L1));
                    list_axis_2.push(Math.abs(_obj.value.data.Portal_Wirkleistung_L2));
                    list_axis_3.push(Math.abs(_obj.value.data.Portal_Wirkleistung_L3));


                    if (Date.now() - last_fetch >= (10 * 60 * 1000)) {
                        const res_1 = list_axis_1.reduce((total, currentValue) => {
                            return total + currentValue;
                        });
                        const res_2 = list_axis_2.reduce((total, currentValue) => {
                            return total + currentValue;
                        });
                        const res_3 = list_axis_3.reduce((total, currentValue) => {
                            return total + currentValue;
                        });

                        var axis_1 = res_1 / list_axis_1.length,
                            axis_2 = res_2 / list_axis_2.length,
                            axis_3 = res_3 / list_axis_3.length,
                            components = Math.floor(5 + (Math.random() * 10)),
                            conveyor = Math.floor(20 + (Math.random() * 30));
                        energy_data = addData({
                            '_id': uuidv(),
                            'ts': msToTimeLast10Minutes(Date.now()),
                            '_v': 0,
                            'axis_1': axis_1,
                            'axis_2': axis_2,
                            'axis_3': axis_3,
                            'components': components,
                            'conveyor': conveyor,
                            'dem': axis_1 + axis_2 + axis_3 + conveyor + components
                        });
                        list_axis_1 = [];
                        list_axis_2 = [];
                        list_axis_3 = [];
                        last_fetch = Date.now();
                    }
                    io.emit('AMQPMachineData', msg.content.toString());

                }, { noAck: true });
            }
        });
        // Images
        amqp_ch.assertQueue('FAPS_DEMONSTRATOR_ImageProcessing_ProcessingResults_Debug_Visualisation', { exclusive: false, durable: false, autoDelete: true }, function(err, q) {
            if (err) {
                logger.error('AMQP Queue Assertion Error: ' + err.toString());
            } else {
                logger.info(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
                ch.bindQueue(q.queue, "FAPS_DEMONSTRATOR_ImageProcessing_ProcessingResults_Debug", '');

                ch.consume(q.queue, function(msg) {
                    data = JSON.parse(msg.content.toString());
                    var _object = data["object"];
                    let buff = Buffer.from(data["picture"], 'hex');
                    fs.writeFileSync('public/processed_images/' + _object + '.png', buff);
                    var data = {
                        "object": _object,
                        "url": '/processed_images/' + _object + '.png'
                    };
                    io.emit('new_image_processed', data);
                }, { noAck: true });
            }
        });

        // Image Signals
        amqp_ch.assertQueue('FAPS_DEMONSTRATOR_ImageProcessing_ProcessingSignals_Visualisation2', { exclusive: false, durable: false, autoDelete: true }, function(err, q) {
            if (err) {
                logger.error('AMQP Queue Assertion Error: ' + err.toString());
            } else {
                logger.info(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
                ch.bindQueue(q.queue, "FAPS_DEMONSTRATOR_ImageProcessing_ProcessingSignals", '');

                ch.consume(q.queue, function(msg) {
                    var _data = JSON.parse(msg.content.toString());

                    var _object = _data["object"];
                    var data = {
                        "object": _object,
                        "url": 'https://via.placeholder.com/1024x768/000/fff&text=Processing'
                    };
                    io.emit('new_image_processed', data);
                    io.emit('new_order', _data);
                }, { noAck: true });
            }
        });

        // Conveyor data
        amqp_ch.assertQueue('FAPS_DEMONSTRATOR_LiveStreamData_ConveyorData_Visualisation', { exclusive: false, durable: false, autoDelete: true }, function(err, q) {
            if (err) {
                logger.error('AMQP Queue Assertion Error: ' + err.toString());
            } else {
                logger.info(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
                ch.bindQueue(q.queue, "FAPS_DEMONSTRATOR_LiveStreamData_ConveyorData", '');
                ch.consume(q.queue, function(msg) {
                    // Save the data
                    last_conveyor_data = JSON.parse(msg.content.toString());
                }, { noAck: true });
            }
        });
    });
});

/*#####################################################################################*/
/*WEB Server		
/*#####################################################################################*/
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// main application
app.get('/', function(req, res) {
    res.sendfile('public/');
});

app.get('/getAggergatedEnergyData', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(energy_data));
});

webserver.listen(port, function() {
    logger.info('SCREEN app listening on port: ' + port);
});

process.on('uncaughtException', function(err) {
    logger.error('SCREEN app Uncaught Exception:' + err.stack);
    logger.error('SCREEN app server is on exit with code: ' + 1);
    webserver.close();
    process.exit(1);
});

// Stop the platform if the user request it
process.on('SIGINT', function() {
    logger.error('SCREEN app is on exit with code: ' + 0);
    webserver.close();
    process.exit(0);
});

process.on('exit', (code) => {
    logger.error('SCREEN app is on exit with code: ' + code);
    webserver.close();
    process.exit(0);
});