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
        'tb.core.ApplicationManager',
        'page.view.tree',
        'component!contextmenu',
        'page.repository',
        'jquery',
        'tb.core.Request',
        'tb.core.RequestHandler'
    ],
    function (ApplicationManager, TreeView, ContextMenu, PageRepository, jQuery, Request, RequestHandler) {

        'use strict';

        /**
         * View of page tree contribution With move node, contextmenu.
         * @type {Object} Backbone.View
         */
        var PageViewTreeContribution = Backbone.View.extend({

            /**
             * Initialize of PageViewTreeContribution
             */
            initialize: function (config) {
                this.view = new TreeView(config);
                this.treeView = this.view.treeView;

                this.bindEvents();
            },

            /**
             * Bind events to tree
             */
            bindEvents: function () {
                this.contextMenu = new ContextMenu(this.buildContextMenuConfig());
                this.contextMenu.beforeShow = jQuery.proxy(this.beforeShow, this);

                this.currentEvent = null;

                this.treeView.on('contextmenu', jQuery.proxy(this.onRightClick, this));
                this.treeView.on('tree.dblclick', this.onDoubleClick);
                this.treeView.on('tree.move', jQuery.proxy(this.onMove, this));
            },

            beforeShow: function () {
                var filters = [];

                if (this.copied_node === undefined && this.cuted_node === undefined) {
                    filters.push('bb5-context-menu-paste');
                    filters.push('bb5-context-menu-paste-before');
                    filters.push('bb5-context-menu-paste-after');
                }

                if (this.copied_node === this.currentEvent.node || this.cuted_node === this.currentEvent.node) {
                    filters.push('bb5-context-menu-copy');
                    filters.push('bb5-context-menu-cut');
                    filters.push('bb5-context-menu-paste');
                    filters.push('bb5-context-menu-paste-before');
                    filters.push('bb5-context-menu-paste-after');
                }

                this.contextMenu.setFilters(filters);
            },

            /**
             * Event trigged on right click in node tree
             * @param {Object} event
             */
            onRightClick: function (event) {
                if (event.node.is_fake === true) {
                    return;
                }

                this.currentEvent = event;
                this.contextMenu.enable();
                this.contextMenu.show(event.click_event);
            },

            /**
             * Event trigged on double click in node tree
             * @param {Object} event
             */
            onDoubleClick: function (event) {
                if (event.node.is_fake === true) {
                    return;
                }

                jQuery(location).attr('href', event.node.url);
            },

            /**
             * Event trigged on drag n drop node tree
             * @param {Object} event
             */
            onMove: function (event) {
                if (event.move_info.moved_node.is_fake === true) {
                    return;
                }

                event.move_info.do_move();

                var moveInfo = event.move_info,
                    page_uid = moveInfo.moved_node.id,
                    parent_uid = moveInfo.moved_node.parent.id,
                    data = {};

                if (moveInfo.moved_node.getNextSibling() !== null) {
                    data.sibling_uid = moveInfo.moved_node.getNextSibling().id;
                } else {
                    data.parent_uid = parent_uid;
                }

                PageRepository.moveNode(page_uid, data);
            },

            /**
             * Build config for context menu
             * @returns {Object}
             */
            buildContextMenuConfig: function () {
                var self = this,
                    config = {
                        domTag: '#bb5-ui',
                        menuActions : [
                            {
                                btnCls: "bb5-context-menu-add",
                                btnLabel: "Create",
                                btnCallback: function () {
                                    var callback = function (data, response) {
                                        RequestHandler.send(self.buildRequest(response.getHeader('Location'))).done(function (page) {
                                            if (self.currentEvent.node.before_load === false) {
                                                self.treeView.invoke('appendNode', self.view.formatePageToNode(page), self.currentEvent.node);
                                            }
                                        });

                                        return data;
                                    }, serviceConfig = {
                                        'parent_uid': self.currentEvent.node.id,
                                        'callbackAfterSubmit': callback
                                    };

                                    ApplicationManager.invokeService('page.main.newPage', serviceConfig);
                                }
                            },

                            {
                                btnCls: "bb5-context-menu-edit",
                                btnLabel: "Edit",
                                btnCallback: function () {
                                    var callback = function () {
                                        PageRepository.find(self.currentEvent.node.uid).done(function (page) {
                                            if (self.currentEvent.node.before_load === false) {
                                                self.view.updateNode(self.currentEvent.node, page);
                                                self.treeView.invoke('updateNode', self.currentEvent.node, page.title);
                                            }
                                        });
                                    }, serviceConfig = {
                                        'page_uid': self.currentEvent.node.id,
                                        'callbackAfterSubmit': callback
                                    };

                                    ApplicationManager.invokeService('page.main.editPage', serviceConfig);
                                }
                            },
                            {
                                btnCls: "bb5-context-menu-remove",
                                btnLabel: "Remove",
                                btnCallback: function () {
                                    var callback = function () {
                                            self.treeView.invoke('removeNode', self.currentEvent.node);
                                        },
                                        serviceConfig = {
                                            'uid': self.currentEvent.node.id,
                                            'callbackAfterSubmit': callback
                                        };

                                    ApplicationManager.invokeService('page.main.deletePage', serviceConfig);
                                }
                            },
                            {
                                btnCls: "bb5-context-menu-copy",
                                btnLabel: "Copy",
                                btnCallback: function () {
                                    self.copied_node = self.currentEvent.node;
                                    self.cuted_node = undefined;
                                }
                            },
                            {
                                btnCls: "bb5-context-menu-paste",
                                btnLabel: "Paste",
                                btnCallback: function () {
                                    self.doPaste('inside');
                                }
                            },
                            {
                                btnCls: "bb5-context-menu-paste-before",
                                btnLabel: "Paste before",
                                btnCallback: function () {
                                    self.doPaste('before');
                                }
                            },
                            {
                                btnCls: "bb5-context-menu-paste-after",
                                btnLabel: "Paste after",
                                btnCallback: function () {
                                    self.doPaste('after');
                                }
                            },
                            {
                                btnCls: "bb5-context-menu-cut",
                                btnLabel: "Cut",
                                btnCallback: function () {
                                    self.cuted_node = self.currentEvent.node;
                                    self.copied_node = undefined;
                                }
                            },
                            {
                                btnCls: "bb5-context-menu-flyto",
                                btnLabel: "Browse to",
                                btnCallback: function () {
                                    jQuery(location).attr('href', self.currentEvent.node.url);
                                }
                            }
                        ]
                    };

                return config;
            },

            doPaste: function (func) {
                var self = this,
                    target,
                    data = {},
                    currentNode = this.currentEvent.node,
                    copyFunc;

                if (this.cuted_node !== undefined) {
                    target = this.cuted_node;
                } else if (this.copied_node !== undefined) {
                    target = this.copied_node;
                }

                if (target !== undefined) {
                    if (func === 'before') {
                        data.sibling_uid = currentNode.id;
                        copyFunc = 'addNodeBefore';
                    } else if (func === 'inside') {
                        data.parent_uid = currentNode.id;
                        copyFunc = 'appendNode';
                    } else if (func === 'after') {
                        if (currentNode.getNextSibling() === null) {
                            data.parent_uid = currentNode.parent.id;
                        } else {
                            data.sibling_uid = currentNode.getNextSibling().id;
                        }

                        copyFunc = 'addNodeAfter';
                    }

                    if (this.copied_node === target) {
                        data.page_uid = target.id;
                        data.callbackAfterSubmit = function (data, response) {
                            if ((copyFunc === 'appendNode' && currentNode.before_load === false) ||
                                    copyFunc === 'addNodeBefore' ||
                                    copyFunc === 'addNodeAfter') {

                                RequestHandler.send(self.buildRequest(response.getHeader('Location'))).done(function (page) {
                                    self.treeView.invoke(copyFunc, self.view.formatePageToNode(page), currentNode);
                                });
                            }

                            return data;
                        };

                        ApplicationManager.invokeService('page.main.clonePage', data);
                    } else {
                        if ((func === 'inside' && currentNode.before_load === false) ||
                                func === 'before' ||
                                func === 'after') {

                            this.treeView.invoke('moveNode', target, currentNode, func);
                        } else {
                            this.treeView.invoke('removeNode', target);
                        }

                        PageRepository.moveNode(target.id, data);
                    }
                }

                this.copied_node = undefined;
                this.cuted_node = undefined;
            },

            buildRequest: function (url) {
                var request = new Request();

                request.setUrl(url);

                return request;
            },

            /**
             * Render the template into the DOM with the ViewManager
             * @returns {Object} PageViewClone
             */
            render: function () {
                this.view.render();

                return this;
            }
        });

        return PageViewTreeContribution;
    }
);