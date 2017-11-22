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
    'app.content/components/dnd/ContentDrag',
    [
        'Core',
        'content.manager',
        'content.container',
        'jquery',
        'jsclass'
    ],
    function (Core,
              ContentManager,
              ContentContainer,
              jQuery
            ) {

        'use strict';

        return new JS.Class({

            bindEvents: function (Manager) {
                Core.Mediator.subscribe('on:classcontent:dragstart', this.onDragStart, Manager);
            },

            unbindEvents: function () {
                Core.Mediator.unsubscribe('on:classcontent:dragstart', this.onDragStart);
            },

            /**
             * Event trigged on start drag content
             * @param {Object} event
             */
            onNewContentDragStart: function (event) {
                var target = jQuery(event.target);

                this.dataTransfer.content = {type: target.data(this.typeDataAttribute)};
            },

            /**
             * Event trigged on start drag content
             * @param {Object} event
             */
            onDragStart: function (event) {
                event.stopPropagation();

                var target = jQuery(event.target),
                    img,
                    content;

                this.dataTransfer.isNew = false;
                if (target.data(this.typeDataAttribute)) {
                    this.dataTransfer.isNew = true;
                    content = {type: target.data(this.typeDataAttribute)};
                } else {
                    content = ContentManager.getContentByNode(target.parents('.' + this.contentClass + ':first'));

                    img = document.createElement('img');
                    img.src = content.definition.image;

                    if (typeof event.dataTransfer.setDragImage === 'function') {
                        event.dataTransfer.setDragImage(img, 25, 25);
                    }
                }

                this.dataTransfer.content = content;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text', 'draging-content');

                ContentManager.buildContentSet();

                this.dataTransfer.contentSetDroppable = ContentContainer.findContentSetByAccept(content.type);

                setTimeout(
                    this.showHTMLZoneForContentSet.bind(this),
                    10,
                    this.dataTransfer.contentSetDroppable,
                    this.dataTransfer.content.id,
                    this.dataTransfer.content.type
                );
                setTimeout(
                    this.showScrollZones.bind(this),
                    100
                );
            }
        });
    }
);