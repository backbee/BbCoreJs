define(
    [
        'Core',
        'component!dnd',
        'jquery'
    ],
    function (Core, dndManager, jQuery) {
        "use strict";
        var DataViewItemDrag = new JS.Class({
            initialize: function (dataview) {
                this.dataview = dataview;
                this.draggableCls = 'data-view-draggable';
                this.dndId = this.dataview.config.id;
                this.draggedRef = null;
                this.initDnd();
            },

            initDnd: function () {
                dndManager(this.dataview.dataWrapper).addListeners(this.dndId, ".media-item-dnd-handler");
                this.bindDndEvents();
            },

            bindDndEvents: function () {
                Core.Mediator.subscribe("on:" + this.dndId + ":dragstart", this.handleDragStart.bind(this));
                Core.Mediator.subscribe("on:" + this.dndId + ":dragend", this.handleDragEnd.bind(this));
            },

            handleDragEnd: function () {
                jQuery(this.draggedRef).remove();
            },

            handleDragStart: function (event) {
                var currentTarget = event.currentTarget,
                    mediaItem = jQuery(currentTarget).data('item-data'),
                    parent = jQuery(currentTarget).closest("." + this.dataview.config.itemCls),
                    mainImg = parent.find('img').get(0),
                    clonedImg = null,
                    mediaTitle = jQuery(currentTarget).parent().find('.item-ttl').text(),
                    /*@see fix.less:128*/
                    dragImageWrapper = jQuery("<div>").addClass("drag-media-wrapper txt-center");
                /* wrapper depends on the existence of an image */
                if (mainImg) {
                    clonedImg = jQuery("<img>").attr("src", mainImg.src);
                    dragImageWrapper.append(clonedImg);
                } else {
                    dragImageWrapper.addClass("ico-only").append('<i class="fa fa-picture-o"><span class="media-title"> ' + mediaTitle + '</span>');
                }

                jQuery('body').append(dragImageWrapper);
                this.draggedRef = dragImageWrapper;
                event.dataTransfer.setData('text', 'dragging-dataview-item');
                if (typeof event.dataTransfer.setDragImage === 'function') {
                    event.dataTransfer.setDragImage(dragImageWrapper.get(0), 0, 0);
                }
                event.dataTransfer.effectAllowed = 'move';
                Core.set('dragging-dataview-item', mediaItem);
            }

        });
        return {
            init: function (dataview) {
                return new DataViewItemDrag(dataview);
            }
        };
    }
);