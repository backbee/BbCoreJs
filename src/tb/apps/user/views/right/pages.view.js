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
        'Core',
        'BackBone',
        'jquery',
        'Core/Renderer',
        'require',
        'page.view.tree',

        'text!user/templates/right/table.pages.twig',
        'text!user/templates/right/table.pages.item.twig'
    ],
    function (Core, Backbone, jQuery, Renderer, require, PageTreeView) {

        'use strict';

        return Backbone.View.extend({

            /**
             * Initialize
             *
             * @param {Object} params Component parameters
             */
            initialize: function (params) {

                jQuery.extend(this, {}, Backbone.Events);

                this.component = 'pages';
                this.repository = require('user/repository/right.repository');
                this.mainTpl = require('text!user/templates/right/table.pages.twig');
                this.tpl = require('text!user/templates/right/table.pages.item.twig');

                this.pageRights = {
                    none : 0,
                    all : 0,
                    view : 1,
                    create : 2,
                    edit : 4,
                    delete : 8,
                    publish : 512
                };

                this.groupId = params.groupId;
                this.updatePageRights();

                this.buildTree();
            },

            /**
             * Update page rights.
             */
            updatePageRights: function () {

                var sum = 0,
                    i;

                for (i in this.pageRights) {

                    if (this.pageRights.hasOwnProperty(i)) {
                        sum += this.pageRights[i];
                    }
                }

                this.sumOfMask = sum;
            },

            /**
             * Set component view
             *
             * @param node
             */
            setComponentView: function (node) {

                var self = this,
                    element = jQuery(node.element),
                    children = element.children('.jqtree-element'),
                    westBlock = element.parents('.ui-layout-west'),
                    itemContain = element.parents('div.row').find('.content-tree .bb5-manage-rights-items table tbody');

                // Add highlight
                westBlock.find('.txt-highlight').removeClass('txt-highlight');
                children.find('span').addClass('txt-highlight');

                this.repository.findPage(node.uid, this.groupId).then(function (page) {

                    var params = {
                        component: self.component,
                        item: page,
                        pageRights: self.pageRights,
                        sumOfMask : self.sumOfMask
                    };

                    itemContain.html(Renderer.render(self.tpl, params));
                });

                itemContain.parent('table').find('tr.current-page td span').text(node.name);
            },

            /**
             * Handle node selection
             *
             * @param event
             */
            handleNodeSelection: function (event) {
                this.setComponentView(event.node);
            },

            /**
             * Bind tree events
             */
            bindTreeEvents: function () {
                this.pageTreeView.treeView.off('click').on('click', jQuery.proxy(this.handleNodeSelection, this));
            },

            /**
             * Build Tree
             * @returns {boolean}
             */
            buildTree: function () {

                var self = this,
                    config = {
                        popin: false,
                        do_loading: true,
                        do_pagination: true,
                        site_uid: Core.get('site.uid'),
                        only_section: false
                    };

                this.pageTreeView = new PageTreeView(config);
                this.pageTreeView.getTree().done(function (tree) {

                    tree.render('#bb-page-management-tree-view');
                    self.bindTreeEvents();

                    var rootNode = tree.invoke('getNodeById', Core.get('root.uid'));
                    tree.invoke('selectNode', rootNode);
                    self.setComponentView(rootNode);
                });

                return false;
            },

            /**
             * Get permissions
             *
             * @returns {Object}
             */
            getPermissions: function (mainContainer) {

                var self = this,
                    rights = {};

                mainContainer.find('tbody tr').each(function () {

                    var row = jQuery(this),
                        mask = parseInt(row.attr('data-mask'), 10);

                    if (0 !== mask || row.hasClass('none')) {

                        rights.mask = mask;
                    }

                    rights.uid = row.attr('data-uid');
                    rights.sid = self.groupId;

                });

                return rights;
            },

            /**
             * Save handler
             *
             * @param permissions
             */
            saveHandler: function (permissions) {

                var dfd = jQuery.Deferred();

                this.repository.savePermissionsPage(permissions).then(function () {
                    dfd.resolve(true);
                });

                return dfd.promise();
            },

            /**
             * Render
             * @return {Object} Deferred's promise object
             */
            render: function () {

                var dfd = jQuery.Deferred(),
                    params = {
                        component: this.component,
                        pageRights: this.pageRights
                    };

                dfd.resolve(Renderer.render(this.mainTpl, params));

                return dfd.promise();
            }
        });
    }
);