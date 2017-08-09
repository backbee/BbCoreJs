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
        'Core/ApplicationManager',
        'Core',
        'Core/Renderer',
        'jquery',
        'content.models.Content',
        'content.models.ContentSet',
        'definition.manager',
        'content.container',
        'content.repository',
        'text!content/tpl/dropzone',
        'component!mask',
        'jsclass'
    ],
    function (ApplicationManager,
              Core,
              Renderer,
              jQuery,
              Content,
              ContentSet,
              DefinitionManager,
              ContentContainer,
              ContentRepository,
              dropZoneTemplate
            ) {

        'use strict';

        var ContentManager = new JS.Class({

            contentClass: 'bb-content',
            identifierDataAttribute: 'bb-identifier',
            dropZoneClass: 'bb-dropzone',
            idDataAttribute: 'bb-id',
            droppableClass: '.bb-droppable',
            imageClass: 'Element/Image',
            defaultPicturePath: require.toUrl('html/img/filedrop.png'),
            contentSelectedClass: 'bb-content-selected',
            TARGET_SELF: 'self',
            TARGET_PARENT: 'parent',

            initialize: function () {
                this.maskMng = require('component!mask').createMask({});
            },
            /**
             * Search all contentset with dragzone="true" attribute
             * and dont have data-bb-id attribute for build element
             */
            buildContentSet: function () {
                var self = this,
                    dropzone = jQuery(this.droppableClass).not('[data-' + this.idDataAttribute + ']');

                dropzone.each(function () {
                    var currentTarget = jQuery(this);

                    if (currentTarget.hasClass(self.contentClass)) {
                        ContentContainer.addContent(self.getContentByNode(currentTarget));
                    }
                });
            },

            addDefaultZoneInContentSet: function (active) {

                this.buildContentSet();

                var contentSets = ContentContainer.findContentSetByAccept(),
                    div,
                    contentSet,
                    hasChildren,
                    key,
                    currentZone,
                    parent,
                    config;

                for (key in contentSets) {
                    if (contentSets.hasOwnProperty(key)) {
                        contentSet = contentSets[key];

                        if (contentSet.jQueryObject instanceof jQuery) {
                            parent = contentSet.getParent();
                            hasChildren = contentSet.jQueryObject.children().not('.content-actions').not('.' + this.dropZoneClass).length > 0;
                            currentZone = contentSet.jQueryObject.find('.without-children');
                            config = {
                                'class': this.dropZoneClass + ' without-children',
                                'label': (parent !== null) ? (parent.getLabel() + ' > ' + contentSet.getLabel()) : contentSet.getLabel()
                            };

                            if (active === false) {
                                if (currentZone.length > 0) {
                                    currentZone.remove();
                                }
                            } else {
                                if (hasChildren === false) {
                                    div = Renderer.render(dropZoneTemplate, config);
                                    contentSet.jQueryObject.html(div);
                                }
                            }
                        }
                    }
                }
            },

            getAllAttributes: function (node) {
                var attr = {};

                jQuery(node).each(function () {
                    jQuery.each(this.attributes, function () {
                        if (this.specified) {
                            attr[this.name] = this.value;
                        }
                    });
                });

                return attr;
            },

            putAttributes: function (node, attributes) {
                var key;

                for (key in attributes) {
                    if (attributes.hasOwnProperty(key)) {
                        node.attr(key, attributes[key]);
                    }
                }
            },

            isUsable: function (type) {
                var contents = Core.config('unclickable_contents:contents'),
                    result = true;

                if (contents !== undefined) {
                    if (contents.indexOf(type) !== -1) {
                        result = false;
                    }
                }

                return result;
            },

            getEventTargetRule: function (type) {
                var targetRule = this.TARGET_SELF,
                    rules = Core.config('contents_events:rules'),
                    self = this,
                    currentRule;

                if (rules !== undefined) {
                    jQuery.each(rules, function (i) {
                        currentRule = rules[i];
                        if (currentRule.hasOwnProperty('type') && type === currentRule.type) {
                            targetRule = [self.TARGET_SELF, self.TARGET_PARENT].indexOf(currentRule.target) !== -1 ? currentRule.target : self.TARGET_SELF;
                            return true;
                        }

                    });
                }

                return targetRule;
            },

            /**
             * Create new element from the API
             * @param {String} type
             * @returns {Promise}
             */
            createElement: function (type, data) {
                var self = this,
                    dfd = jQuery.Deferred();

                ContentRepository.save({'type': type, 'data': data}).done(function (data, response) {
                    var resourceUID = response.getHeader('BB-RESOURCE-UID') || response.getHeader('bb-resource-uid');
                    dfd.resolve(self.buildElement({'type': type, 'uid': resourceUID}));

                    return data;
                });

                return dfd.promise();
            },

            /**
             * Build a content/contentSet element according to the definition
             * @param {Object} event
             * @returns {Object}
             */
            buildElement: function (config) {
                var content = null,
                    objectIdentifier = this.buildObjectIdentifier(config.type, config.uid),
                    element = config.jQueryObject,
                    allowedAttributes = [],
                    id,
                    key;

                if (objectIdentifier !== undefined) {

                    if (element instanceof jQuery) {
                        if (element.data('bb-id')) {
                            id = element.data('bb-id');
                        }
                    }

                    if (id) {
                        content = ContentContainer.find(id);
                    }

                    if (null === content) {

                        config.definition = DefinitionManager.find(config.type);
                        config.jQueryObject = element;

                        if (config.definition !== null) {
                            if (config.definition.properties.is_container) {
                                content = new ContentSet(config);
                            } else {
                                content = new Content(config);
                            }
                        }

                        ContentContainer.addContent(content);
                    }

                    if (undefined !== config.elementData) {
                        if (undefined === content.data) {
                            allowedAttributes = [
                                'elements',
                                'extra',
                                'image',
                                'label',
                                'parameters',
                                'type',
                                'uid'
                            ];

                            content.data = {};
                            for (key in config.elementData) {
                                if (config.elementData.hasOwnProperty(key)) {
                                    if (-1 !== allowedAttributes.indexOf(key)) {
                                        content.data[key] = config.elementData[key];
                                    }
                                }
                            }
                        }
                    }
                }

                return content;
            },

            /**
             * Remove the content from dom and Content container
             * and change state of parent to updated
             * @param {Object} content
             * @returns {undefined}
             */
            remove: function (content) {
                if (typeof content === 'object') {
                    var parent = content.getParent();

                    if (typeof parent === 'object') {
                        parent.setUpdated(true);
                    }

                    content.jQueryObject.remove();
                    ContentContainer.remove(content);

                    parent.select();

                    this.addDefaultZoneInContentSet(true);
                }
            },

            replaceWith: function (oldContent, newContent) {
                /* elements */
                var elementInfos = {},
                    renderModeParam =  oldContent.getParameters('rendermode'),
                    renderMode = (renderModeParam !== undefined) ? renderModeParam.value : undefined,
                    oldContentParent = oldContent.getParent(),
                    oldContentHtml = oldContent.jQueryObject,
                    self = this;

                this.maskMng.mask(oldContentHtml);

                newContent.getHtml(renderMode).done(function (html) {
                    self.refreshImages(html);

                    jQuery(oldContentHtml).replaceWith(html);
                    oldContentParent.getData("elements").done(function (elements) {
                        jQuery.each(elements, function (key, data) {
                            if (data.uid === oldContent.uid) {
                                elementInfos[key] = { uid: newContent.uid, type: newContent.type };
                            } else {
                                elementInfos[key] = data;
                            }
                        });
                        oldContentParent.setElements(elementInfos);

                        ApplicationManager.invokeService('content.main.save', true);

                    }).always(function () {
                        self.maskMng.unmask(oldContentHtml);
                    });
                }).always(function () {
                    self.maskMng.unmask(oldContentHtml);
                });
            },


            /**
             * Retrieve a content by a node (jQuery)
             * @param {Object} node
             * @returns {Mixed}
             */
            getContentByNode: function (node) {
                var identifier = node.data(this.identifierDataAttribute),
                    config,
                    result;

                if (null !== identifier) {
                    config = this.retrievalObjectIdentifier(identifier);
                    config.jQueryObject = node;

                    result = this.buildElement(config, true);
                }

                return result;
            },

            /**
             * Retrieve a object identifier for split uid and type
             */
            retrievalObjectIdentifier: function (objectIdentifier) {
                var regex,
                    object = {},
                    res;

                if (objectIdentifier) {
                    /*jslint regexp: true */
                    regex = /(.+)\(([a-f0-9]+)\)$/;
                    /*jslint regexp: false */

                    res = regex.exec(objectIdentifier);

                    if (null !== res) {
                        object.type = res[1];
                        object.uid = res[2];
                    }
                }

                return object;
            },

            refreshImages: function (html, forceUpdate) {
                html = jQuery(html);

                var images = html.find('img'),
                    refreshPicture = function (img) {

                        if (true === forceUpdate) {
                            img.attr('src', img.attr('src') + '?' + new Date().getTime());
                        }

                        img.on('error', function () {
                            jQuery(this).attr('src', require('content.manager').defaultPicturePath + '?' + new Date().getTime());
                        });
                    };

                if (images.length > 0) {
                    images.each(function () {
                        refreshPicture(jQuery(this));
                    });
                }

                if (html.get(0) && html.get(0).tagName === 'IMG') {
                    refreshPicture(html);
                }

                return html;
            },

            computeImages: function (selector) {

                selector = selector || '';

                var self = this,
                    images = jQuery(selector + ' [data-' + this.identifierDataAttribute + '^="' + this.imageClass + '"]');

                images.each(function () {
                    var image = jQuery(this);

                    if (image.context.naturalWidth === 0) {
                        image.attr('src', self.defaultPicturePath);
                    }
                });
            },

            unSelectContent: function () {
                var currentSelected = jQuery('.' + this.contentSelectedClass),
                    currentContent;

                if (currentSelected.length > 0) {
                    currentContent = ContentContainer.find(currentSelected.data(this.idDataAttribute));
                    currentContent.unSelect();
                }
            },

            /**
             * Build an object identifier
             * @param {String} type
             * @param {String} uid
             * @returns {null|String}
             */
            buildObjectIdentifier: function (type, uid) {
                var objectIdentifier = null;

                if (typeof type === 'string' && typeof uid === 'string') {
                    objectIdentifier = type + '(' + uid + ')';
                }

                return objectIdentifier;
            },

            /**
             * Replace all occurences of charToReplace with charReplaceWith in an array
             *
             * @param {Array} parseArray
             * @param {String} charToReplace
             * @param {String} charReplaceWith
             * @returns {Array}
             */
            replaceChars: function (parseArray, charToReplace, charReplaceWith) {
                var key;

                for (key in parseArray) {
                    if (parseArray.hasOwnProperty(key)) {
                        parseArray[key] = parseArray[key].replace(charToReplace, charReplaceWith);
                    }
                }

                return parseArray;
            }
        });

        return new JS.Singleton(ContentManager);
    }
);
