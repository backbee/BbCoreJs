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

/*global Dropzone */
define(
    [
        'Core',
        'Core/Renderer',
        'URIjs/URI',
        'BackBone',
        'jquery',
        'component!translator',
        'component!imagecropper',
        'tb.component/mask/main',
        'component!session',
        'component!notify'
    ],
    function (Core, Renderer, URI, Backbone, jQuery, Translator, Cropper) {
        'use strict';

        var FileView = Backbone.View.extend({

            mainSelector: Core.get('wrapper_toolbar_selector'),
            dropzoneSelector: '.dropzone-file',

            defaultDropzoneConfig: {
                url: Core.get('api_base_url') + '/resource/upload',
                dictDefaultMessage: 'Drop files here or click to upload.',
                addRemoveLinks: true,
                maxFiles: 1,
                thumbnailWidth: 200
            },

            initialize: function (template, formTag, element, mainForm) {
                this.form = formTag;
                this.template = template;
                this.mainForm = mainForm;
                this.element = element;
                this.crop_button_class = 'btn-crop';
                this.maskManager = require('tb.component/mask/main').createMask({'message': Translator.translate('uploading')});
                this.uploadEvent();
                this.cropEvent();
            },

            cropEvent: function () {
                var self = this,
                    imageUid = '',
                    imagePath = '',
                    originalName = '';

                if (this.element.config && this.element.config.element && this.element.config.element.uid) {
                    imageUid = this.element.config.element.uid;
                }

                Core.Mediator.subscribe('on:form:render', function (form) {
                    if (Core.get("DISABLE_CROP")) {
                        form.find('.btn-crop').hide();
                    }
                    form.find('.btn-crop').unbind('click').on('click', function () {
                        if (form.find('.dz-preview').length === 0) {
                            require('component!notify').error(Translator.translate('no_image_to_crop'));
                        } else {
                            if (form.find('input[name=' + self.element.getKey() + ']').val() === 'updated') {
                                imagePath = form.find('span.' + self.element.getKey() + '_path').text();
                                originalName = form.find('span.' + self.element.getKey() + '_originalname').text();
                            }
                            self.cropper = Cropper.create({parentPopin: self.mainForm.config.popinInstance});
                            self.cropper.show(imageUid, imagePath, originalName, self.element, self.mainForm.config.content);
                        }
                    });
                });
            },

            disableCrop: function () {
                jQuery("#" + this.form).find("." + this.crop_button_class).remove();
            },

            uploadEvent: function () {
                var self = this,
                    config = {},
                    session = require('component!session');

                jQuery.extend(config, this.defaultDropzoneConfig, this.element.config.dropzone);

                Core.Mediator.subscribe('on:form:render', function (form) {
                    if (form.attr('id') !== self.form) {
                        return;
                    }

                    var element = form.find('.element_' + self.element.getKey()),
                        dropzoneElement = element.find(self.dropzoneSelector),
                        dropzone = new Dropzone(dropzoneElement.eq(0).get(0), config),
                        input = form.find('input[name=' + self.element.getKey() + ']'),
                        inputPath = form.find('span.' + self.element.getKey() + '_path'),
                        inputSrc = form.find('span.' + self.element.getKey() + '_src'),
                        inputOriginalName = form.find('span.' + self.element.getKey() + '_originalname');

                    self.buildValue(dropzone, self.element.value, input);


                    dropzone.on('sending', function (file, xhr) {

                        xhr.setRequestHeader(session.HEADER_API_KEY, session.key);
                        xhr.setRequestHeader(session.HEADER_API_SIGNATURE, session.signature);

                        self.maskManager.mask(form);

                        var items = dropzoneElement.find('.dz-preview');

                        if (items.length > 1) {
                            if (typeof self.element.value === 'object') {
                                items.first().remove();
                            }
                        }
                        return file;
                    });

                    dropzone.on('complete', function () {
                        self.maskManager.unmask(form);
                    });

                    dropzone.on('thumbnail', function () {

                        var detail = dropzoneElement.find('.dz-details');

                        detail.addClass('hidden');
                    });

                    dropzone.on('success', function (file, response) {

                        var detail = dropzoneElement.find('.dz-details'),
                            thumbnail;

                        inputPath.text(response.path);
                        inputOriginalName.text(response.originalname);

                        if (response.src !== undefined) {
                            inputSrc.text(response.src);
                        }

                        if (config.default_thumbnail) {
                            thumbnail = file.previewElement.querySelector("img");
                            if ('' === thumbnail.src) {
                                thumbnail.src = config.default_thumbnail;
                            }
                        }

                        input.val('updated');

                        detail.addClass('hidden');

                        return file;
                    });

                    dropzone.on('removedfile', function () {
                        if (this.files.length === 0) {
                            inputPath.text('');
                            inputSrc.text('');
                            inputOriginalName.text('');
                            input.val('updated');
                            self.disableCrop();
                        }
                    });

                    dropzone.on('maxfilesexceeded', function (file) {
                        this.removeFile(file);
                    });

                    dropzone.on('error', function (file) {
                        var detail = dropzoneElement.find('.dz-details');

                        detail.addClass('hidden');

                        this.removeFile(file);

                        require('component!notify').warning(Translator.translate('wrong_upload_file_types'));
                    });
                });
            },

            buildValue: function (dropzone, value, element) {
                if (typeof value === 'object') {

                    var file = {'name': value.name},
                        uri = new URI(Core.get('api_base_url')),
                        baseUrl = uri.protocol() + '://' + uri.host() + '/';

                    if (value.thumbnail.indexOf(value.path) === -1) {
                        value.thumbnail = baseUrl + 'images/' + value.path;
                    }

                    dropzone.options.addedfile.call(dropzone, file);
                    dropzone.createThumbnailFromUrl(file, value.thumbnail + '?' + new Date().getTime(), function (event) {

                        if (event && event.type === 'error') {

                            var fileBackup = {'name': value.name};

                            dropzone.removeFile(file);
                            dropzone.options.addedfile.call(dropzone, fileBackup);
                            dropzone.createThumbnailFromUrl(fileBackup, require('content.manager').defaultPicturePath + '?' + new Date().getTime());
                        }
                    });

                    element.val(value.path);
                }
            },

            /**
             * Render the template into the DOM with the Renderer
             * @returns {String} html
             */
            render: function () {
                return Renderer.render(this.template, {element: this.element, id: this.id});
            }
        });

        return FileView;
    }
);