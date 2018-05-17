// Lighthouse Gateway sending data to the Karelia server

const dht11 = require('node-dht-sensor')
const fs = require('fs')
const log4js = require('log4js')
log4js.configure("./config/log4js.json")
var logger = log4js.getLogger()
 
const humiurl = 'http://lighthouse-laitinenp.c9users.io/api/sensors/humi1'
const tempurl = 'http://lighthouse-laitinenp.c9users.io/api/sensors/temp1'
 
const Client = require('node-rest-client').Client
 
const authoptions = JSON.parse(fs.readFileSync('credentials.json', 'utf8'))
 
var client = new Client(authoptions)
 
var args = {
        headers : { 'Content-Type' : 'application/json' },
        data : { 'value' : '1.23' },
        requestConfig : { timeout : 1500, keepAlive : false }
}
var tempargs = JSON.parse(JSON.stringify(args))
var humiargs = JSON.parse(JSON.stringify(args))
 
// current sink sensor value
var measuredValue = 0

function sendData () {

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
sendData()

