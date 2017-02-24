/*
 * Copyright (c) 2011-2013 Lp digital system
 *
 * This file is part of Backbee.
 *
 * Backbee is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Backbee is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Backbee. If not, see <http://www.gnu.org/licenses/>.
 */

define(
    [
        'BackBone',
        'jquery',
        'Core/Renderer',
        'require',

        'text!user/templates/right/table.item.twig'
    ],
    function (Backbone, jQuery, Renderer, require) {

        "use strict";

        return Backbone.View.extend({

            /**
             * Initialize
             *
             * @param {Object} params Component parameters
             */
            initialize: function (params) {

                this.component = 'bundles';
                this.repository = require('user/repository/right.repository');
                this.tpl = require('text!user/templates/right/table.item.twig');
                this.mainTpl = params.mainTpl;
                this.groupId = params.groupId;
                this.defaultRights = params.defaultRights;
                this.sumOfMask = params.sumOfMask;
            },

            /**
             * Build items
             *
             * @return {Object} Deferred's promise object
             */
            buildItems: function () {

                var self = this,
                    dfd = jQuery.Deferred();

                this.repository.findBundles(this.groupId).then(function (bundle) {

                    var i,
                        items = [],
                        renderParams = {};

                    for (i = 0; i < bundle.length; i = i + 1) {

                        renderParams = {
                            item: bundle[i],
                            rights: bundle[i].rights,
                            defaultRights: self.defaultRights,
                            sumOfMask : self.sumOfMask
                        };

                        items[i] = Renderer.render(self.tpl, renderParams);
                    }

                    dfd.resolve(items);
                });

                return dfd.promise();
            },

            /**
             * Get permissions
             *
             * @returns {Array}
             */
            getPermissions: function (mainContainer) {

                var self = this,
                    rights = [];

                mainContainer.find('tbody tr').each(function () {

                    var row = jQuery(this),
                        mask = parseInt(row.attr('data-mask'), 10),
                        item = {};

                    if (0 !== mask || row.hasClass('none')) {

                        item.mask = mask;
                    }

                    item.object_class = row.attr('data-class');
                    item.sid = self.groupId;

                    rights.push(item);
                });

                return rights;
            },

            /**
             * Render
             *
             * @return {Object} Deferred's promise object
             */
            render: function () {

                var self = this,
                    dfd = jQuery.Deferred();

                this.buildItems().done(function (items) {

                    var params = {
                        objects: items,
                        component: self.component,
                        defaultRights: self.defaultRights,
                        sumOfMask : self.sumOfMask
                    };

                    dfd.resolve(Renderer.render(self.mainTpl, params));
                });

                return dfd.promise();
            }
        });
    }
);