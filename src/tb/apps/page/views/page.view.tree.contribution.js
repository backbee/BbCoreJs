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

define(
    [
        'Core',
        'Core/ApplicationManager',
        'page.view.tree',
        'component!contextmenu',
        'component!notify',
        'page.repository',
        'jquery',
        'Core/Request',
        'Core/RequestHandler',
        'component!translator'
    ],
    function (Core, ApplicationManager, PageTreeView, ContextMenu, Notify, PageRepository, jQuery, Request, RequestHandler, Translator) {

        'use strict';

        /**
         * View of page tree contribution With move node, contextmenu.
         * @type {Object} Backbone.View
         */
        var PageViewTreeContribution = Backbone.View.extend({

            mainSelector: Core.get('wrapper_toolbar_selector'),

            /**
             * Initialize of PageViewTreeContribution
             */
            initialize: function (config) {
                jQuery.extend(this, {}, Backbone.Events);
                this.view = new PageTreeView(config);
                this.treeView = this.view.treeView;
                this.autoLoadRoot = false;
                if (config.hasOwnProperty("autoLoadRoot") && config.autoLoadRoot === true) {
                    this.autoLoadRoot = true;
                }
                this.bindEvents();
            },

            showFilter: function () {
                this.view.showFilter();
            },

            showSearch: function () {
                this.view.showSearch();
            },

            bindEvents: function () {
                this.contextMenu = new ContextMenu(this.buildContextMenuConfig());

                this.contextMenu.beforeShow = jQuery.proxy(this.beforeShow, this);
                this.currentEvent = null;

                this.treeView.on('contextmenu', jQuery.proxy(this.onRightClick, this));
                this.treeView.on('tree.dblclick', this.onDoubleClick);
                this.treeView.on('tree.move', jQuery.proxy(this.onMove, this));
                this.treeView.on('tree.select', this.handleNodeSelection.bind(this));
            },


            handleNodeSelection: function (event) {
                if (!event.node) {
                    this.view.toolbarMenu.disable();
                } else {
                    if (event.node.is_fake === true) {
                        return;
                    }

                    this.currentEvent = event;
                    var filters = this.beforeShow(true);
                    this.view.toolbarMenu.disableButtons(filters);
                }
            },

            updatePopinMenu: function (e) {
                if (e.node.is_fake === true) {
                    return;
                }

                this.currentEvent = e;
                var filters = this.beforeShow(true);
                this.view.toolbarMenu.disableButtons(filters);
            },

            hasSelection: function () {
                var selected = this.treeView.getSelectedNode();
                return selected;
            },

            handlePopInMenu: function (config) {
                var menuItem,
                    menuList = [],
                    menu;

                if (!this.view.toolbarMenu) { return false; }
                menu = this.view.toolbarMenu;

                /* populate popin menu */
                jQuery.each(config.menuActions, function (i) {
                    menuItem = config.menuActions[i];
                    menuList.push({key: menuItem.btnCls, label: menuItem.btnLabel, action: menuItem.btnCallback});
                });

                menu.setButtons(menuList);
            },


            beforeShow: function () {
                var filters = [],
                    page = this.currentEvent.node;

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

                if (this.treeView.isRoot(page)) {
                    filters.push('bb5-context-menu-copy');
                    filters.push('bb5-context-menu-cut');
                    filters.push('bb5-context-menu-remove');
                }

                this.contextMenu.setFilters(filters);
                return filters;
            },

            /**
             * Event trigged on right click in node tree
             * @param {Object} event
             */
            onRightClick: function (event) {
                if (event.node.is_fake === true) {
                    return;
                }
                this.treeView.selectNode(event.node);
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

                jQuery(location).attr('href', event.node.uri);
            },

            /**
             * Event trigged on drag n drop node tree
             * @param {Object} event
             */
            onMove: function (event) {
                if (event.move_info.moved_node.is_fake === true) {
                    return;
                }
                this.view.tree.popIn.mask();
                event.move_info.do_move();

                var self = this,
                    moveInfo = event.move_info,
                    page_uid = moveInfo.moved_node.id,
                    parent_uid = moveInfo.moved_node.parent.id,
                    data = {};

                if (moveInfo.moved_node.getNextSibling() !== null) {
                    data.sibling_uid = moveInfo.moved_node.getNextSibling().id;
                } else {
                    data.parent_uid = parent_uid;
                }

                PageRepository.moveNode(page_uid, data).done(function () {
                    Notify.success(Translator.translate('tree_modification_saved'));

                    PageRepository.find(page_uid).done(function (page) {
                        if (self.currentEvent !== null && self.currentEvent.node.id === page.uid && self.currentEvent.node.uri !== page.uri) {
                            jQuery(location).attr('href', page.uri);
                        } else {
                            self.view.updateNode(moveInfo.moved_node, page);
                        }
                        self.view.tree.popIn.unmask();
                    });

                });
            },

            selectPage: function (page_uid) {
                this.view.selectPage(page_uid);
            },
            /**
             * Build config for context menu
             * @returns {Object}
             */
            buildContextMenuConfig: function () {
                var self = this,
                    config = {
                        domTag: self.mainSelector,
                        menuActions : [
                            {
                                btnCls: "bb5-context-menu-add",
                                btnLabel: Translator.translate('create'),
                                btnCallback: function () {
                                    var callback = function (data, response) {
                                        var location = response.getHeader('Location') || response.getHeader('location');
                                        RequestHandler.send(self.buildRequest(location)).done(function (page) {
                                            if (self.currentEvent.node.before_load === false) {
                                                var children = self.currentEvent.node.children;

                                                if (children.length > 0) {
                                                    self.treeView.invoke('addNodeBefore', self.view.formatePageToNode(page), children[0]);
                                                } else {
                                                    self.treeView.invoke('appendNode', self.view.formatePageToNode(page), self.currentEvent.node);
                                                }
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
                                btnLabel: Translator.translate('edit'),
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
                                btnLabel: Translator.translate('delete'),
                                btnCallback: function () {
                                    var callback = function () {
                                            self.treeView.invoke('removeNode', self.currentEvent.node);
                                        },
                                        serviceConfig = {
                                            'uid': self.currentEvent.node.id,
                                            'callbackAfterSubmit': callback,
                                            'doRedirect': true
                                        };

                                    ApplicationManager.invokeService('page.main.deletePage', serviceConfig);
                                }
                            },
                            {
                                btnCls: "bb5-context-menu-copy",
                                btnLabel: Translator.translate('copy'),
                                btnCallback: function () {
                                    jQuery('.action-selected').removeClass('action-selected');
                                    jQuery(self.currentEvent.node.element).addClass('action-selected');
                                    self.copied_node = self.currentEvent.node;
                                    self.cuted_node = undefined;
                                }
                            },
                            {
                                btnCls: "bb5-context-menu-paste",
                                btnLabel: Translator.translate('paste'),
                                btnCallback: function () {
                                    jQuery('.action-selected').removeClass('action-selected');
                                    self.doPaste('inside');
                                }
                            },
                            {
                                btnCls: "bb5-context-menu-paste-before",
                                btnLabel: Translator.translate('paste_before'),
                                btnCallback: function () {
                                    jQuery('.action-selected').removeClass('action-selected');
                                    self.doPaste('before');
                                }
                            },
                            {
                                btnCls: "bb5-context-menu-paste-after",
                                btnLabel: Translator.translate('paste_after'),
                                btnCallback: function () {
                                    jQuery('.action-selected').removeClass('action-selected');
                                    self.doPaste('after');
                                }
                            },
                            {
                                btnCls: "bb5-context-menu-cut",
                                btnLabel: Translator.translate('cut'),
                                btnCallback: function () {
                                    jQuery('.action-selected').removeClass('action-selected');
                                    jQuery(self.currentEvent.node.element).addClass('action-selected');
                                    self.cuted_node = self.currentEvent.node;
                                    self.copied_node = undefined;
                                }
                            },
                            {
                                btnCls: "bb5-context-menu-flyto",
                                btnLabel: Translator.translate('browse_to'),
                                btnCallback: function () {
                                    jQuery(location).attr('href', self.currentEvent.node.uri);
                                }
                            }
                        ]
                    };

                this.handlePopInMenu(config);
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

            loadTreeRoot: function () {
                this.view.loadTreeRoot();
            },
            /**
             * Render the template into the DOM with the ViewManager
             * @returns {Object} PageViewClone
             */
            render: function () {
                var self = this;
                this.view.getTree().done(function (tree) {
                    tree.display();
                    if (self.autoLoadRoot) {
                        self.loadTreeRoot();
                    }
                });

                return this;
            }
        });

        return PageViewTreeContribution;
    }
);
