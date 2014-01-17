#fh-health


Module to add health checks to an application.

##Usage
If running within fh-nodeapp the module should be initialised from your main.js file as shown below. This will clear any previously added test functions and setup a new endpoint in your application called "health", so ensure none of your endpoints are called health to avoid conflicts. Alternatively you can just call *health.init()* and manage the endpoint yourself.

```
// With fh-nodeapp
var health = require('fh-health');
health.init(module.exports);

// Standard usage
var health = require('fh-health');
health.init();
```

##Adding Tests
Adding tests is done via two functions. *addTest(description, testFn)* and *addCriticalTest(description, testFn)*. The *testFn* function is a function that must have the format:

```
function fnName(callback) {
  // ...Do some stuff...
  // ...................
  if(anErrorOccured) {
    return callback('Oh crap!', null);
  } else {
    return callback(null, 'All good here!');
  }
}

health.addCriticalTest('MyCritTest', fnName);
```
Critical tests are those that result in the health endpoint returning a "crit" status if they pass a non null *err* argument (the first argument) to their callback. 

Standard tests added via *addTest* are tests that can return an error to their callback without causing a "crit" status, but instead cause a "warn" status.


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
        test_status: 'ok',
        result: 'Successfully loaded google.com',
    }]
}
```

##Usage Pattern
You can include test cases in separate modules which is perfectly valid, or alternatively have all tests in a single file. Just make sure you call *health.init()* prior to adding your tests, if you call it afterwards they will be ignored.

####index.js
```
var health = require('fh-health');
health.init();

var app = express();
app.get('/health', function(req, res) {
  health.runTests(function(err, data) {
    if(err) {
      res.status(500).end('An error occured.');
    } else {
      res.json(data);
    }
  });
});
```

####myOtherModule.js
```
var health = require('fh-health');

health.addTest('Test some functionality.', function(callback) {
	// Test code...
});
health.addCriticalTest('Test some critical functionality.', function(callback) {
	// Test code...
});
```

####myOtherOtherModule.js
```
var health = require('fh-health');

health.addTest('Just another test...', function(callback) {
  // Test code...
});
```