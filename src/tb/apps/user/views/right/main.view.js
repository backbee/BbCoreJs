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
        'Core',
        'BackBone',
        'require',
        'Core/Utils',
        'jquery',

        'component!mask',
        'component!notify',
        'component!translator',

        'text!user/templates/right/table.twig'
    ],

    function (Core, Backbone, require, Utils, jQuery, Mask, Notify, Translator) {

        'use strict';

        return Backbone.View.extend({

            /**
             * Initialize.
             *
             * @param params
             */
            initialize: function (params) {

                var trans = Core.get('trans') || function (value) { return value; };

                this.defaultRights = {
                    none: 0,
                    all: 0,
                    view : 1,
                    create : 2,
                    edit : 4,
                    delete : 8
                };

                this.availableComponents = {
                    workflow: 'workflow',
                    layout: 'layout',
                    pages: 'pages',
                    blocks: 'blocks',
                    bundles: 'bundles',
                    media: 'media'
                };

                this.configPopin = {
                    id: 'id-main-right-popin',
                    title: trans('rights_management'),
                    width: '100%',
                    top: 180,
                    height: window.innerHeight,
                    closeOnEscape: false,
                    draggable: false
                };

                this.mainTpl = require('text!user/templates/right/table.twig');
                this.repository = require('user/repository/right.repository');
                this.groupId = params.group.id;

                this.sumOfMask = 0;
                this.calculateSumOfMask();

                this.instances = {};
                this.currentComponent = null;
                this.popin = params.popin.popinManager.createPopIn(this.configPopin);
                this.template = jQuery(params.template) || '';
                this.mainContainer = this.template.find('.main-container:first');
                this.maskManager = Mask.createMask({});
                this.popin.setContent(this.template, true);
                this.bindEvents();
            },

            /**
             * Calculate sum of mask for available mask
             */
            calculateSumOfMask: function () {

                var sum = 0,
                    i;

                for (i in this.defaultRights) {
                    if (this.defaultRights.hasOwnProperty(i)) {
                        sum += this.defaultRights[i];
                    }
                }

                this.sumOfMask = sum;
            },

            /**
             * Bind events.
             */
            bindEvents: function () {

                var self = this;

                // Menu item
                this.template.on('click', '.right-btn', function (e) {
                    // Set component
                    self.selectButton(e.target);
                    var component = jQuery(e.target).data('component');
                    self.setComponent(component);
                });
            },

            /**
             * Handle on save.
             */
            handleOnSave: function (e) {

                e.preventDefault();

                var self = this,
                    permissions = [],
                    saveHandler;

                // Calculates mask
                this.calculatesMask();

                // Get permissions
                if (typeof this.currentComponent.getPermissions === 'function') {
                    permissions = this.currentComponent.getPermissions(this.mainContainer);
                } else {
                    permissions = this.getPermissions();
                }

                // Save
                if (typeof self.currentComponent.saveHandler === 'function') {
                    saveHandler = self.currentComponent.saveHandler(permissions);
                } else {
                    saveHandler = self.saveHandler(permissions);
                }

                // Notify
                saveHandler.done(function () {
                    Notify.success(Translator.translate('right_save_success'));
                });
            },

            /**
             * Get all classes.
             *
             * @returns {Array}
             */
            getAllClasses: function () {

                var container =  this.mainContainer.find('tbody'),
                    classes = [];

                container.find('tr[data-class]').each(function () {
                    classes.push(jQuery(this).data('class'));
                });

                if (container.data('class')) {
                    classes.push(container.data('class'));
                }

                return classes;
            },

            /**
             * Clear access handler.
             */
            clearAccessHandler: function () {

                var dfd = jQuery.Deferred();

                this.repository.clearPermissions(this.groupId, this.getAllClasses()).then(function () {
                    dfd.resolve(true);
                });

                return dfd.promise();
            },

            /**
             * Save handler.
             *
             * @param permissions
             */
            saveHandler: function (permissions) {

                var dfd = jQuery.Deferred();

                this.repository.savePermissions(permissions).then(function () {
                    dfd.resolve(true);
                });

                return dfd.promise();
            },

            /**
             * Handle on clear all.
             */
            handleOnClearAll: function () {

                var target = this.mainContainer.find('tbody tr');
                target.find('input:checkbox').prop('checked', false).prop('disabled', false);
                target.attr('mask', 0);
            },

            /**
             * Calculates mask by row.
             */
            calculatesMask: function () {

                var classRow = this.mainContainer.find('tbody tr.all-items'),
                    objectRows = this.mainContainer.find('tbody tr:not(.all-items)'),
                    classMask = 0;

                // By class
                classRow.find('td input:checked:not(:disabled)').each(function () {
                    classMask += parseInt(jQuery(this).val(), 10);
                });

                classRow.attr('data-mask', classMask);

                // By object
                objectRows.each(function () {

                    var row = jQuery(this),
                        objectMask = 0,
                        parentMaskClass = parseInt(classRow.attr('data-mask'), 10) || 0;

                    row.find('td input:checked:not(:disabled)').each(function () {
                        objectMask += parseInt(jQuery(this).val(), 10);
                    });

                    objectMask = objectMask - parentMaskClass;

                    row.attr('data-mask', (objectMask < 0) ? 0 : objectMask);
                });
            },

            /**
             * Get permissions.
             *
             * @returns {Array}
             */
            getPermissions: function () {

                var self = this,
                    rights = [];

                this.mainContainer.find('tbody tr').each(function () {

                    var row = jQuery(this),
                        mask = parseInt(row.attr('data-mask'), 10),
                        componentName = self.currentComponent.component,
                        item = {};

                    item.sid = self.groupId;
                    item.object_class = row.parents('tbody').attr('data-class');

                    if (!row.hasClass('all-items')) {
                        item.object_id = item.object_class + '(' + ('blocks' === componentName ? row.data('class') : row.data('uid')) + ')';
                    }

                    if (0 !== mask || row.hasClass('none')) {

                        item.mask = mask;
                    }

                    rights.push(item);
                });

                return rights;
            },

            /**
             * Handle checkboxes change.
             */
            handleCheckboxesChange: function (e) {

                e.preventDefault();

                var target = e.target,
                    row = jQuery(target).closest('tr'),
                    name = jQuery(target).attr('name'),
                    checkboxes = 'td input:checkbox[name!="none"]',
                    noneCheckboxes = 'td input:checkbox[name="none"]',
                    selector,
                    disabled;

                if ('all' === name) {

                    selector = (row.hasClass('all-items')) ? checkboxes : 'tr[data-uid="' + row.data('uid') + '"] ' + checkboxes;
                    disabled = (row.hasClass('all-items')) ? noneCheckboxes : 'tr[data-uid="' + row.data('uid') + '"] ' + noneCheckboxes;

                    jQuery(selector).prop('checked', target.checked).prop('disabled', false);
                    jQuery(disabled).prop('disabled', target.checked).prop('checked', false);

                } else if ('none' === name) {

                    selector = (row.hasClass('all-items')) ? noneCheckboxes : 'tr[data-uid="' + row.data('uid') + '"] ' + noneCheckboxes;
                    disabled = (row.hasClass('all-items')) ? checkboxes : 'tr[data-uid="' + row.data('uid') + '"] ' + checkboxes;

                    if (target.checked) {
                        row.addClass('none');
                    } else {
                        row.removeClass('none');
                    }

                    jQuery(selector).prop('checked', target.checked).prop('disabled', false);
                    jQuery(disabled).prop('disabled', target.checked).prop('checked', false);

                } else {

                    if (row.hasClass('all-items')) {
                        jQuery('input:checkbox[name="all"]').prop('checked', false);
                        jQuery('input:checkbox[name="' + name + '"]:not(:disabled)').prop('checked', target.checked);
                        jQuery('input:checkbox[name="' + name + '"]:not(:disabled)').closest('tr').removeClass('none');

                    } else {
                        row.find('input:checkbox[name="all"]').prop('checked', false);
                    }
                }
            },

            /**
             * Handle checkboxes on load.
             */
            handleCheckboxesLoad: function () {

                this.mainContainer.find('tbody tr').filter(':has(:checkbox:checked)').each(function () {
                    var row = jQuery(this),
                        mask = row.data('mask'),
                        selector = row.find('td input:checkbox[name!="none"]');

                    if (0 === mask) {

                        if (row.data('uid')) {

                            selector = jQuery('tr[data-uid="' + row.data('uid') + '"] td input:checkbox[name!="none"]');
                        }

                        selector.prop('disabled', true).prop('checked', false);
                        row.addClass('none');
                    }
                });
            },

            /**
             * Bind events component.
             */
            bindEventsComponent: function () {

                this.mainContainer.off('change.checkboxes').on(
                    'change.checkboxes',
                    'table tr input',
                    jQuery.proxy(this.handleCheckboxesChange, this)
                );

                this.mainContainer.off('click.save').on(
                    'click.save',
                    'button.btn-save',
                    jQuery.proxy(this.handleOnSave, this)
                );

                this.mainContainer.off('click.clear').on(
                    'click.clear',
                    'button.btn-clear-all',
                    jQuery.proxy(this.handleOnClearAll, this)
                );

                this.handleCheckboxesLoad();
            },

            /**
             * Select button
             *
             * @param button
             * @returns {boolean}
             */
            selectButton: function (button) {

                if (jQuery(button).hasClass('btn-primary')) {
                    return false;
                }

                jQuery(button).closest('.right-nav-list').find('.active').removeClass('active');
                jQuery(button).addClass('active');
            },

            /**
             * Set Component
             *
             * @param componentName
             */
            setComponent: function (componentName) {

                var self = this,
                    componentPath,
                    currentKey,
                    componentParams = {};

                currentKey = this.availableComponents[componentName] || null;

                if (currentKey === null) {
                    throw "ComponentNotFoundException";
                }

                componentPath = 'user/views/right/' + componentName + '.view';

                componentParams = {
                    groupId: this.groupId,
                    mainTpl: this.mainTpl,
                    defaultRights: this.defaultRights,
                    sumOfMask: this.sumOfMask
                };

                Utils.requireWithPromise([componentPath]).done(function (ComponentView) {

                    self.currentComponent = new ComponentView(componentParams);
                    self.render();

                }).fail(function () {
                    console.log(arguments);
                });
            },

            /**
             * Render
             */
            render: function () {

                var self = this;

                if (!this.currentComponent) {
                    throw "ComponentNotFoundException";
                }

                if (typeof this.currentComponent.render !== 'function') {
                    throw "RenderNotFoundException";
                }

                this.maskManager.mask(this.mainContainer);

                self.currentComponent.render().done(function (render) {

                    self.mainContainer.html(render);

                    self.maskManager.unmask(self.mainContainer);

                    // Bind events component
                    self.bindEventsComponent();

                    if (typeof self.currentComponent.bindEvents === 'function') {
                        self.currentComponent.bindEvents(self.mainContainer);
                    }
                });

                this.popin.display();
            }
        });
    }
);