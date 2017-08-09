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
        'Core',
        'page.view.contribution.index',
        'Core/Request',
        'Core/RequestHandler',
        'page.save.manager',
        'Core/Utils',
        'page.store',
        'jquery',
        'component!mask',
        'component!translator'
    ],
    function (
        Core,
        ContributionIndexView,
        Request,
        RequestHandler,
        SaveManager,
        Utils,
        PageStore,
        jQuery,
        MaskManager,
        Translator
    ) {

        'use strict';

        Core.ControllerManager.registerController('MainController', {

            appName: 'page',

            config: {
                imports: ['page.repository', 'layout.repository'],
                define: {
                    treeService: ['page.view.tree.contribution'],
                    getPageTreeViewInstanceService: ['page.view.tree'],
                    updatePageInfoService: ['page.widget.InformationPage'],
                    clonePageService: ['page.view.clone'],
                    newPageService: ['page.view.new'],
                    editPageService: ['page.view.edit'],
                    validateService: ['component!translator', 'component!revisionpageselector', 'component!notify'],
                    cancelService: ['component!translator', 'component!revisionpageselector', 'component!notify'],
                    deletePageService: ['page.view.delete'],
                    popinManagementService: ['page.view.manage'],
                    toolbarManagementService: ['page.view.toolbar'],
                    setOnlineGroupedService: ['page.view.validation', 'component!translator', 'component!notify'],
                    setOfflineGroupedService: ['page.view.validation', 'component!translator', 'component!notify'],
                    restoreGroupedService: ['page.view.validation', 'component!translator', 'component!notify'],
                    removeGroupedService: ['page.view.validation', 'component!translator', 'component!notify'],
                    changeParentGroupedService: ['component!translator', 'component!notify', 'page.view.tree.select.parent']
                }
            },

            /**
             * Initialize of Page Controller
             */
            onInit: function () {
                this.mainApp = Core.get('application.main');
                this.repository = require('page.repository');
                this.layoutRepository = require('layout.repository');
            },

            /**
             * Index action
             * Show the index in the edit contribution toolbar
             */
            contributionIndexAction: function () {

                var self = this,
                    mask,
                    view,
                    contribArea;

                Core.ApplicationManager.invokeService('contribution.main.index').done(function (service) {
                    service.done(function () {

                        Core.Scope.register('contribution', 'page');

                        if (self.contribution_loaded !== true) {

                            contribArea = jQuery('#page-contrib-tab');

                            mask = MaskManager.createMask({
                                'message': Translator.translate('loading_page_parameters'),
                                'css': {
                                    'height': '97px',
                                    'position': 'static'
                                }
                            });

                            mask.mask(contribArea);

                            self.repository.findCurrentPage().done(function (data) {
                                if (data.hasOwnProperty(0)) {
                                    data = data[0];
                                }

                                Core.set("current.page", data);

                                view = new ContributionIndexView({'data': data});

                            }).fail(function () {
                                view = new ContributionIndexView();
                            }).always(function () {

                                view.render();

                                mask.unmask(contribArea);

                                self.contribution_loaded = true;
                            });
                        }

                        Core.ApplicationManager.invokeService('contribution.main.manageTabMenu', '#edit-tab-page');
                    });
                });
            },

            /**
             * Show tree with pages
             */
            treeService: function (req, config) {
                var PageTreeViewContribution = req('page.view.tree.contribution'),
                    view = new PageTreeViewContribution(config);
                view.render();
                return view;
            },

            getPageTreeViewInstanceService: function (req) {
                return req('page.view.tree');
            },

            getPageRepositoryService: function () {
                return require('page.repository');
            },

            getSaveManagerService: function () {
                return SaveManager;
            },

            /**
             * Delete action
             * Delete page with uid
             * @param {String} uid
             */
            deletePageService: function (req, config) {
                var DeleteView = req('page.view.delete');
                this.repository.find(config.uid).then(
                    function (page) {
                        config.page = page;
                        var view = new DeleteView(config);
                        view.render();
                    }
                );
            },

            findCurrentPageService: function () {
                return this.repository.findCurrentPage();
            },

            clonePageService: function (req, config) {
                config.callbackAfterSubmit = this.newPageRedirect;
                var CloneView = req('page.view.clone'),
                    view = new CloneView(config);
                view.render();
            },

            newPageService: function (req, config) {

                if ('redirect' === config.flag) {
                    config.callbackAfterSubmit = this.newPageRedirect;
                }
                var NewView = req('page.view.new'),
                    view = new NewView(config);
                view.render();
            },

            editPageService: function (req, config) {
                if (config.page_uid === Core.get('root.uid')) {
                    delete config.move_to;
                }

                var EditView = req('page.view.edit'),
                    view = new EditView(config);

                view.render();
            },

            /**
             * Manage pages action
             */
            manageAction: function () {
                Core.ApplicationManager.invokeService('page.main.popinManagement');
                Core.ApplicationManager.invokeService('page.main.toolbarManagement');
            },

            popinManagementService: function (req) {
                var treePopin = jQuery('#bb-page-tree'),
                    ManageView;

                Core.Scope.register('page', 'management');

                if (treePopin.length > 0) {
                    treePopin.dialog('destroy').remove();
                }

                if (!this.manageView) {
                    ManageView = req('page.view.manage');
                    this.manageView = new ManageView({'pageStore': PageStore});
                    this.manageView.render();
                } else {
                    this.manageView.popin.display();
                }
            },

            /**
             * Set / unset mask for page management popin
             * @param {Boolean} mask
             * @returns {undefined}
             */
            popinDisplayManagementService: function (mask) {
                if (this.manageView) {
                    if (mask === true) {
                        this.manageView.popin.mask();
                    } else {
                        this.manageView.popin.unmask();
                    }
                }
            },

            toolbarManagementService: function (req) {
                var ToolbarView = req('page.view.toolbar'),
                    view = new ToolbarView({'pageStore': PageStore});

                this.layoutRepository.findLayouts(Core.get('site.uid')).then(
                    function (layouts) {
                        Core.ApplicationManager.invokeService('main.main.toolbarManager').done(function (Service) {
                            Service.append('bb-page-app', view.render(Utils.castAsArray(layouts)), true);
                            view.bindEvents();
                        });
                    }
                );

            },

            newPageRedirect: function (data, response) {
                var location = response.getHeader('Location') || response.getHeader('location'),
                    request = new Request();

                if (location) {
                    request.setUrl(location);
                    RequestHandler.send(request).then(
                        function (page) {
                            if (page.uri) {
                                document.location.href = page.uri;
                            }
                        }
                    );
                }
                return data;
            },

            validateService: function (req) {
                this.repository.findCurrentPage().done(function (page) {
                    var translator = req('component!translator'),
                        notify = req('component!notify'),
                        config = {
                            popinTitle: translator.translate('validation_confirmation'),
                            noContentMsg: translator.translate('no_page_modification_validate'),
                            title: translator.translate('confirm_saving_changes_page_below') + ' :',
                            questionMsg: translator.translate('confirm_save_changes_made_to_page'),
                            currentPage: page,
                            onSave: function (data, popin) {
                                if (data.length > 0) {
                                    SaveManager.save(data, page.uid).done(function () {
                                        notify.success(translator.translate('page_modification_validated'));

                                        location.reload();

                                        popin.unmask();
                                        popin.hide();
                                    });
                                } else {
                                    notify.warning(translator.translate('no_page_modification_validate'));
                                    popin.unmask();
                                    popin.hide();
                                }
                            }
                        };

                    req('component!revisionpageselector').create(config).show();
                });
            },

            cancelService: function (req) {
                this.repository.findCurrentPage().done(function (page) {
                    var translator = req('component!translator'),
                        notify = req('component!notify'),
                        config = {
                            popinTitle: translator.translate('cancel_confirmation'),
                            noContentMsg: translator.translate('no_page_modification_cancel'),
                            title: translator.translate('cancel_changes_page_below') + ' :',
                            questionMsg: translator.translate('cancel_save_changes_made_to_page'),
                            currentPage: page,
                            onSave: function (data, popin) {
                                if (data.length > 0) {
                                    notify.success(translator.translate('page_modification_canceled'));
                                    location.reload();
                                } else {
                                    notify.warning(translator.translate('no_page_modification_cancel'));
                                }

                                popin.unmask();
                                popin.hide();

                                SaveManager.clear();
                            }
                        };

                    req('component!revisionpageselector').create(config).show();
                });
            },

            updatePageInfoService: function (req) {
                var widget = req('page.widget.InformationPage');

                widget.updateContent();
            },

            getContentPopins: function () {
                return Core.get('application.page').getPopins();
            },

            registerPopinService: function (id, popin) {
                this.getContentPopins()[id] = popin;
            },

            removePopinService: function (id) {
                delete this.getContentPopins()[id];
            },

            getPopinService: function (id) {
                return this.getContentPopins()[id];
            },

            setOnlineGroupedService: function (req, data, pageStore) {
                var translator = req('component!translator'),
                    View = req('page.view.validation'),
                    view = new View({text: 'grouped_online_text', popin: data.popin});

                view.display().then(
                    function () {
                        this.repository.groupedPatch(data.uids, {state: 'online'}).then(
                            function () {
                                if (data.uids.length === 1) {
                                    req('component!notify').success(translator.translate('page_set_online'));
                                } else {
                                    req('component!notify').success(translator.translate('pages_set_online'));
                                }
                                pageStore.execute();
                            },
                            function () {
                                req('component!notify').error(translator.translate('internal_error'));
                            }
                        );
                    }.bind(this),
                    function () {
                        view.destruct();
                    }
                );
            },

            setOfflineGroupedService: function (req, data, pageStore) {
                var translator = req('component!translator'),
                    View = req('page.view.validation'),
                    view = new View({text: 'grouped_offline_text', popin: data.popin});

                view.display().then(
                    function () {
                        this.repository.groupedPatch(data.uids, {state: 'offline'}).then(
                            function () {
                                if (data.uids.length === 1) {
                                    req('component!notify').success(translator.translate('page_set_offline'));
                                } else {
                                    req('component!notify').success(translator.translate('pages_set_offline'));
                                }
                                pageStore.execute();
                            },
                            function () {
                                req('component!notify').error(translator.translate('internal_error'));
                            }
                        );
                    }.bind(this),
                    function () {
                        view.destruct();
                    }
                );
            },

            restoreGroupedService: function (req, data, pageStore) {
                var translator = req('component!translator'),
                    View = req('page.view.validation'),
                    view = new View({text: 'grouped_restore_text', popin: data.popin, popinTitle: translator.translate('restore_page')});

                view.display().then(
                    function () {
                        data.popin.mask();
                        this.repository.groupedPatch(data.uids, {state: 'restore'}).then(
                            function () {
                                if (data.uids.length === 1) {
                                    req('component!notify').success(translator.translate('page_restored'));
                                } else {
                                    req('component!notify').success(translator.translate('pages_are_restored'));
                                }
                                pageStore.execute().done(function () {
                                    data.popin.unmask();
                                });
                            },
                            function () {
                                data.popin.unmask();
                                req('component!notify').error(translator.translate('internal_error'));
                            }
                        );
                    }.bind(this),
                    function () {
                        view.destruct();
                    }
                );
            },

            removeGroupedService: function (req, data, pageStore) {
                var translator = req('component!translator'),
                    View = req('page.view.validation'),
                    view = new View({text: 'grouped_remove_text', popin: data.popin, popinTitle: translator.translate('delete_page')});

                view.display().then(
                    function () {
                        data.popin.mask();
                        this.repository.groupedPatch(data.uids, {state: 'delete'}).then(
                            function (response) {
                                var key,
                                    pageNumberWithoutPermission = 0,
                                    pageNumberWithPermission = 0;

                                for (key in response) {
                                    if (response.hasOwnProperty(key) && response[key].hasOwnProperty('statusCode')) {
                                        if (response[key].statusCode === 403) {
                                            pageNumberWithoutPermission += 1;
                                        } else {
                                            pageNumberWithPermission += 1;
                                        }
                                    }
                                }

                                if (pageNumberWithoutPermission === 1) {
                                    req('component!notify').error(translator.translate('page_no_permission_to_delete'));
                                } else if (pageNumberWithoutPermission > 1) {
                                    req('component!notify').error(translator.translate('pages_no_permission_to_delete'));
                                }
                                if (pageNumberWithPermission === 1) {
                                    req('component!notify').success(translator.translate('page_deleted'));
                                } else if (pageNumberWithPermission > 1) {
                                    req('component!notify').success(translator.translate('pages_are_deleted'));
                                }
                                pageStore.execute().done(function () {
                                    data.popin.unmask();
                                });
                            },
                            function () {
                                data.popin.unmask();
                                req('component!notify').error(translator.translate('internal_error'));
                            }
                        );
                    }.bind(this),
                    function () {
                        view.destruct();
                    }
                );
            },

            changeParentGroupedService: function (req, data) {
                var translator = req('component!translator'),
                    View = req('page.view.tree.select.parent'),
                    tree = new View();

                tree.render().then(
                    function (parent_uid) {
                        this.repository.groupedPatch(data.uids, {parent_uid: parent_uid}).then(
                            function () {
                                req('component!notify').success(translator.translate('pages_parent_updated'));
                            },
                            function () {
                                req('component!notify').error(translator.translate('internal_error'));

                            }
                        );
                    }
                );

            }
        });
    }
);
