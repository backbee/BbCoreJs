define(['jquery', 'tb.component/treeview/NodeEditor', 'component!translator', "treeview.helper.droppable", "BackBone", "lib.jqtree", "jsclass"], function (jQuery, NodeEditor, Translator) {
    "use strict";
    /**
     * TreeView's class
     */

    var TreeView = new JS.Class({
        defaultOptions: {
            loadingMessage: Translator.translate('loading'),
            allowMultiRoots: false,
            beforeRender: jQuery.noop
        },
        /**
         * TreeView class constructor
         */
        initialize: function (userOptions) {

            this.useWrapper = false;
            this.isloaded = false;
            var uid = Math.random().toString(36).substr(2, 9);
            this.el = userOptions.el || jQuery("<div class='treeview-ctn' data-treeview-id='" + uid + "'/>");
            this.options = jQuery.extend({}, this.defaultOptions, userOptions.options);
            if (typeof this.options.beforeRender === "function") {
                this.beforeRender = this.options.beforeRender;
            }
            this.options.dragAndDrop = true;
            if (jQuery(this.el).hasClass('treeview-ctn')) {
                jQuery("body").append(this.el);
                this.useWrapper = true;
                this.options.dragAndDrop = false;
            }
            this.nodeEditor = new NodeEditor(this);
            this.treeEl = jQuery(this.el).tree(this.options);
            require("treeview.helper.droppable").init(this);
        },
        /* hasRoot */
        hasRoot: function () {
            if (this.getRootNode()) {
                return true;
            }
            return false;
        },
        beforeRender: function () {
            this.reload();
            this.appendNode({
                id: 999,
                label: this.options.loadingMessage
            });
        },
        /**
         * Listen to an even on the treet
         * @param {String} eventName
         * @param {function} callback
         * @param {object} context
         */
        on: function (eventName, callback, context) {
            context = context || this;
            this.treeEl.bind("tree." + eventName, jQuery.proxy(callback, context));

            return this;
        },
        off: function (eventName) {
            this.treeEl.unbind('tree.' + eventName);

            return this;
        },
        /**
         * Generic proxy that allows us to invoke every methods on the tree widget
         */
        invoke: function () {
            var methodName, args;
            try {
                args = jQuery.merge([], arguments);
                methodName = args[0];
                return this.treeEl.tree.apply(this.treeEl, arguments);
            } catch (e) {
                throw "TreeViewException Error while invoking " + methodName + e;
            }
        },
        /**
         * Set a parameter to the tree
         * @param {String} key
         * @param {String} value
         * @param {boolean} reload
         */
        set: function (key, value, reload) {
            if (typeof key !== 'string' || !value) {
                throw "TreeViewException [set] key must be a string";
            }
            jQuery(this.treeEl).tree("setOption", key, value);
            if (reload === true) {
                this.reload();
            }
        },
        /**
         * Set multiple options/parameters at once
         * @param {object}
         */
        setOptions: function (options, reload) {
            var key;
            if (!jQuery.isPlainObject(options)) {
                throw "TreeViewException [setOptions] options should be an object";
            }
            for (key in options) {
                if (options.hasOwnProperty(key)) {
                    this.set(key, options[key]);
                }
            }
            if (reload) {
                this.reload();
            }
        },

        editNode: function (node) {
            this.nodeEditor.edit(node);
        },

        createNode: function () {
            this.nodeEditor.createNode();
        },

        cancelEdition: function () {
            this.nodeEditor.cancelEdition();
        },

        getEditedNode: function () {
            return this.editor.getEditedNode();
        },


        /**
         * Get the selected node
         * @param {object}
         * @return {node}
         */
        getSelectedNode: function () {
            return this.invoke("getSelectedNode");
        },
        /**
         * Get the root node
         */
        getRootNode: function () {
            return this.invoke("getTree");
        },
        /**
         * Select a node
         */
        selectNode: function (node) {
            return this.invoke("selectNode", node);
        },
        /**
         * Get a node by it's Id
         *  @param {int} node id
         *  @return {node}
         */
        getNodeById: function (id) {
            if (!id) {
                throw "TreeViewException [getNodeById] an id should be provided";
            }
            return this.invoke("getNodeById", id);
        },
        /**
         * Append a node to an other one
         * If node doesn't exist
         * @param {node}
         * @param {parentNode}
         */
        appendNode: function (node, parentNode) {
            if (!this.hasRoot()) {
                return this.setData([node]);
            }
            if (parentNode && parentNode.hasOwnProperty("id")) {
                return this.invoke("appendNode", node, parentNode);
            }
            return this.invoke("appendNode", node);
        },

        unselectNode: function () {
            return this.invoke("selectNode", null);
        },

        /**
         * Add node at a specific position
         * @param {node} node
         * @param {string} position. Available value after, before, append
         * @param {node} existingNode
         */
        addNode: function (node, position, existingNode) {
            var availablePositions = ["after", "before", "append"];
            if (availablePositions.indexOf(position) === -1) {
                throw "TreeViewException [addNode] allowed positions are 'after' and 'before'";
            }
            if (!this.options.allowMultiRoots) {
                if (this.isRoot(existingNode) && (position === "after" || position === "before")) {
                    throw "TreeViewException [addNode] you can't add a node after or before the root node";
                }
            }
            if (position === "append") {
                return this.invoke("appendNode", node, existingNode);
            }
            position = position.charAt(0).toUpperCase() + position.slice(1);
            return this.invoke("addNode" + position, node, existingNode);
        },
        /**
         * Move a node to a target at specific position
         * @param {node} node
         * @param {node} targetNode
         * @param {String} position
         */
        moveNode: function (node, targetNode, position) {
            return this.invoke("moveNode", node, targetNode, position);
        },
        /**
         * Add data to the tree at a specific point
         * @param {data}
         * @param {parentNode}
         */
        setData: function (data, parentNode) {
            if (!Array.isArray(data)) {
                throw "TreeViewException [setData] data should be an Array";
            }
            return this.invoke("loadData", data, parentNode);
        },

        isNodeOpened: function (node) {
            var treeSate = this.invoke("getState"),
                result = false;
            if (jQuery.inArray(node.id, treeSate.open_nodes) !== -1) {
                result = true;
            }
            return result;
        },
        /**
         * Check if the provided node is the root node
         * @param {node}
         * @return {boolean}
         */
        isRoot: function (node) {
            var rootNode = this.getRootNode(),
                firstChild = rootNode.children[0];

            if (!node || !node.hasOwnProperty('id')) {
                return false;
            }
            if (firstChild && firstChild.hasOwnProperty("id")) {
                return firstChild.id === node.id;
            }
            return false;
        },
        /**
         * Load data from rest service
         * @param {String} url
         * @param {Node} parentNode
         * @param {function} callback
         */
        loadDataFromRest: function (url, parentNode, onLoaded) {
            return this.invoke("loadDataFromUrl", url, parentNode, onLoaded);
        },
        /**
         * Render the tree
         * @param {String} container
         */
        render: function (container) {
            jQuery(container).html(this.treeEl);
            this.treeEl.trigger("tree.onRender", this);
        },
        /**
         * Remove a specific node from the tree
         * @param {Node} node
         **/
        removeNode: function (node) {
            return this.invoke("removeNode", node);
        },
        /**
         * Reload the tree
         **/
        reload: function () {
            return this.invoke("reload");
        }
    }),
        /**
         * Create a treeView
         * @param {String} el
         * @param {Object} options
         * @return TreeView
         **/
        createTreeView = function (el, options) {
            options = jQuery.isPlainObject(options) ? options : {};
            var config = {
                el: el,
                options: options
            },
                treeView = new TreeView(config);
            return treeView;
        };
    return {
        createTreeView: createTreeView
    };
});
