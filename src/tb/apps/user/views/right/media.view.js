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

                this.component = 'media';
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

                this.repository.findMediaFolders(this.groupId).then(function (mediaFolders) {

                    var i,
                        objects = mediaFolders.objects,
                        render = [],
                        results = [],
                        params = {};

                    for (i = 0; i < objects.length; i = i + 1) {

                        params = {
                            item: objects[i],
                            rights: objects[i].rights,
                            defaultRights: self.defaultRights,
                            sumOfMask : self.sumOfMask
                        };

                        render[i] = Renderer.render(self.tpl, params);
                    }

                    results.parent = mediaFolders.parent;
                    results.objects = render;

                    dfd.resolve(results);

                });

                return dfd.promise();
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
                        parent: items.parent,
                        objects: items.objects,
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