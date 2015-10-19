#fh-health

[![build-status](https://travis-ci.org/feedhenry-staff/fh-health.svg?branch=master)
](https://travis-ci.org/feedhenry-staff/fh-health.svg?branch=master)[![version](https://badge.fury.io/js/fh-health.svg)
](https://badge.fury.io/js/fh-health.svg)

Module to add health checks to an application. This is a health check to 
verify the running application (connectivity, etc.) is ok, and not a replacemnt 
for actual testing. The health check returns a JSON response formatted as shown 
below (using a single whitespace between key and values):

```json
{
    "status": "<ok|warn|crit>",
    "summary": "<something-meaningful-about-the-status>",
    "details": []
}
```

The "details" Array contains objects describing the results of each test which 
are formatted like so.

```json
{
  "description": "<The description provided to addTest or addCriticalTest function>",
  "test_status": "<ok|warn|crit>",
  "result": "<The result returned from your callback to either the err or result paramater>",
  "runtime": "<Time taken in milliseconds to run the test item>"
}
```


##Usage
If running within fh-nodeapp the module should be initialised from your main.js 
file as shown below. This will setup a new endpoint in your application called 
"health", so ensure none of your endpoints are called health to avoid 
conflicts. Alternatively you can just call *health.init()* and manage the 
endpoint yourself.

```javascript
// With fh-nodeapp
var health = require('fh-health');
// This will add a health endpoint automatically.
health.init(module.exports);

// Standard usage with an express app
var health = require('fh-health');
health.init();
app.get('/health', function(req, res) {
  health.runTests(function(err, testResult) {
    res.end(testResult);
  });
});
```

##Adding Tests
Adding tests is done via two functions. *addTest(description, testFn)* and 
*addCriticalTest(description, testFn)*. The *testFn* function is a function 
that must have the format:

```javascript
function testFn(callback) {
  // ...Do some stuff...
  // ...................
  if(anErrorOccurred) {
    return callback('Oh crap!', null);
  } else {
    return callback(null, 'All good here!');
  }
}

health.addCriticalTest('Test something important', testFn);
```

###Critical Tests - *addCriticalTest(name, fn)*
Are those that result in the health endpoint returning a "crit" status if they 
pass a non null *err* argument (the first argument) to their callback. If a 
critical test has no issues then they have a status of "ok".

### Standard Tests - *addTest(name, fn)*
Added via *addTest* are tests that can return an error to their callback 
without causing a "crit" status, but will instead cause a "warn" status.


##Simple Example

```javascript
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

```javascript
{
    status: 'ok',
    summary: 'No issues to report. All tests passed without error',
    details: [{
        description: 'Test a request to www.google.com is successful',
        test_status: 'ok',
        result: 'Successfully loaded google.com',
        runtime: 2106
    }]
}
```

If this example encountered a status code that wasn't *200* the following would 
be returned:


```javascript
{
    status: 'warn',
    summary: 'Some non-critical tests encountered issues. See the "details" 
    object for specifics.',
    details: [{
        description: 'Test a request to www.google.com is successful',
        test_status: 'warn',
        result: 'Google responded with a status code of {CODE}',
        runtime: 2341
    }]
}
```

##Timeouts
The default timeout for running tests is 25 seconds. After 25 seconds the test 
runner will ignore results returned from any unfinished tests.

The timeout can be modified like so:

```javascript
// Set the max running time to 60 seconds
var health = require('fh-health');
health.setMaxRuntime( (60*1000) );
```

If a timeout occurs on a critical test then the overall status returned will 
be "crit". If a timeout occurs on a regular test then a status of "warn" will 
be returned.

```json
{
  "status": "warn",
  "summary": "Some non-critical tests encountered issues. See the 'details' object for specifics.",
  "details": [
    {
      "description": "Check connectivity to component XYZ.",
      "test_status": "warn",
      "result": "The test didn't complete before the alotted time frame.",
      "runtime": 25000
    }
  ]
}
```

##Usage Pattern
You can include test cases in separate modules which is perfectly valid, or 
alternatively have all tests in a single file.

####index.js

```javascript
var health = require('fh-health');
health.init();

var app = express();
app.get('/health', function(req, res) {
  health.runTests(function(err, data) {
    if(err) {
      res.status(500).end('An error occurred.');
    } else {
      res.json(data);
    }
  });
});
```

####myOtherModule.js
```javascript
var health = require('fh-health');

health.addTest('Test some functionality.', function(callback) {
	// Test code...
});
health.addCriticalTest('Test some critical functionality.', function(callback) {
	// Test code...
});
```

####myOtherOtherModule.js
```javascript
var health = require('fh-health');

health.addTest('Just another test...', function(callback) {
  // Test code...
});
```
