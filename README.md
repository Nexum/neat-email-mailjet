# neat-email-mailjet

Registers events on the neat-application for
* user.reset
* user.register
* user.activated

and sends emails for them with [Mailjet](www.mailjet.com).

There is also an [API documentation](https://dev.mailjet.com/guides/?javascript#sending-a-basic-email)



## Unit Tests

To run the tests, use 
1. `npm install mocha -g`
2. `npm install`
3. `npm test`

### Used test libraries

* http://mochajs.org/
* http://chaijs.com/api/bdd/
* https://github.com/domenic/chai-as-promised
* https://github.com/domenic/sinon-chai