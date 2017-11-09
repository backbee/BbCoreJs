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
                name: {
                    type: 'text',
                    label: translator.translate('name'),
                    value: view.group.name
                },
                description: {
                    type: 'textarea',
                    label: translator.translate('description'),
                    value: view.group.description
                }
            },

            onSubmit: function (data) {
                view.group.name = data.name.trim();
                view.group.description = data.description.trim();
                view.dfd.resolve(view.group);
            },

            onValidate: function (form, data) {
                if (!data.hasOwnProperty('name') || data.name.trim().length === 0) {
                    form.addError('name', translator.translate('name_is_required'));
                }
            }
        };
    };

    return {
        construct: function (view, errors) {
            var config = configure(view),
                key;

            if (undefined !== errors) {
                for (key in errors) {
                    if (errors.hasOwnProperty(key) &&
                            config.elements.hasOwnProperty(key)) {
                        config.elements[key].error = errors[key];
                    }
                }
            }

            return formbuilder.renderForm(config);
        }
    };
});
