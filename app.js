/*#####################################################################################*/
/* General options	
/*#####################################################################################*/
var http = require('http');
const request = require('request');
var express = require('express'),
	app = module.exports.app = express();
var bodyParser     =        require("body-parser");
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
io.on('connection', function (socket) {
	logger.info("Socket IO Connection");
	socket.on('disconnect', function(){
		logger.info("Socket IO Disconnection");
	});
});


/*#####################################################################################*/
/* AMQP CLIENT
/*#####################################################################################*/
// connect to brocker
amqp.connect("amqp://esys:esys@cloud.faps.uni-erlangen.de",function(err, conn) {
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
        amqp_ch.assertExchange("FAPS_DEMONSTRATOR_ImageProcessing_ProcessingResults_Debug", 'fanout', {durable: false});
        amqp_ch.assertExchange("FAPS_DEMONSTRATOR_ImageProcessing_ProcessingSignals", 'fanout', {durable: false});
        amqp_ch.assertExchange("FAPS_DEMONSTRATOR_LiveStreamData_MachineData", 'fanout', {durable: false});
        // test client
        amqp_ch.assertQueue('FAPS_DEMONSTRATOR_LiveStreamData_MachineData_VisQueue', {exclusive: true}, function(err, q) {
            if (err){
                logger.error('AMQP Queue Assertion Error: ' + err.toString());
            }else{
                //console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
                ch.bindQueue(q.queue, "FAPS_DEMONSTRATOR_LiveStreamData_MachineData", '');

                ch.consume(q.queue, function(msg) {
                    //console.log(" [x] %s", msg.content.toString());
                    io.emit('AMQPMachineData', msg.content.toString());
                }, {noAck: true});
            }
        });
        // Images
        amqp_ch.assertQueue('FAPS_DEMONSTRATOR_ImageProcessing_ProcessingResults_Debug_Visualisation', {exclusive: false, durable: false, autoDelete:true}, function(err, q) {
            if (err){
                logger.error('AMQP Queue Assertion Error: ' + err.toString());
            }else{
                logger.info("AMQP: Waiting for messages in " + q.queue + ". To exit press CTRL+C");
                ch.bindQueue(q.queue, "FAPS_DEMONSTRATOR_ImageProcessing_ProcessingResults_Debug", '');
    
                ch.consume(q.queue, function(msg) {                    
                    data = JSON.parse(msg.content.toString());
                    var _object = data["object"];
                    let buff = Buffer.from(data["picture"], 'hex');
                    fs.writeFileSync('public/processed_images/' +  _object+ '.png', buff);
                    var data = {
                        "object":_object,
                        "url":'/processed_images/' +  _object+ '.png'
                    };
                    io.emit('new_image_processed', data);
                 }, {noAck: true});
            }            
        });

        // Image Signals
        amqp_ch.assertQueue('FAPS_DEMONSTRATOR_ImageProcessing_ProcessingSignals_Visualisation2', {exclusive: false, durable: false, autoDelete:true}, function(err, q) {
            if (err){
                logger.error('AMQP Queue Assertion Error: ' + err.toString());
            }else{
                logger.info("AMQP: Waiting for messages in " + q.queue + ". To exit press CTRL+C");
                ch.bindQueue(q.queue, "FAPS_DEMONSTRATOR_ImageProcessing_ProcessingSignals", '');
                    
                ch.consume(q.queue, function(msg) {
                    var _data = JSON.parse(msg.content.toString());
                    var _object = _data["object"];
                    var data = {
                        "object":_object,
                        "url":'https://via.placeholder.com/1024x768/000/fff&text=Processing'
                    };
                    io.emit('new_image_processed', data);
                    io.emit('new_order', _data);
                 }, {noAck: true});
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
app.get('/', function (req, res) {
  res.sendfile('public/');
});

webserver.listen(port, function () {
    logger.info('SCREEN app listening on port: ' + port);
});

// // Set time out to get the current order list
// setInterval(function() {
//     request('http://cloud.faps.uni-erlangen.de:3000/orders', { json: true }, (err, res, body) => {
//         if (err) {
//             logger.error('SCREEN app error fetching order list:' + err.stack);
//         }else{
//             //logger.info('SCREEN app update new order list.');
//             io.emit('order_list', body);
//         }        
//     });
// }, 10000);


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

