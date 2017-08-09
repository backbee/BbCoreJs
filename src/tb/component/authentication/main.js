/*
 * Copyright (c) 2011-2013 Lp digital system
 *
 * This file is part of BackBee.
 *
 * BackBee is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * BackBee is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with BackBee. If not, see <http://www.gnu.org/licenses/>.
 */
define('tb.component/authentication/main',
    [
        'tb.component/session/session',
        'Core',
        'Core/DriverHandler',
        'Core/RestDriver',
        'jquery',
        'jsclass',
        'component!popin',
        'component!formbuilder'
    ],
    function (session, Core, DriverHandler, RestDriver, jQuery) {

        'use strict';

        /**
         * AuthenticationHandler object
         */
        var AuthenticationHandler = new JS.Class({

            /**
             * Initialize of AuthenticationHandler
             */
            initialize: function () {

                var self = this;

                this.popinManager = require('component!popin');
                this.popin = this.popinManager.createPopIn({
                    'close': function reloadWebsite() {

                        if (self.destroy !== false) {
                            session.destroy();
                            document.cookie = 'PHPSESSID=; expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
                        }

                        window.location.reload();
                    }
                });
                this.formBuilder = require('component!formbuilder');
            },

            setTitle: function (title) {
                this.title = title;
            },

            setContent: function (content) {
                this.popin.setContent(content);
            },

            display: function () {
                this.popin.display();
            },

            /**
             * Do the request to rest Core with username and password to try authentication.
             * The return will be catch by onRequestDone event.
             * @param {String} username
             * @param {String} password
             */
            authenticate: function (username, password) {
                var self = this,
                    onDone = function (data, response) {
                        self.destroy = false;
                        self.popin.unmask();
                        self.popin.hide();
                        self.onRequestDone(response);

                        return data;
                    };

                session.destroy();

                DriverHandler.addDriver('rest', RestDriver);
                DriverHandler.create('security/authentication', {"username": username, "password": password})
                             .done(onDone);
            },

            /**
             * Event
             * Update Core's key and Core's signature with the headers provided by response
             * into the Session storage
             * @param {Object} response
             */
            onRequestDone: function (response) {
                var apiKey = response.getHeader(session.HEADER_API_KEY) || response.getHeader(session.HEADER_API_KEY.toLowerCase()),
                    apiSignature = response.getHeader(session.HEADER_API_SIGNATURE) || response.getHeader(session.HEADER_API_SIGNATURE.toLowerCase());

                this.authenticateBySign(apiKey, apiSignature);
            },

            /**
             * Update Core's key and Core's signature into the Session storage
             * @param  string key
             * @param  string signature
             */
            authenticateBySign: function (key, signature) {
                session.key = key;
                session.signature = signature;

                if (session.isValidAuthentication()) {
                    session.persist();

                    window.location.reload();
                }
            },

            /**
             * Function called when the form is submit
             * @param {Object} data
             */
            onSubmitForm: function (data) {
                this.popin.mask();
                this.authenticate(data.username, data.password);
            },

            /**
             * Function called when the form is validate
             * @param {Object} form
             * @param {Object} data
             */
            onValidateForm: function (form, data) {
                if (!data.hasOwnProperty('username') || data.username.trim().length === 0) {
                    form.addError('username', 'Username is required');
                }

                if (!data.hasOwnProperty('password') || data.password.trim().length === 0) {
                    form.addError('password', 'Password is required.');
                }
            },

            /**
             * Display the form in a popin
             * @param {String} error
             */
            showForm: function (error) {
                var self = this,
                    configForm = {
                        elements: {
                            username: {
                                type: 'text',
                                label: 'Login'
                            },
                            password: {
                                type: 'password',
                                label: 'Password'
                            }
                        },
                        form: {
                            submitLabel: 'Sign in',
                            error: error
                        },
                        form_name: 'bb-auth',
                        onSubmit: jQuery.proxy(this.onSubmitForm, this),
                        onValidate: jQuery.proxy(this.onValidateForm, this)
                    };

                this.destroy = true;

                this.popin.setTitle('Log in');
                this.formBuilder.renderForm(configForm).done(function (html) {
                    self.popin.setContent(html);
                    self.popin.display();
                }).fail(function (e) {
                    Core.exception('AuthenticationHandlerException', 500, 'Form rendering fail', {error: e});
                });
            }
        });

        return new JS.Singleton(AuthenticationHandler);
    });