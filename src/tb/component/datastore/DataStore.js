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
        'require',
        'jquery',
        'BackBone',
        'Core',
        'underscore',
        'jsclass',
        'Core/DriverHandler',
        'Core/RestDriver',
        'cryptojs.md5'
    ],
    function (require, jQuery, BackBone, Core, underscore) {
        'use strict';
        var CoreDriverHandler = require('Core/DriverHandler'),
            CoreRestDriver = require('Core/RestDriver'),
            CryptoMd5 = require('cryptojs.md5'),
            AbstractDataStore = new JS.Class({
                defaultConfig: {
                    idKey: 'uid'
                },

                initialize: function (config) {
                    jQuery.extend(this, {}, BackBone.Events);
                    this.config = jQuery.extend({}, this.defaultConfig, config);
                    this.filters = {};
                    this.sorters = {};
                    this.start = 0;
                    this.limit = 25;
                    this.data = [];
                    this.notifyChange = true;
                    this.tasksQueue = [];
                    this.RequestMap = {};
                    this.lastRequestId = null;
                },


                addFilter: function (name, def) {
                    if (!name || typeof name !== "string") {
                        Core.exception('DataStoreException', 74000, '[addFilter] filter name should be a string');
                    }
                    if (!def || typeof def !== 'function') {
                        Core.exception('DataStoreException', 74001, '[addFilter] def should be a function');
                    }
                    this.filters[name] = def;
                },

                addSorter: function (name, def) {
                    if (!name || typeof name !== "string") {
                        Core.exception('DataStoreException', 74000, '[addSorter] sorter name should be a string');
                    }
                    if (!def || typeof def !== 'function') {
                        Core.exception('DataStoreException', 74001, '[addSorter] def should be a function');
                    }
                    this.sorters[name] = def;
                },

                setStart: function (start) {
                    this.start = start;
                    return this;
                },

                setLimit: function (limit) {
                    this.limit = limit;
                    return this;
                },

                triggerProcessing: function () {
                    this.trigger("processing");
                },

                getActionInfos: function (name) {
                    var actionInfos = name.split(":");
                    return this[actionInfos[0]][actionInfos[1]];
                },

                processTasks: function () {
                    Core.exception.silent('DataStoreException', 74005, 'You must implement processTasks');
                },

                applyFilter: function (name) {
                    var task = {
                        name: 'filters:' + name,
                        params: []
                    },
                        params = jQuery.merge([], arguments);
                    params.shift();
                    task.params = params;
                    task.paramsCount = params.length;

                    /* clear previous filter tasks */
                    this.tasksQueue = underscore.reject(this.tasksQueue, function (task) { return task.name === 'filters:' + name; });
                    this.tasksQueue.push(task);
                    return this;
                },

                applySorter: function (name) {
                    var orderTask = {
                        name: 'sorters:' + name,
                        params: []
                    },
                        params = jQuery.merge([], arguments);
                    params.shift();
                    orderTask.params = params;
                    orderTask.paramsCount = params.length;
                    /* clear previous filter tasks */
                    this.tasksQueue = underscore.reject(this.tasksQueue, function (task) { return task.name === 'sorters:' + name; });
                    this.tasksQueue.push(orderTask);
                    return this;
                },

                processData: function (data) {
                    return data;
                },

                unApplyFilter: function (filterName) {
                    var self = this;
                    this.tasksQueue = underscore.reject(this.tasksQueue, function (task) {
                        if (task.name === "filters:" + filterName) {
                            self.trigger("unApplyFilter:" + filterName, task.params[1]);
                            return true;
                        }
                    });
                    return this;
                },

                unApplySorter: function (sorterName) {
                    this.tasksQueue = underscore.reject(this.tasksQueue, function (task) {
                        return task.name === "sorters:" + sorterName;
                    });
                    return this;
                },

                clear: function () {
                    this.tasksQueue = [];
                    this.start = 0;
                    this.limit = 25;
                },

                load: function () {
                    return;
                },

                setData: function (data) {
                    this.data = this.processData(data);
                    if (this.notifyChange) {
                        this.trigger("dataStateUpdate", this.data);
                    }
                    this.trigger("doneProcessing");
                },

                execute: function (silent) {
                    this.notifyChange = (typeof silent === "boolean") ? silent : true;
                    this.trigger("processing");
                    return this.processTasks();
                }
            }),
            /* JSON Adapter */
            JsonDataStore = new JS.Class(AbstractDataStore, {
                initialize: function (config) {
                    this.callSuper(config);
                    var data = (this.config.hasOwnProperty('data')) ? this.config.data : [];
                    this.dataList = new Core.SmartList({
                        idKey: this.config.idKey,
                        data: data
                    });
                    this.createGenericSorter();
                    this.previousDataState = {};
                },

                createGenericSorter: function () {
                    this.addSorter("fieldSorter", function (fieldName, direction, data) {
                        if (!direction && typeof direction !== "string") {
                            throw "a Sort direction must be provided";
                        }
                        if (direction === "desc") {
                            data.sort(function (a, b) {
                                if (a.hasOwnProperty(fieldName) && b.hasOwnProperty(fieldName)) {
                                    var result = a[fieldName] < b[fieldName];
                                    return result;
                                }
                            });
                        }
                        if (direction === "asc") {
                            data.sort(function (a, b) {
                                if (a.hasOwnProperty(fieldName) && b.hasOwnProperty(fieldName)) {
                                    var result = a[fieldName] > b[fieldName];
                                    return result;
                                }
                            });
                        }
                        return data;
                    });
                },

                processTasks: function () {
                    var self = this,
                        dataState = this.dataList.toArray(true);
                    jQuery.each(this.tasksQueue, function (i, task) {
                        try {
                            var taskAction = self.getActionInfos(task.name);
                            if (!taskAction) {
                                throw "processTasks:taskFunc for task " + task.name;
                            }
                            task.params.push(dataState);
                            dataState = taskAction.apply({}, task.params, i);
                        } catch (e) {
                            Core.exception.silent('DataStoreException', 74001, '[processTasks] ' + e);
                        }
                    });
                    /* notify the new state */
                    this.setData(dataState);
                }
            }),
            /* RestDataAdapter */
            RestDataStore = new JS.Class(AbstractDataStore, {
                defaultConfig: {
                    autoLoad: false,
                    idKey: 'uid'
                },
                getTotal: function () {
                    return this.total;
                },
                getRangeTotal: function () {
                    return this.rangeTotal;
                },

                initialize: function (config) {
                    config = jQuery.extend({}, this.defaultConfig, config);
                    this.callSuper(config);
                    this.notifyChange = true;
                    this.initRestHandler();
                    this.total = 0;
                    this.lastRestRequestID = null;
                    this.lastRequest = null;
                    this.createGenericFilter();
                    this.handleAjaxEvent();
                    if (this.config.autoLoad) {
                        this.load();
                    }
                },

                handleAjaxEvent: function () {
                    var self = this;
                    jQuery(document).on("ajaxSend", function (e, jqXhr, options) {
                        if (self.lastRestRequestID === CryptoMd5.MD5(options.url).toString()) {
                            self.lastRequest = jqXhr;
                        }
                        return e;
                    });
                },

                registerLastRestRequest: function (request) {
                    this.lastRestRequestID = CryptoMd5.MD5(request.url).toString();
                },

                getLastRequest: function () {
                    var request = null;
                    if (this.lastRequest) {
                        request = this.lastRequest;
                    }
                    return request;
                },

                createGenericFilter: function () {
                    return;
                },

                initRestHandler: function () {
                    CoreDriverHandler.addDriver('rest', CoreRestDriver);
                    this.restHandler = CoreDriverHandler.addDriver('rest', CoreRestDriver);
                },

                /* build resquest here */
                processTasks: function () {
                    var self = this,
                        restParams = {
                            limit: this.limit,
                            sorters: {},
                            start: this.start,
                            criterias: {}
                        },
                        resultPromise = new jQuery.Deferred();
                    restParams.limit = this.limit;

                    jQuery.each(this.tasksQueue, function (i, task) {
                        try {
                            var taskAction = self.getActionInfos(task.name),
                                paramLength = task.paramsCount;
                            task.params[paramLength] = restParams;
                            restParams = taskAction.apply({}, task.params, i);
                        } catch (e) {
                            self.trigger('dataStoreError', e);
                            return true; //continue
                        }
                    });

                    Core.Mediator.subscribeOnce("rest:send:before", this.registerLastRestRequest.bind(this));
                    CoreDriverHandler.read(this.config.resourceEndpoint, restParams.criterias, restParams.sorters, this.start, this.limit).done(function (data, response) {
                        self.total = response.getRangeTotal();
                        self.rangeTotal = response.getRangeTo();
                        self.setData(data);
                        resultPromise.resolve(data, response);
                    }).fail(function (response) {
                        self.trigger('doneProcessing');
                        self.trigger('dataStoreError', response);
                        resultPromise.reject(response);
                    });
                    return resultPromise;
                },

                count: function () {
                    return this.data.length;
                },

                save: function (itemData) {
                    var self = this,
                        dfd = new jQuery.Deferred();
                    self.trigger("processing");
                    if (itemData.hasOwnProperty(this.config.idKey) && itemData[this.config.idKey]) {
                        CoreDriverHandler.update(this.config.resourceEndpoint, itemData, {
                            'id': itemData[this.config.idKey]
                        }).done(function (response, headers) {
                            self.trigger('change', 'update', itemData);
                            self.trigger("doneProcessing");
                            dfd.resolve(itemData, response, headers);
                        }).fail(function (reason, response) {
                            self.trigger("doneProcessing");
                            dfd.reject(reason, response);
                        });
                    } else {
                        CoreDriverHandler.create(this.config.resourceEndpoint, itemData).done(function (response, headers) {
                            itemData.uid = headers.getHeader('BB-RESOURCE-UID') || headers.getHeader('bb-resource-uid');
                            self.trigger('change', 'create', itemData);
                            self.trigger("doneProcessing");
                            dfd.resolve(itemData, response, headers);
                        }).fail(function (reason, response) {
                            self.trigger("doneProcessing");
                            dfd.reject(reason, response);
                        });
                    }
                    return dfd.promise();
                },

                computeNextStart: function (page) {
                    this.setStart((page - 1) * this.limit);
                },

                find: function (uid) {
                    var dfd = new jQuery.Deferred(),
                        self = this;
                    this.trigger("processing");
                    this.restHandler.read(this.config.resourceEndpoint, {id: uid}).done(function (node) {
                        dfd.resolve(node);
                    }).fail(dfd.reject).always(function () {
                        self.trigger("doneProcessing");
                    });
                    return dfd.promise();
                },

                remove: function (itemData) {
                    this.trigger("processing");
                    var self = this,
                        dfd = new jQuery.Deferred(),
                        url = this.config.resourceEndpoint,
                        uid = itemData.hasOwnProperty(this.config.idKey) ? itemData[this.config.idKey] : null,
                        /* compute new start */
                        nextTotal = self.total - 1,
                        nbPage = Math.ceil(nextTotal / self.limit),
                        nextStart = (nbPage >= this.start + 1) ? this.start : this.start - 1;
                    nextStart = (nextStart < 0) ? 0 : nextStart;
                    if (!uid) {
                        Core.exception('DataStoreException', 75001, '[remove] ' + this.idKey + ' key can\'t be found');
                    }
                    if (typeof this.config.rewriteResourceEndpoint === "function") {
                        url = this.config.rewriteResourceEndpoint("delete", itemData);
                    }
                    CoreDriverHandler["delete"](url, {id: uid}).done(function () {
                        dfd.resolve(itemData);
                        self.setStart(nextStart);
                        self.trigger("doneProcessing");
                        self.trigger("dataDelete", itemData);
                    }).fail(function (reason, response) {
                        dfd.reject(reason, response);
                        self.trigger("error", {
                            method: "remove"
                        });
                        self.trigger("doneProcessing");
                    });
                    return dfd.promise();
                }
            });
        return {
            JsonDataStore: JsonDataStore,
            RestDataStore: RestDataStore
        };
    }
);
