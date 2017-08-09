/*
 * Copyright (c) 2011-2016 Lp digital system
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

require.config({
    paths: {
        'ls-templates': 'src/tb/component/imagecropper/templates',
        'imagecropper.confirm.view': 'src/tb/component/imagecropper/views/confirm.view'
    }
});

/*global Dropzone */
define(
    [
        'Core',
        'Core/Renderer',
        'crop.repository',
        'content.repository',
        'jquery',
        'component!popin',
        'component!translator',
        'imagecropper.confirm.view',
        'text!ls-templates/layout.twig',
        'jquery-layout',
        'component!mask',
        'jsclass',
        'cropper',
        'content.manager'
    ],
    function (Core,
        Renderer,
        CropRepository,
        ContentRepository,
        jQuery,
        PopInManager,
        Translator,
        ConfirmView,
        layoutTemplate
        ) {

        "use strict";

        var ImageCropper = new JS.Class({

            initialize: function (config) {
                var croppableElements = Core.config('croppable_elements'),
                    popin_config = {
                        title: Translator.translate('crop_image'),
                        id: 'cropper-popin',
                        width: 500,
                        top: 15,
                        height: 'auto',
                        modal: true,
                        position: { my: "center top", at: "center top" + jQuery('#' + Core.get('menu.id')).height()},
                        open: this.onOpen.bind(this),
                        close: this.onClose.bind(this)
                    };

                if (typeof config === "object" && config.parentPopin !== null) {
                    this.popin = PopInManager.createSubPopIn(config.parentPopin, popin_config);
                } else {
                    this.popin = PopInManager.createPopIn(popin_config);
                }

                if (croppableElements === undefined) {
                    return require('component!notify').error('No config for crop elements');
                }
                this.croppableElements = croppableElements;
                this.maskMng = require('component!mask').createMask();
            },

            show: function (imageUid, imagePath, originalName, element, mediaImage) {
                var self = this,
                    imageUrl = '',
                    fileName = (imagePath ? imagePath.split('/') : ''),
                    available_proportions = [
                        ['16/9', '1.77'],
                        ['3/2', '1.5'],
                        ['5/3', '1.66'],
                        ['4/3', '1.33'],
                        ['5/4', '1.25'],
                        ['7/5', '1.4'],
                        [Translator.translate('square'), '1'],
                        [Translator.translate('custom'), 'NaN']
                    ];

                if (null === imageUid || '' === imageUid) {
                    this.popin.destroy();
                    return require('component!notify').error(Translator.translate('image_could_not_load'));
                }
                ContentRepository.find(self.croppableElements.image_element, imageUid).done(function (response) {
                    if (response.hasOwnProperty('image')) {
                        imageUrl = response.image;
                    }

                    if (imagePath) {
                        imageUrl = 'images/' + fileName[fileName.length - 1];
                    }

                    if (null === imageUrl || '' === imageUrl) {
                        self.popin.destroy();
                        return require('component!notify').error(Translator.translate('image_could_not_load'));
                    }

                    self.popin.setContent(Renderer.render(layoutTemplate, { imageUid: imageUid, imageUrl: imageUrl + '?' + new Date().getTime(), available_proportions: available_proportions }));
                    if (self.isShown !== true) {
                        self.widget = jQuery(Renderer.render(layoutTemplate)).clone();
                    }
                    self.popin.display();
                    self.isShown = true;
                    self.imageUid = imageUid;
                    self.imagePath = imagePath;
                    self.originalName = originalName;
                    self.element = element;
                    self.mediaImage = mediaImage;
                });
            },

            onOpen: function () {

                var cropperW,
                    self = this,
                    cropperH,
                    cropperX,
                    cropperY,
                    cropRatio,
                    cropLockdim = jQuery('.crop-lockdim'),
                    popin_parent = jQuery('#cropper-popin').parent('.ui-dialog:first'),
                    cropImage = jQuery('#cropImage'),
                    cropWidthInput = jQuery('.crop-width'),
                    cropHeightInput = jQuery('.crop-height'),
                    proportionsSelect = jQuery('.proportions-select'),
                    selectedProportion = proportionsSelect.find('option:eq(0)').text(),
                    cropNewBtn = jQuery('.btn-crop-new'),
                    cropReplaceBtn = jQuery('.btn-crop-replace'),
                    options = {
                        aspectRatio: 16 / 9,
                        preview: '.crop-preview',
                        zoomable: false,
                        crop: function (e) {
                            cropperX = Math.round(e.x);
                            cropperY = Math.round(e.y);
                            cropperH = Math.round(e.height);
                            cropperW = Math.round(e.width);
                            cropWidthInput.val(cropperW);
                            cropHeightInput.val(cropperH);
                            cropRatio = cropperW / cropperH;
                        }
                    };

                popin_parent.css({
                    top: 15
                });

                jQuery(cropImage).off("build.cropper").bind("build.cropper", function (event) {
                    self.maskMng.mask(event.currentTarget);
                });

                cropImage.cropper(options);


                proportionsSelect.on('change', function () {
                    options.aspectRatio = jQuery(this).val();
                    cropImage.cropper('destroy').cropper(options);
                    selectedProportion = jQuery(this).find('option:selected').text();
                });

                cropLockdim.on('change', function () {
                    if (jQuery(this).is(':checked')) {
                        cropWidthInput.prop('readonly', true).unbind('change').val(cropperW);
                        cropHeightInput.prop('readonly', true).unbind('change').val(cropperH);
                    } else {
                        cropWidthInput.prop('readonly', false).on('change', function () {
                            cropHeightInput.val(Math.round(cropWidthInput.val() / cropRatio));
                        });
                        cropHeightInput.prop('readonly', false).on('change', function () {
                            cropWidthInput.val(Math.round(cropHeightInput.val() * cropRatio));
                        });
                    }
                });

                cropNewBtn.on('click', function () {
                    CropRepository.postData({
                        cropAction: 'new',
                        imagePath: self.imagePath,
                        originalUid: self.imageUid,
                        parentUid: self.mediaImage.uid,
                        originalName: self.originalName,
                        cropX: cropperX,
                        cropY: cropperY,
                        cropW: cropperW,
                        cropH: cropperH,
                        cropNewW: cropWidthInput.val(),
                        cropNewH: cropHeightInput.val(),
                        selectedProportion: selectedProportion
                    }).done(function (response, headers) {
                        var newMediaImageUid = headers.getHeader('BB-RESOURCE-UID') || headers.getHeader('bb-resource-uid');
                        self.onDone({action: 'new', label: 'new_cropimage_created', newMediaImageUid: newMediaImageUid});
                        return response;
                    }).fail(function () {
                        require('component!notify').error(Translator.translate('invalid_element'));
                    });
                });

                cropReplaceBtn.on('click', function () {
                    var config = {
                            parentPopin: self.popin,
                            validateCallback: function () {
                                CropRepository.postData({
                                    cropAction: 'replace',
                                    imagePath: self.imagePath,
                                    originalUid: self.imageUid,
                                    originalName: self.originalName,
                                    parentUid: self.mediaImage.uid,
                                    cropX: cropperX,
                                    cropY: cropperY,
                                    cropW: cropperW,
                                    cropH: cropperH,
                                    cropNewW: cropWidthInput.val(),
                                    cropNewH: cropHeightInput.val(),
                                    selectedProportion: selectedProportion
                                }).done(function (response) {
                                    self.onDone({action: 'replace', label: 'image_was_cropped'});
                                    return response;
                                }).fail(function () {
                                    require('component!notify').error(Translator.translate('invalid_element'));
                                });
                            }
                        },
                        view = new ConfirmView(config);

                    view.display();
                });
            },

            onDone: function (infos) {
                var newMediaImage,
                    mediaLibraryIsVisible = Core.get("MEDIA_LIBRARY_IS_VISIBLE") || false,
                    dropzone = Dropzone.forElement('.dropzone-file'),
                    dropzoneElement = jQuery('.ui-dialog-content').find('.dropzone-file'),
                    items = dropzoneElement.find('.dz-preview'),
                    file = {'name': this.originalName};

                require('component!notify').success(Translator.translate(infos.label));
                this.popin.destroy();
                if (items.length) {
                    items.first().remove();
                }
                dropzone.options.addedfile.call(dropzone, file);
                if (mediaLibraryIsVisible) {
                    jQuery('.ui-dialog:last').find('.ui-dialog-content button.bb-submit-form').click();
                } else {

                    jQuery('.ui-dialog .ui-dialog-content').has('input[name=' + this.element.getKey() + ']').dialog('destroy').remove();

                    if (infos.action === "replace") {
                        if (this.mediaImage) {
                            this.mediaImage.refresh();
                        }
                    }
                    if (infos.action === "new" && infos.newMediaImageUid) {
                        newMediaImage = require('content.manager').buildElement({type: "Media/Image", uid: infos.newMediaImageUid});
                        require('content.manager').replaceWith(this.mediaImage, newMediaImage);
                    }

                }
            },

            onClose: function () {
                jQuery('#cropImage').cropper('destroy');
                this.popin.destroy();
            }
        });
        return {
            create: function (config) {
                var cropper = new ImageCropper(config);

                jQuery.extend(cropper, {}, Backbone.Events);

                return cropper;
            }
        };
    }
);