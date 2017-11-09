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
        'user/repository/abstract.rest.repository',
        'Core/DriverHandler',
        'jquery'
    ],
    function (AbstractRestRepository, CoreDriverHandler, jQuery) {

        'use strict';

        /**
         * Right repository class
         * @type {Object} JS.Class
         */
        var RightRepository = new JS.Class(AbstractRestRepository, {

            /**
             * Initialize of Right repository
             */
            initialize: function () {
                this.class_name = 'acl';
                this.identifier = 'id';
                this.initializeRestDriver();
            },

            /**
             * Find layouts with right
             *
             * @param  {String} site_uid Current uid site
             * @param  {String} group_id Group id
             * @return {Object} Deferred's promise object
             */
            findLayouts: function (site_uid, group_id) {

                var dfd = jQuery.Deferred(),
                    endPoint = 'layout/' + group_id + '/permissions';

                CoreDriverHandler.read(endPoint, {'site_uid': site_uid}).done(function (layouts) {
                    dfd.resolve(layouts);
                });

                return dfd.promise();
            },

            /**
             * Find blocks with right
             *
             * @param  {String} group_id Group id
             * @return {Object} Deferred's promise object
             */
            findBlocks: function (group_id) {

                var dfd = jQuery.Deferred(),
                    endPoint = 'classcontent/' + group_id + '/permissions';

                CoreDriverHandler.read(endPoint, {}).done(function (blocks) {
                    dfd.resolve(blocks);
                });

                return dfd.promise();
            },

            /**
             * Find media folders with right
             *
             * @param  {String} group_id Group id
             * @return {Object} Deferred's promise object
             */
            findMediaFolders: function (group_id) {

                var dfd = jQuery.Deferred(),
                    endPoint = 'media-folder/' + group_id + '/permissions';

                CoreDriverHandler.read(endPoint, {}).done(function (folders) {
                    dfd.resolve(folders);
                });

                return dfd.promise();
            },

            /**
             * Find bundles with right
             *
             * @param  {String} group_id Group id
             * @return {Object} Deferred's promise object
             */
            findBundles: function (group_id) {

                var dfd = jQuery.Deferred(),
                    endPoint = 'bundle/' + group_id + '/permissions';

                CoreDriverHandler.read(endPoint, {}).done(function (bundles) {
                    dfd.resolve(bundles);
                });

                return dfd.promise();
            },

            /**
             * Find workflow with right
             *
             * @param group_id
             * @return {Object} Deferred's promise object
             */
            findWorkflow: function (group_id) {

                var dfd = jQuery.Deferred(),
                    endPoint = 'workflow/' + group_id + '/permissions';

                CoreDriverHandler.read(endPoint, {}).done(function (workflow) {
                    dfd.resolve(workflow);
                });

                return dfd.promise();
            },

            /**
             * Find pages right
             *
             * @param  {String} uid Page uid
             * @param  {String} group_id Group id
             * @return {Object} Deferred's promise object
             */
            findPage: function (uid, group_id) {

                var dfd = jQuery.Deferred(),
                    endPoint = 'page/' + group_id + '/permissions/' + uid;

                CoreDriverHandler.read(endPoint, {}).done(function (rights) {
                    dfd.resolve(rights);
                });

                return dfd.promise();
            },

            /**
             * Save permissions
             *
             * @param {Object}  data
             * @return {Object} Deferred's promise object
             */
            savePermissions: function (data) {

                var dfd = jQuery.Deferred();

                CoreDriverHandler.create(this.class_name, data).done(function (result) {
                    dfd.resolve(result);
                });

                return dfd.promise();
            },

            /**
             * Save permissions page
             *
             * @param {Object}  data
             * @return {Object} Deferred's promise object
             */
            savePermissionsPage: function (data) {

                console.log(data);

                var dfd = jQuery.Deferred(),
                    endPoint = this.class_name + '/' + data.sid + '/page/' + data.uid;

                CoreDriverHandler.create(endPoint, data).done(function (result) {
                    dfd.resolve(result);
                });

                return dfd.promise();
            }
        });

        return new JS.Singleton(RightRepository);
    }
);
