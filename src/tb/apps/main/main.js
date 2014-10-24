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
require.config({
    paths: {
        'main.routes': 'src/tb/apps/main/routes',
        'main.controller': "src/tb/apps/main/controllers/main.controller",

        //Templates
        'main/tpl/toolbar': 'src/tb/apps/main/templates/toolbar.twig',

        //Views
        'main.view.index': 'src/tb/apps/main/views/main.view.index'
    }
});

define('app.main', ['tb.core', 'main.view.index', 'jquery'], function (core, MainViewIndex, jQuery) {

    'use strict';

    /**
     * Main application defining default templates and themes
     */
    core.ApplicationManager.registerApplication('main', {

        /**
         * occurs on initialization of main application
         */
        onInit: function () {
            this.config = {
                tbSelector: '#bb5-ui'
            };

            if (!jQuery(this.config.tbSelector).length) {
                throw 'Selector "' + this.config.tbSelector + '" does not exists, MainApplication cannot be initialized.';
            }

            core.set('application.main', this);

            console.log(' MainApplication is initialized ');
        },

        /**
         * occurs on start of main application
         */
        onStart: function () {
            var view = new MainViewIndex(this.config);
            view.render();

            console.log(' MainApplication onStart...');
        },

        /**
         * occurs on stop of main application
         */
        onStop: function () {
            console.log(' MainApplication onStop...');
        },

        /**
         * occurs on error of main application
         */
        onError: function () {
            console.log(' MainApplication onError...');
        }
    });
});
