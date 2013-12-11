#fh-health


Module to add a "health" endpoint to a nodeapp running on the FeedHenry platform. 

##Usage
The module should be initialised from your main.js file like so. This will clear any previously added test functions and setup a new endpoint in your application called "health" so ensure none of your endpoints are called health to avoid conflicts. 

```
var health = require('fh-health');
health.init(module.exports);
```

##Adding Tests
Adding tests is done via two functions. *addTest(description, testFn)* and *addCriticalTest(description, testFn)*. The *testFn* function is a function that must have the format:

```
function fnName(callback) {
	return callback(err, result);
}
```
Where err is a string/object explaining the error and result is a string/object explaining the test result if it passed.

Critical tests are those that result in the health endpoint returning a "critical" status if they pass an *err* argument to their callback. 

Standard tests added via *addTest* are tests that can return an error to their callback without causing a "critical" status, but instead cause a "warning" status.


##Simple Example

```
var request = require('request');
var health = require('fh-health');
health.init(module.exports);

health.addTest('Test http', function(callback){
	var request = require('request');
	request.get('http://www.google.com', function(err, res, body) {
		if (err) {
			return callback('Error in request to google.com: ' + JSON.stringify(err));
		} else if (res && res.statusCode != 200) {
			return callback('Google responded with status code of ' + res.statusCode);
		} else {
      		return callback(null, 'Successfully loaded google.com');
    	}
	});
});
```

This example if successful would return the following response:

```
{
    status: 'ok',
    summary: 'No issues to report. All tests passed without error',
    details: [{
        description: 'Test a request to www.google.com is successful',
        status: 'ok',
        result: 'Successfully loaded google.com',
    }]
}
```

##Usage Pattern
You probably won't want all tests in main.js, so a better pattern would be to initialise the module from main.js  and then include test cases in a separate module which is perfectly valid.

####main.js
```
var health = require('fh-health');
health.init(module.exports);
```

####myOtherModule.js
```
health.addTest('Test some functionality…', function(callback) {
	// Test code...
});
health.addCriticalTest('Test some critical functionality…', function(callback) {
	// Test code...
});
```