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
define(
    [
        'require',
        'Core',
        'jquery',
        'user/form/group.form'
    ],
    function (require, Core, jQuery) {

        'use strict';

        /**
         * View of new page
         * @type {Object} Backbone.View
         */
        return Backbone.View.extend({

            /**
             * Initialize.
             *
             * @param data
             */
            initialize: function (data) {

                var self = this,
                    mainPopin = data.popin,
                    trans = Core.get('trans') || function (value) { return value; },
                    popinConfig =  {
                        width: 250,
                        top: 180,
                        close: function () {
                            mainPopin.popinManager.destroy(self.popin);
                        }
                    };

                this.popin = mainPopin.popinManager.createPopIn(popinConfig);
                this.selector = '#toolbar-new-group';
                this.group = data.group;

                if (data.group.id !== undefined) {
                    this.selector = '#toolbar-group-' + data.group.id;
                }

                if ('edit' === data.action) {
                    this.popin.setTitle(this.group.name + ' ' + trans('edition').toLowerCase());
                } else {
                    this.popin.setTitle(trans('create-new-group'));
                }

                require('user/form/group.form').construct(this, data.error).then(function (tpl) {
                    self.popin.setContent(tpl);
                });
            },

            display: function () {
                this.dfd = jQuery.Deferred();
                this.popin.display();
                return this.dfd.promise();
            },

            destruct: function () {
                this.zone.html('');
            }
        });
    }
);