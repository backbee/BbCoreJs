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
        'jquery',
        'Core',
        'user/controllers/dnd.controller',
        'component!dnd',
        'component!popin',
        'component!translator',
        'text!user/templates/popin.twig'
    ],
    function (require, jQuery, Core, DnDController, dnd) {
        'use strict';
        var trans = Core.get('trans') || function (value) {return value; },
            parent;

        /**
         * View of new page
         * @type {Object} Backbone.View
         */
        return Backbone.View.extend({

            popin_config: {
                id: 'user-popin-picker',
                width: window.innerWidth,
                top: 180,
                height: window.innerHeight - 150,
                closeOnEscape: false,
                draggable: false,
                open: function () {
                    parent = jQuery(this).parent('.ui-dialog:first');
                    parent.css({
                        top: 150
                    });
                    parent.find(".ui-dialog-titlebar-close").hide();
                }
            },

            usersAreaId: 'user-list',
            groupsAreaId: 'group-list',

            /**
             * Initialize of PageViewEdit
             */
            initialize: function () {
                this.display();
            },

            display: function () {
                this.popinManager = require('component!popin');
                this.popin = this.popinManager.createPopIn(this.popin_config);
                this.popin.setContent(require('text!user/templates/popin.twig'));
                this.popin.display();
                dnd('#toolbar-user-group-popin').addListeners('user');

                jQuery(window).resize(function () {
                    parent.css({
                        width: window.innerWidth,
                        height: window.innerHeight - 150
                    });
                });

                this.bindDnD();
            },

            bindDnD: function () {
                var data = {
                    inDropZone: false,
                    popin: this,
                    user: 0,
                    group: 0
                };

                Core.Mediator.subscribe('on:user:dragstart', DnDController.dragStart, data);
                Core.Mediator.subscribe('on:user:dragenter', DnDController.dragEnter, data);
                Core.Mediator.subscribe('on:user:dragleave', DnDController.dragLeave, data);
                Core.Mediator.subscribe('on:user:dragover', DnDController.dragOver, data);
                Core.Mediator.subscribe('on:user:drop', DnDController.drop, data);
                Core.Mediator.subscribe('on:user:dragend', DnDController.dragEnd, data);
            },

            unbindDnD: function () {
                Core.Mediator.unsubscribe('on:user:dragstart', DnDController.dragStart);
                Core.Mediator.unsubscribe('on:user:dragenter', DnDController.dragEnter);
                Core.Mediator.unsubscribe('on:user:dragleave', DnDController.dragLeave);
                Core.Mediator.unsubscribe('on:user:dragover', DnDController.dragOver);
                Core.Mediator.unsubscribe('on:user:drop', DnDController.drop);
                Core.Mediator.unsubscribe('on:user:dragend', DnDController.dragEnd);
            },

            bindUsers: function () {
                var class_name = '.bb5-list-users-item',
                    self = this;

                jQuery(class_name).click(function () {
                    var parent_class = '.bb5-manage-user',
                        user = jQuery(this).find(parent_class),
                        open = 'open';
                    if (user.hasClass(open)) {
                        user.removeClass(open);
                    } else {
                        jQuery(class_name + ' ' + parent_class + '.' + open).removeClass(open);
                        user.addClass(open);
                    }
                });

                jQuery(class_name + ' .btn-edit').click(function () {
                    var user = jQuery(this).parent().attr('data-user');
                    Core.ApplicationManager.invokeService('user.user.edit', self, user);
                });

                jQuery(class_name + ' .btn-delete').click(function () {
                    var user = jQuery(this).parent().attr('data-user');
                    Core.ApplicationManager.invokeService('user.user.delete', self, user);
                });

                jQuery(class_name + ' .bb5-button-selector a').click(function (event) {
                    event.stopPropagation();
                    event.preventDefault();

                    var clicked = jQuery(this),
                        user = {
                            id: clicked.parents('.bb5-manage-user:first').data('user'),
                            activated: false
                        };

                    clicked.parent().find('.bb-toggle-status').text(function () {
                        var args = Array.prototype.slice.call(arguments),
                            activated = args[1];

                        if (activated === trans('active')) {
                            return trans('inactive');
                        }
                        user.activated = true;
                        return trans('active');
                    });
                    Core.ApplicationManager.invokeService('user.user.updateStatus', self, user);
                });
            },

            bindGroups: function () {
                var self = this;

                jQuery('.bb5-manage-group-create button.button-create-group').click(function () {
                    Core.ApplicationManager.invokeService('user.group.new', self);
                });

                jQuery('#group-list .btn-action').click(function () {
                    var clicked = jQuery(this),
                        action = clicked.attr('data-action'),
                        id = clicked.parent().attr('data-group');
                    Core.ApplicationManager.invokeService('user.group.' + action, self, id);
                });
            },

            /**
             * Render the template into the DOM with the ViewManager
             * @returns {Object} PageViewEdit
             */
            addUsers: function (user_list) {
                jQuery('#' + this.usersAreaId).html(user_list);
                this.bindUsers();
            },

            addGroups: function (group_list) {
                jQuery('#' + this.groupsAreaId).html(group_list);
                this.bindGroups();
            }
        });
    }
);