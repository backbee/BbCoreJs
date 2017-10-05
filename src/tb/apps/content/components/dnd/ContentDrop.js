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
    'app.content/components/dnd/ContentDrop',
    [
        'Core',
        'jquery',
        'component!notify',
        'component!translator',
        'content.container',
        'content.manager',
        'resource.repository',
        'Core/ApplicationManager',
        'component!mask',
        'jsclass'
    ],
    function (Core,
              jQuery,
              Notify,
              Translator,
              ContentContainer,
              ContentManager,
              ResourceRepository,
              ApplicationManager,
              Mask
            ) {

        'use strict';

        return new JS.Class({

            bindEvents: function (Manager) {

                this.manager = Manager;

                Core.Mediator.subscribe('on:classcontent:drop', this.onDrop, this);
            },

            unbindEvents: function () {
                Core.Mediator.unsubscribe('on:classcontent:drop', this.onDrop);
            },

            removeImgWrap: function () {
                var img = jQuery('[data-bb-identifier^="Element/Image"]'),
                    current;

                img.removeClass('bb-dnd');
                img.attr('dropzone', false);
                img.css('opacity', '1');

                img.each(function () {
                    current = jQuery(this);

                    if (current.parent().hasClass('img-wrap-dnd')) {
                        current.unwrap('<div class="img-wrap-dnd">');
                    }
                });
            },

            handleDropMedia: function (event) {
                var file = event.dataTransfer.files[0],
                    content = ContentManager.getContentByNode(jQuery(event.target)),
                    mask = Mask.createMask(),
                    maskTarget = content.jQueryObject.parent().parent(),
                    dropContext = {
                        hasListener: false,
                        process: this.doDropMedia.bind(this, event, file),
                        content: content
                    };

                mask.mask(maskTarget);

                Core.Mediator.publish('on:classcontent:beforedropmedia', dropContext);

                if (!dropContext.hasListener) {
                    this.doDropMedia(event, file);
                }
            },

            doDropMedia: function (event, file) {
                var target = jQuery(event.target),
                    reader = new window.FileReader(),
                    content = ContentManager.getContentByNode(target),
                    mask = Mask.createMask(),
                    maskTarget = content.jQueryObject.parent().parent(),
                    self = this;

                reader.addEventListener('loadend', function () {
                    var i, binary = '',
                        bytes = new Uint8Array(reader.result),
                        length = bytes.byteLength,
                        data = {},
                        config = {
                            updateCurrent: true
                        },
                        elements = {};

                    for (i = 0; i < length; i = i + 1) {
                        binary += String.fromCharCode(bytes[i]);
                    }

                    data = {
                        'src': window.btoa(binary),
                        'originalname': file.name
                    };

                    ResourceRepository.upload(data).done(function (response) {

                        config.path = response.path;
                        config.originalname = response.originalname;

                        Core.Mediator.publish('on:classcontent:afterdropmedia', content, file, config);

                        if (config.updateCurrent) {
                            elements.path = response.path;
                            elements.originalname = response.originalname;
                            content.setElements(elements);

                            self.removeImgWrap();
                            ApplicationManager.invokeService('content.main.save', true).done(function (promise) {

                                promise.done(function () {

                                    content.getParent().refresh().done(function () {
                                        mask.unmask(maskTarget);
                                        content.jQueryObject.unwrap();
                                    });

                                });
                            });
                        }
                    });
                });

                reader.readAsArrayBuffer(file);
            },

            onDrop: function (event) {
                event.preventDefault();

                if (event.dataTransfer.files.length > 0) {

                    this.handleDropMedia(event);

                    return;
                }

                var target = jQuery(event.target),
                    config = {},
                    parent = target.parents(this.manager.droppableClass + ':first'),
                    parentObjectIdentifier = ContentManager.retrievalObjectIdentifier(parent.data(this.manager.identifierDataAttribute)),
                    mask = require('component!mask').createMask(),
                    saveFunc = function () {
                        mask.unmask(config.parent.jQueryObject);
                    },
                    parentConfig = parentObjectIdentifier;

                parentConfig.jQueryObject = parent;

                if (target.get(0).nodeName === 'IMG') {

                    target.removeClass('bb-dnd');
                    target.removeAttr('dropzone');
                    target.css('opacity', '1');

                    Notify.warning(Translator.translate('only_picture_allowed'));

                    return;
                }

                config.event = event;

                config.position = this.manager.getPosition(target, parent);
                config.parent = ContentManager.buildElement(parentObjectIdentifier);
                config.type = this.manager.dataTransfer.content.type;

                mask.mask(config.parent.jQueryObject);

                if (config.parent.accept(config.type)) {
                    if (this.manager.dataTransfer.isNew === true) {
                        this.addContent(config).done(function () {
                            saveFunc();
                        });
                    } else {
                        this.updateContent(config).done(function () {
                            saveFunc();
                        });
                    }
                }
            },

            /**
             * Used into a drop event.
             * Verify if current contentset accept the content, create the content
             * from api and show him on the html
             * @param {Object} config
             */
            addContent: function (config) {
                var dfd = jQuery.Deferred();

                ContentManager.createElement(config.type).then(
                    function (content) {
                        config.parent.append(content, config.position).done(function () {
                            dfd.resolve();
                        });
                    },
                    function () {
                        Notify.error('An error occured when drop a new content');
                    }
                );

                return dfd.promise();
            },

            /**
             * Used into a drop event.
             * Move the content to a new contentset
             * and set updated old contentset
             * @param {Object} config
             */
            updateContent: function (config) {
                var dfd = jQuery.Deferred(),
                    content = ContentContainer.find(this.manager.dataTransfer.content.id),
                    oldParent = content.jQueryObject.parents('.' + this.manager.contentClass + ':first'),
                    oldParentAsContent;

                oldParentAsContent = ContentManager.getContentByNode(oldParent);

                config.parent.append(content, config.position).done(function () {
                    oldParentAsContent.setUpdated(true);
                    dfd.resolve();
                });

                return dfd.promise();
            }
        });
    }
);