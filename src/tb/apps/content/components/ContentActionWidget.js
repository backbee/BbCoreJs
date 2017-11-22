define(['jquery', 'text!content/tpl/content-action', 'jsclass'], function (jQuery, template) {
    'use strict';
    var ContentActionWidget = new JS.Class({
        initialize: function () {
            this.content = null;
            this.widget = jQuery(template).clone();
            this.contentContextMenu =  jQuery(template).clone();
            jQuery(this.widget).addClass('content-actions');
            this.bindCxtMenuEvent();
        },

        bindCxtMenuEvent: function () {
            var self = this;
            jQuery(document).on("click", function () {
                self.contentContextMenu.hide();
            });
        },

        setContent: function (content) {
            this.content = content;
        },

        setDomTag: function (tag) {
            this.mainWrapper = jQuery(tag);
        },

        /*  listen to context */
        appendActions: function (actionArr, clean) {
            if (clean) {
                this.cleanActions();
            }
            var buttonNode = this.buildAction(actionArr);
            this.widget.append(buttonNode);
        },


        isBuild: function (content) {
            return content.jQueryObject.find('.content-actions').length > 0;
        },

        cleanActions: function () {
            this.widget.empty();
        },

        cleanContextActions: function () {
            this.contentContextMenu.empty();
        },

        show: function () {
            jQuery(this.content).append(this.widget);
        },

        showAsContextMenu: function (actionInfos, event) {
            if (!this.contentContextMenu) {
                this.contentContextMenu = jQuery(template).clone();
            }
            this.contentContextMenu.empty();
            jQuery(this.contentContextMenu).addClass("bb5-context-menu");
            var wrapper,
                actionNode;

            jQuery(this.contentContextMenu).css({
                position: "absolute",
                left: event.clientX + "px",
                top: event.clientY + "px"
            });
            actionNode = this.buildAction(actionInfos, true);
            wrapper = jQuery("<ul/>").append(actionNode);
            this.contentContextMenu.html(wrapper);
            this.mainWrapper.append(this.contentContextMenu);
            jQuery(this.contentContextMenu).show();
        },

        hide: function () {
            this.cleanActions();
        },

        hideAll: function () {
            this.cleanContextActions();
            this.cleanActions();
        },

        buildAction: function (actions, contextualRender) {
            actions = (jQuery.isArray(actions)) ? actions : [actions];
            var actionInfos,
                button,
                btnCtn = document.createDocumentFragment();

            jQuery.each(actions, function (i) {
                actionInfos = actions[i];
                if (!contextualRender) {
                    button = jQuery("<div></div>").clone();
                    button.attr("title", actionInfos.label);
                    button.attr('draggable', 'true');
                    button.addClass(actionInfos.ico);
                    button.addClass('action');
                } else {
                    if (actionInfos.hideInContextMenu === true) {
                        return true;
                    }
                    button = jQuery("<li></li>").clone();
                    var icoNode = jQuery('<i/>').addClass(actionInfos.ico);
                    button.append(jQuery('<button/>').append(icoNode).attr({"title" : actionInfos.label}).append(" " + actionInfos.label));
                }
                jQuery(button).on("click", actionInfos.cmd.execute);
                btnCtn.appendChild(jQuery(button).get(0));
            });
            return btnCtn;
        }
    });
    return ContentActionWidget;
});
