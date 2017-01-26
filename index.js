"use strict";

const Application = require("neat-base").Application;
const Module = require("neat-base").Module;
const Tools = require("neat-base").Tools;
const Promise = require("bluebird");
const Mailjet = require('node-mailjet');

module.exports = class EmailMailjet extends Module {

    static defaultConfig() {
        return {
            key: "",
            secret: "",
            locale: "de_DE",
            senders: {
                default: {
                    email: "",
                    name: ""
                }
            },
            subjects: {
                default: ""
            }
        }
    }

    init() {
        return new Promise((resolve, reject) => {
            this.log.debug("Initializing...");
            this.EVENT_USER_LOGIN = "user.login";
            this.EVENT_USER_ACTIVATED = "user.activated";
            this.EVENT_USER_REGISTER = "user.register";
            this.EVENT_USER_RESET = "user.reset";

            if (!this.config.key) {
                this.log.error("Key not set");
                // return reject();
            }
            if (!this.config.secret) {
                this.log.error("Secret not set");
                // return reject();
            }

            this.client = Mailjet.connect(this.config.key, this.config.secret);

            this.registerEvents();

            resolve();
        });
    }

    registerEvents() {

        // Application.on(this.EVENT_USER_LOGIN, (data) => {
        //     const maildata = {
        //         email: data.user.email,
        //         name: data.user.username,
        //     };
        //
        //     this.sendMail("default", [maildata], {
        //         template: this.EVENT_USER_LOGIN,
        //         data: maildata,
        //         subject: this.config.subjects[this.EVENT_USER_LOGIN] || ""
        //     }).then(() => {
        //         this.log.info("Email for %s sent", this.EVENT_USER_LOGIN);
        //     });
        // });

        Application.on(this.EVENT_USER_ACTIVATED, (data) => {
            const maildata = {
                email: data.user.email,
                name: data.user.username,
            };

            this.sendMail("default", [maildata], {
                template: this.EVENT_USER_ACTIVATED,
                data: maildata,
                subject: this.config.subjects[this.EVENT_USER_ACTIVATED] || ""
            }).then(() => {
                this.log.info("Email for %s sent", this.EVENT_USER_ACTIVATED);
            });
        });

        Application.on(this.EVENT_USER_REGISTER, (data) => {
            const maildata = {
                email: data.user.email,
                name: data.user.username,
            };

            this.sendMail("default", [maildata], {
                template: this.EVENT_USER_REGISTER,
                data: maildata,
                subject: this.config.subjects[this.EVENT_USER_REGISTER] || ""
            }).then(() => {
                this.log.info("Email for %s sent", this.EVENT_USER_REGISTER);
            });
        });

        Application.on(this.EVENT_USER_RESET, (data) => {
            const maildata = {
                email: data.user.email,
                name: data.user.username,
            };

            this.sendMail("default", [maildata], {
                template: this.EVENT_USER_RESET,
                data: maildata,
                subject: this.config.subjects[this.EVENT_USER_RESET] || ""
            }).then(() => {
                this.log.info("Email for %s sent", this.EVENT_USER_RESET);
            });
        });
    }

    /**
     * Send an email to a list of recipients.
     *
     * @param {string} senderKey Gets the sender information (email, name) from the module config
     * @param {Object[]} recipients Array with objects of { email: string }
     * @param options
     * @param options.template template to load or use
     * @param options.text text part of the email
     * @param options.html html part of the email
     * @param options.data optional data for the email
     * @param options.subject subject
     * @param options.attachments possible file attachments
     * @returns {Promise}
     */
    sendMail(senderKey, recipients, options) {
        senderKey = senderKey || "default";
        options = options || {};

        if (!this.config.senders[senderKey]) {
            throw new Error("No sender configured for " + senderKey);
        }

        if (!recipients || !recipients.length) {
            throw new Error("Recipients not set or empty");
        }

        let mailjetRecipients = recipients.map((item) => {
            if (item.cc || item.bcc) {
                this.log.warn("CC and BCC not supported yet");
            }

            if (!item.hasOwnProperty("email") || !item.email) {
                throw new Error("Recipient has no email set");
            }

            return {
                Email: item.email,
                Name: item.name
            }
        });

        let fromEmail = this.config.senders[senderKey].email;
        let fromName = this.config.senders[senderKey].name;

        let textPart = options.text || "";
        let htmlPart = options.html || "";
        let subject = options.subject || "";
        let templateId = options.template || "";

        return new Promise((resolve, reject) => {

            let vars = options.data || {};

            this.client
                .post("send")
                .request({
                    "FromEmail": fromEmail,
                    "FromName": fromName,
                    "Subject": subject,
                    "Text-part": textPart,
                    "Html-part": htmlPart,
                    "Vars": vars,
                    "Recipients": mailjetRecipients,
                    "Mj-TemplateID": templateId
                })
                .then(result => {
                    if (result) {
                        console.log(result.body);
                    }

                    resolve();
                })
                .catch(err => {
                    this.log.error(err.statusCode);
                    reject(err.statusCode);
                })
        });
    }

}