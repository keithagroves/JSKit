// #import "Foundation/Foundation.js"
// #import "UIKit/UIApplication.js"
/* global JSClass, JSObject, UIScene, UIApplication, JSSpec */
'use strict';

JSClass("UIScene", JSObject, {

    menuBar: null,
    windowStack: null,
    application: null,

    init: function(){
        this._commonInit();
    },

    initWithSpecName: function(specName){
        var spec = JSSpec.initWithResource(specName);
        var owner = spec.filesOwner;
        if (owner.isKindOfClass(UIScene)){
            return owner;
        }
        return null;
    },

    initWithSpec: function(spec, values){
        UIScene.$super.initWithSpec.call(this, spec, values);
        this._commonInit();
        if ('menuBar' in values){
            this.menuBar = spec.resolvedValue(values.menuBar, "UIMenuBar");
        }
        if ('windowStack' in values){
            var window;
            for (var i = 0, l = values.windowStack.length; i < l; ++i){
                window = spec.resolvedValue(values.windowStack[i], "UIWindow");
                this.addWindow(window);
            }
        }
    },

    addWindow: function(window){
        window._scene = this;
        this.windowStack.push(window);
    },

    _commonInit: function(){
        this.application = UIApplication.sharedApplication;
        this.windowStack = [];
    },

    makeVisible: function(){
        if (this.menuBar){
            this.application.windowServer.menuBar = this.menuBar;
        }
        var window = null;
        for (var i = 0, l = this.windowStack.length; i < l; ++i){
            window = this.windowStack[i];
            window.makeVisible();
        }
        if (window !== null){
            window.makeKey();
        }
        UIScene._visible = this;
    },

    close: function(){
        var window;
        for (var i = 0, l = this.windowStack.length; i < l; ++i){
            window = this.windowStack[i];
            window.close();
        }
        if (this.menuBar){
            this.application.windowServer.menuBar = null;
        }
    }

});

UIScene._visible = null;

Object.defineProperty(UIScene, 'visible', {
    get: function UIScene_getVisible(){
        return UIScene._visible;
    }
});