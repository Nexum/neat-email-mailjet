/**
 * Created by strohhecker on 25.01.2017.
 */
'use strict';
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const Application = require('neat-base').Application;
const Mailjet = require('node-mailjet');
const Promise = require("bluebird");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('Mail.send', function () {

    before(function () {


        // Init Application before tests
        // NOT in before() Block because init is still runnung when test starts
        Application.configure({
            // STAGE
            stage: "dev",
            stages: [
                "prod",
                "view",
                "dev"
            ],

            // PATHS
            root_path: __dirname,
            modules_path: __dirname + "/modules",
            config_path: __dirname + "/config",
            application_config_path: __dirname + "/config/application",

            // LOG LEVELS
            logLevelConsole: "debug",
            logLevelFile: "debug",
            logLevelRemote: "debug",
            logFormat: "DD.MM.YYYY hh:mm:ss",
            logDir: __dirname + "/logs"
        });

        Application.registerModule("mail", require('../index'));
        Application.run();

        /**
         * @type {EmailMailjet}
         */
        Application.modules.mail;
    });

    beforeEach(function () {
        this.sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should throw error for senders', function () {
        let mail = Application.modules.mail;

        expect(mail.sendMail.bind(mail, "blubb")).to.throw(Error, /no sender configured for blubb/i);
    });

    it('should throw error for recipients with null', function () {
        let mail = Application.modules.mail;

        expect(mail.sendMail.bind(mail, "default")).to.throw(Error, /recipients not set or empty/i);
    });

    it('should throw error for recipients with empty array', function () {
        let mail = Application.modules.mail;

        expect(mail.sendMail.bind(mail, "default", [])).to.throw(Error, /recipients not set or empty/i);
    });

    it('should throw error for recipients with empty email', function () {
        let mail = Application.modules.mail;

        expect(mail.sendMail.bind(mail, "default", [{name: "Testuserwith no mail"}])).to.throw(Error, /Recipient has no email set/i);
    });

    it('should throw error for recipients with one empty email', function () {
        let mail = Application.modules.mail;

        expect(mail.sendMail.bind(mail, "default", [
            {
                email: "test@test.com",
                name: "blubb"
            },
            {name: "Testuserwith no mail"}
        ])).to.throw(Error, /Recipient has no email set/i);
    });

    it('should throw error for missing template in config', function () {
        let mail = Application.modules.mail;

        expect(mail.sendMail.bind(mail, "default", [
            {
                email: "test@test.com",
                name: "blubb"
            }
        ], { template: "test"})
        ).to.throw(Error, /No template id configured for test/i);
    });

    it('should send email with minimal info', function () {
        const mail = Application.modules.mail;
        const requestSpy = {
            request: sinon.stub().returns(Promise.resolve())
        };
        const postStub = this.sandbox.stub(Mailjet.prototype, "post").returns(requestSpy);

        const prom = mail.sendMail("default", [
            {
                email: "test@test.com",
                name: "blubb"
            }
        ], {});
        const mailjetRequestData = {
            "FromEmail": "info@vonaffenfels.de",
            "FromName": "Test User",
            "Subject": "",
            "Text-part": "",
            "Html-part": "",
            "Vars": {},
            "Mj-TemplateID": "",
            "Recipients": [
                {
                    Email: "test@test.com",
                    Name: "blubb"
                }
            ]
        };

        expect(postStub).to.have.been.calledWith("send");
        expect(requestSpy.request).to.have.been.calledWith(mailjetRequestData);
    });

    it('should send email with complete data', function () {
        const mail = Application.modules.mail;
        const requestSpy = {
            request: sinon.stub().returns(Promise.resolve())
        };
        const postStub = this.sandbox.stub(Mailjet.prototype, "post").returns(requestSpy);

        const prom = mail.sendMail("default", [
            {
                email: "test@test.com",
                name: "blubb"
            }
        ], {
            template: "default",
            text: "Textpart",
            html: "htmlpart",
            data: {test: true},
            subject: "Betreff"
        });
        const mailjetRequestData = {
            "FromEmail": "info@vonaffenfels.de",
            "FromName": "Test User",
            "Subject": "Betreff",
            "Text-part": "Textpart",
            "Html-part": "htmlpart",
            "Mj-TemplateID": "54321",
            "Vars": {test: true},
            "Recipients": [
                {
                    Email: "test@test.com",
                    Name: "blubb"
                }
            ]
        };

        expect(postStub).to.have.been.calledWith("send");
        expect(requestSpy.request).to.have.been.calledWith(mailjetRequestData);
        expect(prom).to.eventually.have.been.fulfilled;
    });

    it('should call send email on register event', function () {
        const mail = Application.modules.mail;
        const postStub = this.sandbox.stub(mail, "sendMail").returns(Promise.resolve());

        Application.emit("user.register", {
            user: {
                email: "test@test.com",
                username: "Testuser"
            }
        });

        expect(postStub).to.have.been.calledWith("default", [ {
            email: "test@test.com",
            name: "Testuser"
        }], {
            template: "user.register",
            subject: "User Reg",
            data: {
                email: "test@test.com",
                name: "Testuser"
            }
        });
    });

    xit('should call send email on login event', function () {
        const mail = Application.modules.mail;
        const postStub = this.sandbox.stub(mail, "sendMail").returns(Promise.resolve());

        Application.emit("user.login", {
            user: {
                email: "test@test.com",
                username: "Testuser"
            }
        });

        expect(postStub).to.have.been.calledWith("default", [ {
            email: "test@test.com",
            name: "Testuser"
        }], {
            template: "user.login",
            subject: "User login",
            data: {
                email: "test@test.com",
                name: "Testuser"
            }
        });
    });

    it('should call send email on reset event', function () {
        const mail = Application.modules.mail;
        const postStub = this.sandbox.stub(mail, "sendMail").returns(Promise.resolve());

        Application.emit("user.reset", {
            user: {
                email: "test@test.com",
                username: "Testuser"
            }
        });

        expect(postStub).to.have.been.calledWith("default", [ {
            email: "test@test.com",
            name: "Testuser"
        }], {
            template: "user.reset",
            subject: "User reset",
            data: {
                email: "test@test.com",
                name: "Testuser"
            }
        });
    });

    it('should call send email on activated event', function () {
        const mail = Application.modules.mail;
        const postStub = this.sandbox.stub(mail, "sendMail").returns(Promise.resolve());

        Application.emit("user.activated", {
            user: {
                email: "test@test.com",
                username: "Testuser"
            }
        });

        expect(postStub).to.have.been.calledWith("default", [ {
            email: "test@test.com",
            name: "Testuser"
        }], {
            template: "user.activated",
            subject: "User Activated",
            data: {
                email: "test@test.com",
                name: "Testuser"
            }
        });
    });

});

