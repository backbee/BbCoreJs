/*
* Copyright (c) 2011-2013 Lp digital system
*
* This file is part of BackBee.
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
* along with BackBee. If not, see <http://www.gnu.org/licenses/>.
*///'user/views/right/main.view'

define(
    [
        'Core',
        'user/views/right/main.view',
        'text!user/templates/right/main.twig',
        'jquery'
    ],

    function (Core, MainRightView, tpl) {

        'use strict';

        /**
         * Register controller
         */
        Core.ControllerManager.registerController('RightController', {

            appName: 'user',

            config: {
                import: {}
            },

            /**
             * Initialization
             */
            onInit: function () {
                this.app = Core.get('application.user');
            },

            /**
             * Index action
             * @returns {boolean}
             */
            indexAction: function () {
                this.mainView = new MainRightView({'template': tpl});
                this.app.rightView = this.mainView;
                this.mainView.setComponent('layout');
                return true;
            }
        });
    }
);