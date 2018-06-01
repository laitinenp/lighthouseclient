// Lighthouse Gateway sending data to the Karelia server

const ads1x15 = require('node-ads1x15')
const Gpio = require('onoff').Gpio
const led = new Gpio(14, 'out')
const fs = require('fs')
const log4js = require('log4js')
log4js.configure("./config/log4js.json")
var logger = log4js.getLogger()
 
const sinkurl = 'https://lighthouse-laitinenp.c9users.io/api/sensors/sink1'
 
const authoptions = JSON.parse(fs.readFileSync('credentials.json', 'utf8'))

const Client = require('node-rest-client').Client;

var client = new Client(authoptions)
 
var args = {
        headers : { 'Content-Type' : 'application/json' },
        data : { 'value' : '1.23' },
        requestConfig : { timeout : 1500, keepAlive : false }
}
var sinkargs = JSON.parse(JSON.stringify(args))
 
// current sink sensor value
var measuredValue = 0

const chip = 1			// for ads1115
const adc = new ads1x15(chip)	// to ac converter

var channel = 0			// pin 0 in ads1115
var samplesPerSecond = '250'
var progGainAmp = '4096'

// convert the analog reading to mm
// const K = -560 / 8963
// laskettu excelilla linest-funktiolla mittauksista
const K = -0.0629749747214557
const C = 101.74


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

function blinkLed() {
        if (led.readSync() === 0) led.writeSync(1)
        else led.writeSync(0)
}
function endBlink() {
        clearInterval(blinkInterval)
        led.writeSync(0)
        led.unexport()
}
var blinkInterval = setInterval( blinkLed, 200 )

function sendData (tare) {
                                                    // TODO tähän mittaus
	if (!adc.busy) {
		adc.readADCSingleEnded(channel, progGainAmp, samplesPerSecond, function(err,data){
			if (err) {
				setTimeout(endBlink, 30000)			
				throw err;
			}
			data = convertToMm( data )
			sinkargs.data.value = data - tare
        		logger.debug('measured sink value ' + sinkargs.data.value)
        		client.put( sinkurl, sinkargs, function(data, response) {
				setTimeout(endBlink, 500)			
        		}).on('error', function(err) {
				setTimeout(endBlink, 30000)			
                		logger.debug('Error in HTTP PUT request to lighthouse server, data not saved to server.')
        		})
		})
	}
}

// run the code
var tare = readTare()
sendData(tare)

