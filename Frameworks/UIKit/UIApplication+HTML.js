// #import "UIKit/UIApplication.js"
// #import "UIKit/UIHTMLWindowServer.js"
/* global JSGlobalObject, UIApplication, JSURL, window, UIHTMLWindowServer, JSArguments */
'use strict';

UIApplication.definePropertiesFromExtensions({

    launchOptions: function(){
        var url = JSURL.initWithString(window.location.href);
        var fragment = url.fragment;
        var query = "";
        var positional = [];
        if (fragment !== null && fragment.length > 0){
            if (fragment[0] == '/'){
                var queryIndex = fragment.indexOf('?');
                if (queryIndex >= 0){
                    query = fragment.substr(queryIndex + 1);
                    positional.push(fragment.substr(0, queryIndex));
                }else{
                    positional.push(fragment);
                }
            }else{
                query = fragment;
            }
        }
        var options = this.bundle.info.UIApplicationLaunchOptions || {};
        var args = JSArguments.initWithOptions(options);
        args.parseQueryString(query);
        url.fragment = null;
        window.history.replaceState(null, null, url.encodedString);
        return args;
    },

    openURL: function(url){
        window.open(url.encodedString);
    }

});

JSGlobalObject.UIApplicationMain = function(rootElement, bootstrapper){
    var windowServer = UIHTMLWindowServer.initWithRootElement(rootElement);
    var application = UIApplication.initWithWindowServer(windowServer);
    application.setup();
    application.run(function(success){
        if (bootstrapper){
            bootstrapper.applicationLaunchResult(success);
        }
    });
};