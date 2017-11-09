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

        'text!user/templates/right/table.item.blocks.twig'
    ],
    function (Backbone, jQuery, Renderer, require) {

        "use strict";

        return Backbone.View.extend({

            /**
             * Initialize
             *
             * @param params
             */
            initialize: function (params) {

                this.component = 'blocks';
                this.repository = require('user/repository/right.repository');
                this.tpl = require('text!user/templates/right/table.item.blocks.twig');
                this.mainTpl = params.mainTpl;
                this.groupId = params.groupId;
                this.defaultRights = params.defaultRights;
                this.sumOfMask = params.sumOfMask;
            },

            /**
             * Bind items
             *
             * @return {Object} Deferred's promise object
             */
            buildItems: function () {

                var self = this,
                    dfd = jQuery.Deferred();

                this.repository.findBlocks(this.groupId).then(function (blocks) {

                    var i,
                        objects = blocks.objects,
                        render = [],
                        results = [],
                        renderParams = {};

                    for (i = 0; i < objects.length; i = i + 1) {

                        renderParams = {
                            item: objects[i],
                            rights: objects[i].rights,
                            parent: blocks.parent,
                            defaultRights: self.defaultRights,
                            sumOfMask : self.sumOfMask
                        };

                        render[i] = Renderer.render(self.tpl, renderParams);
                    }

                    results.parent = blocks.parent;
                    results.objects = render;

                    dfd.resolve(results);
                });

                return dfd.promise();
            },

            /**
             * Handle all item change
             * @param e
             */
            handleAllItemChange: function (e) {

                e.preventDefault();

                var target = e.target,
                    row = jQuery(target).closest('tr'),
                    name = jQuery(target).attr('name'),
                    checkboxes = 'td input:checkbox[name!="none"]',
                    noneCheckboxes = 'td input:checkbox[name="none"]',
                    selector,
                    disabled;

                if ('all' === name) {

                    selector = row.find(checkboxes);
                    disabled = row.find(noneCheckboxes);

                } else if ('none' === name) {

                    if (target.checked) {
                        row.addClass('none');
                    } else {
                        row.removeClass('none');
                    }

                    selector = row.find(noneCheckboxes);
                    disabled = row.find(checkboxes);
                }

                jQuery(selector).prop('checked', target.checked);
                jQuery(disabled).prop('disabled', target.checked).prop('checked', false);
            },

            /**
             * Get permissions
             *
             * @returns {Object}
             */
            getPermissions: function (mainContainer) {

                var self = this,
                    rights = [];

                mainContainer.find('tbody tr').filter(':has(:checkbox:checked)').each(function () {

                    var row = jQuery(this),
                        mask = parseInt(row.attr('data-mask'), 10);

                    if (0 !== mask || row.hasClass('none')) {

                        rights.push({
                            'mask' : mask,
                            'object_class' : (!row.hasClass('all-items')) ? row.attr('data-class') : row.parents('tbody').attr('data-class'),
                            'sid' : self.groupId
                        });
                    }
                });

                return rights;
            },

            /**
             * Handle click category
             * @param e
             */
            handleClickCategory: function (e) {

                e.preventDefault();

                var category = jQuery(e.target).parents('tr').data('block'),
                    angle = jQuery(e.target).find('i.fa');

                jQuery('tr[data-class="' + category + '"], tr[data-parent="' + category + '"]').fadeToggle(200);

                if (angle.hasClass('fa-angle-down')) {
                    angle.removeClass('fa-angle-down').addClass('fa-angle-up');
                } else {
                    angle.removeClass('fa-angle-up').addClass('fa-angle-down');
                }
            },

            /**
             * Bind events
             */
            bindEvents: function (mainContainer) {

                mainContainer.find('tr.blocks:not(.all-items)').hide();

                mainContainer.off('click.category').on(
                    'click.category',
                    'tr.category',
                    this.handleClickCategory.bind(this)
                );

                mainContainer.off('change.all-item').on(
                    'change.all-item',
                    '.blocks input',
                    this.handleAllItemChange.bind(this)
                );
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