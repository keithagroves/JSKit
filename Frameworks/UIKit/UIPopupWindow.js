// #import "UIKit/UIWindow.js"
/* global JSClass, UIWindow, UIPopupWindow, UIWindowStyler */
'use strict';

JSClass("UIPopupWindow", UIWindow, {

    sourceView: null,
    preferredPlacement: null,

    openAdjacentToView: function(view, preferredPlacement){
        // TODO: set frame
        this.makeKeyAndOrderFront();
    },

});

JSClass("UIPopupWindowStyler", UIWindowStyler, {

});

UIPopupWindow.Placement = {
    above: 0,
    below: 1,
    left: 2,
    right: 3
};