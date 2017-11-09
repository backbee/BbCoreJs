/*
 * Copyright (c) 2011-2013 Lp digital system
 *
 * This file is part of BackBuilder5.
 *
 * BackBuilder5 is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * BackBuilder5 is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with BackBuilder5. If not, see <http://www.gnu.org/licenses/>.
 */
define(['component!formbuilder', 'component!translator'], function (formbuilder, translator) {
    'use strict';

    var configure = function (view) {

        return {
            elements: {
                firstname: {
                    type: 'text',
                    label: translator.translate('first_name'),
                    value: view.user.getObject().firstname
                },
                lastname: {
                    type: 'text',
                    label: translator.translate('last_name'),
                    value: view.user.getObject().lastname
                },
                email: {
                    type: 'text',
                    label: translator.translate('email'),
                    value: view.user.getObject().email
                },
                login: {
                    type: 'text',
                    label: translator.translate('login'),
                    value: view.user.getObject().login,
                    disabled: true
                },
                activated: {
                    type: 'checkbox',
                    options: {
                        activated: translator.translate('account_activated')
                    },
                    checked: (view.user.getObject().activated === true) ? 'activated' : ''
                },
                api_key_enabled: {
                    type: 'checkbox',
                    options: {
                        api_key_enabled: translator.translate('api_key_enabled')
                    },
                    checked: (view.user.getObject().api_key_enabled === true) ? 'api_key_enabled' : ''
                },
                changepwd: {
                    type: 'checkbox',
                    options: {
                        yes: translator.translate('change_password')
                    }
                },
                passwd: {
                    type: 'password',
                    label: translator.translate('password')
                }
            },

            onSubmit: function (data) {
                data.activated = (data.activated === 'activated');
                data.api_key_enabled = (data.api_key_enabled === 'api_key_enabled');

                if (data.changepwd === 'yes') {
                    data.password = data.passwd;
                }

                view.user.populate(data);
                view.dfd.resolve(view.user);
            },

            onValidate: function (form, data) {
                if (!data.hasOwnProperty('email') || data.email.trim().length === 0) {
                    form.addError('email', translator.translate('email_is_required'));
                } else {
                    if (!/^[aA-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,6}$/i.test(data.email.trim())) {
                        form.addError('email', translator.translate('email_is_invalid'));
                    }
                }
                if (data.changepwd === 'yes' && (!data.hasOwnProperty('passwd') || data.passwd.trim().length === 0)) {
                    form.addError('passwd', translator.translate('password_is_invalid'));
                } else if (data.changepwd === 'yes' && (data.passwd.length < 5 && data.passwd.length > 33)) {
                    form.addError('passwd', translator.translate('password_is_too_short'));
                }
            }
        };
    };

    return {
        construct: function (view, errors) {
            var config = configure(view),
                form,
                key;

            if (undefined !== errors) {
                for (key in errors) {
                    if (errors.hasOwnProperty(key) &&
                            config.elements.hasOwnProperty(key)) {
                        config.elements[key].error = errors[key];
                    }
                }
            }

            form = formbuilder.renderForm(config);

            form.done(function (tpl) {
                view.popin.setContent(tpl);
            });
        }
    };
});
