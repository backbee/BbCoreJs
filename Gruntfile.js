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
module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        license: '/*\n * Copyright (c) 2011-2013 Lp digital system\n *\n * This file is part of BackBee.\n *\n * BackBee is free software: you can redistribute it and/or modify\n * it under the terms of the GNU General Public License as published by\n * the Free Software Foundation, either version 3 of the License, or\n * (at your option) any later version.\n *\n * BackBee is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n *\n * You should have received a copy of the GNU General Public License\n * along with BackBee. If not, see <http://www.gnu.org/licenses/>.\n */\n',

        /**
         * toolbar files and directories
         */
        dir: {
            src: 'src/tb',
            build: 'build',
            lib: 'lib',
            specs: 'specs'
        },
        components: {
            core: 'toolbar.core',
            config: 'require.config'
        },

        /**
         * application building
         */
        less: {
            css: {
                cleancss: true,
                files: {
                    'dist/css/bb-ui.css': 'less/bb-ui.less',
                    'dist/css/bb-ui-login.css': 'less/bb-ui-login.less',
                    'src/tb/component/cke/skins/backbee/dialog.css' : 'less/ckeditor_dialog.less'
                }
            }
        },
        cssmin: {
            compress: {
                files: {
                    'dist/css/bb-ui.min.css': ['dist/css/bb-ui.css'],
                    'dist/css/bb-ui-login.min.css': ['dist/css/bb-ui-login.css'],
                    'dist/css/vendor.min.css': ['dist/css/vendor.css']
                }
            }
        },

        copy: {
            font: {
                files: [
                    {
                        expand: true,
                        cwd: 'bower_components/components-font-awesome/',
                        src: 'fonts/*',
                        dest: 'dist/',
                        filter: 'isFile'
                    }
                ]
            }
        },

        /**
         * code style
         */
        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js', 'specs/**/*.js', 'nightwatch/**/*.js'],
            options: {
                jshintrc: '.jshintrc',
                predef: ['xdescribe'],
                reporterOutput: ""
            }
        },
        jslint: {
            grunt: {
                src: ['Gruntfile.js'],
                directives: {
                    predef: [
                        'module',
                        'require'
                    ]
                }
            },
            test: {
                src: ['specs/**/*.js'],
                directives: {
                    node: true,
                    nomen: true,
                    predef: [
                        'define',
                        'require',
                        'it',
                        'expect',
                        '__dirname',
                        'describe',
                        'xdescribe',
                        'spyOn',
                        'jasmine',
                        'localStorage',
                        'window',
                        'before',
                        'beforeEach',
                        'after',
                        'afterEach',
                        'xit',
                        'xdescribe',
                        'Uint8Array'
                    ]
                }
            },
            sources: {
                src: ['src/**/*.js', 'nightwatch/**/*.js'],
                directives: {
                    browser: true,
                    devel: true,
                    todo: true,
                    nomen: true,
                    predef: [
                        'define',
                        'require',
                        'module',
                        'Backbone',
                        'JS',
                        'DOMParser',
                        'Uint8Array',
                        'load' // temp remove it
                    ]
                }
            }
        },
        lesslint: {
            src: ['less/*.less']
        },

        concat: {
            options: {
                separator: '',
                process: function (src, filepath) {
                    return '\n/* ' + filepath + ' */\n' + src;
                }
            },
            vendorcss: {
                src: [
                    'bower_components/components-font-awesome/css/font-awesome.css',
                    'bower_components/datetimepicker/jquery.datetimepicker.css',
                    'bower_components/dropzone/dist/dropzone.css'
                ],
                dest: 'dist/css/vendor.css'
            }
        },
        shell: {
            moveConfig: {
                command: 'cp src/require.config.js dist/config.js'
            },
            moveCKE: {
                command: 'cp -R bower_components/ckeeditor dist/ckeeditor'
            }
        },
        uglify: {
            require: {
                files: {
                    'dist/require.js': ['bower_components/requirejs/require.js']
                }
            },
            config: {
                files: {
                    'dist/config.min.js': ['src/require.config.build.js']
                }
            }
        },
        requirejs: {
            vendor: {
                options: {
                    baseUrl: './',
                    out: 'dist/vendor.min.js',
                    optimize: 'uglify2',
                    generateSourceMaps: true,
                    preserveLicenseComments: false,
                    mainConfigFile: 'src/require.config.js',

                    include: [
                        'Core',

                        'jsclass',
                        'underscore',
                        'nunjucks',
                        'BackBone',
                        'text',
                        'moment',
                        'URIjs/URI',
                        'bootstrap-carousel',
                        'bootstrap-dropdown',
                        'dropzone',

                        'core-jquery',
                        'jqueryui',
                        'jquery-helper',
                        'jquery-layout',
                        'lib.jqtree',
                        'datetimepicker',
                        'jssimplepagination',

                        'cryptojs.core',
                        'cryptojs.md5',
                        'multiselect-two-sides',
                        'cropper'
                    ]
                }
            }
        },

        /**
         * application functional testing
         */
        nightwatch: {
            options: {
                standalone: false
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-lesslint');

    grunt.loadNpmTasks('grunt-istanbul-coverage');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-nightwatch');

    // grunt tasks

    grunt.registerTask('default', ['less:css', 'jshint', 'jslint', 'concat', 'uglify']);
    grunt.registerTask('test', ['less:css', 'jshint', 'jslint']);
    grunt.registerTask('dist', ['less:css', 'copy', 'concat', 'shell', 'cssmin', 'uglify', 'requirejs']);
};
