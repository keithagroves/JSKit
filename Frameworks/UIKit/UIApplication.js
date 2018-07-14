// #import "Foundation/Foundation.js"
// #import "UIKit/UIResponder.js"
// #import "UIKit/UIWindowServer.js"
// #import "UIKit/UIPlatform.js"
/* global JSGlobalObject, JSClass, JSObject, JSFileManager, JSUserDefaults, UIPlatform, UIResponder, UIApplication, UIWindowServer, JSBundle, JSFont, JSSpec, JSDynamicProperty, JSReadOnlyProperty, UIEvent, jslog_create  */
'use strict';

(function(){

var shared = null;

var logger = jslog_create("uikit.application");

JSClass('UIApplication', UIResponder, {

    // MARK: - Initialization & Startup

    initWithWindowServer: function(windowServer){
        if (shared){
            throw new Error("UIApplication.init: one application already initialized, and only one may exist");
        }
        shared = this;
        this.windowServer = windowServer;
        this._windowsById = {};
        this.bundle = JSBundle.mainBundle;
    },

    deinit: function(){
        shared = null;
    },

    launchOptions: function(){
        return {};
    },

    setup: function(){
        this.setupFonts();
        this.setupDelegate();
    },

    setupFonts: function(){
        JSFont.registerBundleFonts(this.bundle);
        var systemFontName = this.bundle.info[UIApplication.InfoKeys.systemFont];
        if (systemFontName){
            JSFont.registerSystemFontResource(systemFontName);
        }
    },

    setupDelegate: function(){
        if (this.bundle.info[UIApplication.InfoKeys.mainSpec]){
            var mainUIFile = JSSpec.initWithResource(this.bundle.info[UIApplication.InfoKeys.mainSpec]);
            this.delegate = mainUIFile.filesOwner;
        }else if (this.bundle.info[UIApplication.InfoKeys.applicationDelegate]){
            var delegateClass = JSClass.FromName(this.bundle.info[UIApplication.InfoKeys.applicationDelegate]);
            this.delegate = delegateClass.init();
        }else{
            throw new Error("UIApplication: Info is missing required key '%s' or '%s'".sprintf(UIApplication.InfoKeys.mainSpec, UIApplication.InfoKeys.applicationDelegate));
        }
    },

    run: function(callback){
        // User Defaults are enabled by default, but can be disabled in Info
        var needsUserDefaults = this.bundle.info[UIApplication.InfoKeys.requiresUserDefaults] !== false;
        // File Manager is enabled by default, but can be disabled in Info; however, needing user defaults implies needing file manager
        var needsFileManager = needsUserDefaults || (this.bundle.info[UIApplication.InfoKeys.requiresFileManager] !== false);

        if (needsFileManager){
            JSFileManager.shared.open(function UIApplication_fileManagerDidOpen(state){
                switch (state){
                    case JSFileManager.State.success:
                        if (needsUserDefaults){
                            JSUserDefaults.shared.open(function UIApplication_userDefaultsDidOpen(){
                                this._notifyDelegateOfLaunch(callback);
                            }, this);
                        }else{
                            this._notifyDelegateOfLaunch(callback);
                        }
                        break;
                    case JSFileManager.State.genericFailure:
                        this._notifyDelegateOfLaunchFailure(UIApplication.LaunchFailureReason.filestyemNotAvailable, callback);
                        break;
                    case JSFileManager.State.conflictingVersions:
                        this._notifyDelegateOfLaunchFailure(UIApplication.LaunchFailureReason.upgradeRequiresNoOtherInstances, callback);
                        break;
                }
            }, this);
        }else{
            this._notifyDelegateOfLaunch(callback);
        }
    },

    _notifyDelegateOfLaunch: function(callback){
        var launchOptions = this.launchOptions();
        if (this.delegate && this.delegate.applicationDidFinishLaunching){
            try{
                this.delegate.applicationDidFinishLaunching(this, launchOptions);
                if (this.windowServer.windowStack.length === 0){
                    throw new Error("No window initiated on application launch.  ApplicationDelegate needs to show a window during .applicationDidFinishLaunching()");
                }
                callback(true);
            }catch (e){
                logger.error(e);
                this._notifyDelegateOfLaunchFailure(UIApplication.LaunchFailureReason.exception, callback);
            }
        }
    },

    _notifyDelegateOfLaunchFailure: function(reason, callback){
        logger.error("Could not launch app: %s".sprintf(reason));
        var launchOptions = this.launchOptions();
        if (this.delegate && this.delegate.applicationDidFailLaunching){
            this.delegate.applicationDidFailLaunching(this, reason);
        }
        callback(false);
    },

    // MARK: - Managing Windows

    mainWindow: JSReadOnlyProperty(),
    keyWindow: JSReadOnlyProperty(),
    windows: JSReadOnlyProperty(),
    windowServer: null,

    getWindows: function(){
        return this.windowServer.windowStack;
    },

    getMainWindow: function(){
        return this.windowServer.mainWindow;
    },

    getKeyWindow: function(){
        return this.windowServer.keyWindow;
    },

    // MARK: - Menu

    mainMenu: JSReadOnlyProperty(),

    getMainMenu: function(){
        var menuBar = this.windowServer.menuBar;
        if (menuBar){
            return menuBar.menu;
        }
        return null;
    },

    // MARK: - Sending Events & Actions

    sendEvent: function(event){
        if (event.category === UIEvent.Category.key){
            var mainMenu = this.mainMenu;
            if (mainMenu && (event.modifiers & UIPlatform.shared.commandModifier)){
                if (mainMenu.performKeyEquivalent(event)){
                    return;
                }
            }
        }
        var windows = event.windows;
        for (var i = 0, l = windows.length; i < l; ++i){
            windows[i].sendEvent(event);
        }
    },

    firstTargetForAction: function(action, target, sender){
        if (target === null){
            if (this.mainWindow !== null){
                target = this.mainWindow.firstResponder || this.mainWindow;
            }
        }
        if (target !== null && target.targetForAction && typeof(target.targetForAction) === 'function'){
            target = target.targetForAction(action, sender);
        }
        return target;
    },

    sendAction: function(action, target, sender){
        if (sender === undefined){
            sender = this;
        }
        if (target === undefined){
            target = null;
        }
        target = this.firstTargetForAction(action, target, sender);
        if (target !== null){
            target[action](sender);
        }
    },

    // MARK: - Touch Event Conversion

    touchesBegan: function(touches, event){
        // The application should be the final responder, so if a touch gets
        // all the way here, it means nothing handled it, and we should try
        // to re-send it as a mouse event to see if something handles that
        var touch = touches[0];
        var location = touch.window.convertPointToScreen(touch.locationInWindow);
        this.windowServer.createMouseEvent(UIEvent.Type.leftMouseDown, event.timestamp, location);
    },

    touchesMoved: function(touches, event){
        var touch = touches[0];
        var location = touch.window.convertPointToScreen(touch.locationInWindow);
        this.windowServer.createMouseEvent(UIEvent.Type.leftMouseDragged, event.timestamp, location);
    },

    touchesEnded: function(touches, event){
        var touch = touches[0];
        var location = touch.window.convertPointToScreen(touch.locationInWindow);
        this.windowServer.createMouseEvent(UIEvent.Type.leftMouseUp, event.timestamp, location);
    },

    touchesCanceled: function(touches, event){
        var touch = touches[0];
        var location = touch.window.convertPointToScreen(touch.locationInWindow);
        this.windowServer.createMouseEvent(UIEvent.Type.leftMouseUp, event.timestamp, location);
    }

});

UIApplication.InfoKeys = {
    launchOptions: "UIApplicationLaunchOptions",
    mainSpec: "UIMainSpec",
    applicationDelegate: "UIApplicationDelegate",
    systemFont: "UIApplicationSystemFont",
    requiresUserDefaults: "UIApplicationRequiresUserDefaults",
    requiresFileManager: "UIApplicationRequiresFileManager"
};

UIApplication.LaunchOptions = {
    state: "UIApplicationLaunchOptionState"
};

Object.defineProperty(UIApplication, 'shared', {
    configurable: true,
    get: function UIApplication_getSharedApplication(){
        return shared;
    }
});

UIApplication.LaunchFailureReason = {
    exception: 'Exception',
    filestyemNotAvailable: 'File System Not Available',
    upgradeRequiresNoOtherInstances: 'Upgrade Requires No Other Instances'
};

})();
