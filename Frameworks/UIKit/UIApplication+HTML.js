// #import "UIKit/UIApplication.js"
/* global UIApplication, JSURL, window */
'use strict';

UIApplication.definePropertiesFromExtensions({

    launchOptions: function(){
        var options = {};
        var url = JSURL.initWithString(window.location.href);
        var fragment = url.fragment;
        if (fragment !== null && fragment.length > 0 && fragment[0] == '/'){
            options[UIApplication.LaunchOptions.state] = fragment;
        }
        return options;
    }

});