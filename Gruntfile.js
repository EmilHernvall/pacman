module.exports = function(grunt) {
    require("load-grunt-tasks")(grunt); // npm install --save-dev load-grunt-tasks
    grunt.loadNpmTasks('grunt-webpack');

    var webpackConfig = require("./webpack.config");

    grunt.initConfig({
        "webpack": {
            build: webpackConfig
        }
    });

    grunt.registerTask("default", ["webpack"]);
};
