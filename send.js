// Lighthouse Gateway sending data to the Karelia server

const dht11 = require('node-dht-sensor')
const ads1x15 = require('node-ads1x15')
const fs = require('fs')
const log4js = require('log4js')
log4js.configure("./config/log4js.json")
var logger = log4js.getLogger("lighthouse-appender")

 
const sinkurl = 'https://lighthouse-laitinenp.c9users.io/api/sensors/sink1'
const humiurl = 'https://lighthouse-laitinenp.c9users.io/api/sensors/humi1'
const tempurl = 'https://lighthouse-laitinenp.c9users.io/api/sensors/temp1'
 
var Client = require('node-rest-client').Client
 
var authoptions = {
        user : 'karelia',
        password : 'puurakentaminen'
}
 
var client = new Client(authoptions)
 
var args = {
        headers : { 'Content-Type' : 'application/json' },
        data : { 'value' : '1.23' },
        requestConfig : { timeout : 1500, keepAlive : false }
}
var tempargs = JSON.parse(JSON.stringify(args))
var humiargs = JSON.parse(JSON.stringify(args))
var sinkargs = JSON.parse(JSON.stringify(args))
 
// current sink sensor value
var measuredValue = 0

//const Gpio = require('onoff').Gpio
//const led = new Gpio(14, 'out')
//const button = new Gpio(15, 'in')
const chip = 1			// for ads1115
const adc = new ads1x15(chip)	// to ac converter

var channel = 0			// pin 0 in ads1115
var samplesPerSecond = '250'
var progGainAmp = '4096'

// convert the analog reading to mm
// const K = -560 / 8963
// laskettu excelilla linest-funktiolla mittauksista
const K = -0.0629749747214557
const C = 320


// convert the analog reading to mm
function convertToMm( x ) {
	return K * x + C
}

// read the tare.json, lue taara tiedostosta tare.json
function readTare() {
	var data = fs.readFileSync('tare.json', 'utf8')
	var obj = JSON.parse(data)
	var tare = obj.value
	return tare
}

function sendData (tare) {
                                                    // TODO tähän mittaus
	if (!adc.busy) {
		adc.readADCSingleEnded(channel, progGainAmp, samplesPerSecond, function(err,data){
			if (err) {
				throw err;
			}
			data = convertToMm( data )
			sinkargs.data.value = data - tare
        		logger.debug('measured sink value ' + sinkargs.data.value)
        		client.put( sinkurl, sinkargs, function(data, response) {
        		}).on('error', function(err) {
                		logger.debug('Error in HTTP PUT request to lighthouse server, data not saved to server.')
        		})
		})
	}
	
	dht11.read(11, 4, function( err, temperature, humidity ) {
		if (err) {
			logger.debug('error in reading the dht11(temp/humidity) sensor')
			return
		}
                                                   
                // mittadata tietueeseen
        	tempargs.data.value = temperature
        	logger.debug('temperature value ' + tempargs.data.value)
        	client.put( tempurl, tempargs, function(data, response) {
        	}).on('error', function(err) {
                	logger.debug('Error in HTTP PUT request, temperature value not sent')
        	})

        	humiargs.data.value = humidity
        	logger.debug('humidity value ' + humiargs.data.value)
        	client.put( humiurl, humiargs, function(data, response) {
        	}).on('error', function(err) {
                	logger.debug('Error in HTTP PUT request, humidity value not sent')
        	})
	})
}

// run the code
var tare = readTare()
sendData(tare)

