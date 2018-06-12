// Lighthouse Gateway sending data to the Karelia server

var tare = 0			// taaralukema sensorista 0 mm
var measuredValue = 0
var buttonPressed = 0		// taaratoiminto alussa

const ads1x15 = require('node-ads1x15')
const Gpio = require('onoff').Gpio
const led = new Gpio(14, 'out')
const button = new Gpio(15, 'in', 'falling') 	// react to the button press only
const fs = require('fs')
const chip = 1			// 1 for ads1115
const adc = new ads1x15(chip)
const log4js = require('log4js')
log4js.configure("./config/log4js.json")
const logger = log4js.getLogger()

// convert the analog reading to mm
// const K = - 560 / 8963
const K = -0.0629749747214557
const C = 101.74


// convert the analog reading to mm
function convertToMm( x ) {
	return K * x + C
}

var blinkInterval = setInterval( blinkLed, 1000 )

function blinkLed() {
	if (led.readSync() === 0) led.writeSync(1)
	else led.writeSync(0)
}
function endBlink() {
	clearInterval(blinkInterval)
	led.writeSync(0)
	led.unexport()
	button.unexport()
	process.exit(1)
}

var channel = 0
var samplesPerSecond = '250'
var progGainAmp = '4096'

// end everything after 30 seconds, wait for the tare button pressed
setTimeout(endBlink, 30000)

button.watch(function(err, value) {
	if (err) {
		logger.debug('error in button operation')
	}
	
	// read the tare value here, lue taaran arvo!
	if (!adc.busy) {
		adc.readADCSingleEnded(channel, progGainAmp, samplesPerSecond, function(err,data){
			data = convertToMm( data )
			logger.debug('write to tare.json file tare value ' + data)
			fs.writeFile('tare.json', JSON.stringify({"value" : data}), 'utf8', function(err) {
				if (err) logger.debug('error in writing file tare.json')
			})
		})
	}
	else logger.debug('tare sink sensor busy, unsucceeded in reading')
})


