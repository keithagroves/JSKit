// #import "UIKit/UIView.js"
// #import "UIKit/UIApplication.js"
// #import "UIKit/UITouch.js"
/* global JSClass, UIView, JSColor, JSSize, JSRect, JSInsets, JSDynamicProperty, JSReadOnlyProperty, UIWindow, JSPoint, UIApplication, UIEvent, UITouch */
'use strict';

JSClass('UIWindow', UIView, {

    // -------------------------------------------------------------------------
    // MARK: - Creating a Window

    init: function(){
        UIWindow.$super.init.call(this);
        this._application = UIApplication.sharedApplication;
        this._commonWindowInit();
    },

    initWithApplication: function(application){
        UIWindow.$super.init.call(this);
        this._application = application;
        this._commonWindowInit();
    },

    initWithSpec: function(spec, values){
        UIWindow.$super.initWithSpec.call(this, spec, values);
        if ('contentViewController' in values){
            this.contentViewController = spec.resolvedValue(values.contentViewController, "UIViewController");
        }else if ('contentView' in values){
            this.contentView = spec.resolvedValue(values.contentView, "UIView");
        }
        this._application = UIApplication.sharedApplication;
        this._commonWindowInit();
        if ('contentInsets' in values){
            this._contentInsets = JSInsets.apply(undefined, values.contentInsets.parseNumberArray());
        }
        if ('isUserMovable' in values){
            this.isUserMovable = values.isUserMovable;
        }
        if ('firstResponder' in values){
            this._initialFirstResponder = spec.resolvedValue(values.firstResponder);
        }
        if ('heightTracksContent' in values){
            this._heightTracksContent = values.heightTracksContent;
        }
        if ('widthTracksContent' in values){
            this._widthTracksContent = values.widthTracksContent;
        }
    },

    _commonWindowInit: function(){
        this.window = this;
        if (this.backgroundColor === null){
            this.backgroundColor = JSColor.whiteColor;
        }
        this.clipsToBounds = true;
        if (this._contentView === null){
            this._contentView = UIView.init();
        }
        this._contentInsets = JSInsets.Zero;
    },

    // -------------------------------------------------------------------------
    // MARK: - Content View

    contentViewController: JSDynamicProperty('_contentViewController', null),
    contentView: JSDynamicProperty('_contentView', null),
    contentInsets: JSDynamicProperty('_contentInsets', null),

    setContentView: function(contentView){
        if (contentView === null){
            contentView = UIView.init();
        }
        if (this._contentView !== null){
            this._contentView.removeFromSuperview();
        }
        this._contentView = contentView;
        this._contentViewController = null;
        if (this._contentView !== null){
            this.addSubview(this._contentView);
        }
        this.setNeedsLayout();
    },

    setContentViewController: function(contentViewController){
        if (this._contentViewController !== null && this._contentViewControllerHasAppeared){
            this._contentViewController.viewWillDisappear();
        }
        this.contentView = contentViewController.view;
        if (this._contentViewController !== null && this._contentViewControllerHasAppeared){
            this._contentViewController.viewDidDisappear();
        }
        this._contentViewController = contentViewController;
    },

    setContentInsets: function(contentInsets){
        this._contentInsets = JSInsets(contentInsets);
        this.setNeedsLayout();
    },

    heightTracksContent: JSDynamicProperty('_heightTracksContent', false),
    widthTracksContent: JSDynamicProperty('_widthTracksContent', false),

    setHeightTracksContent: function(heightTracksContent){
        this._heightTracksContent = heightTracksContent;
        this.setNeedsLayout();
    },

    setWidthTracksContent: function(widthTracksContent){
        this._widthTracksContent = widthTracksContent;
        this.setNeedsLayout();
    },

    // -------------------------------------------------------------------------
    // MARK: - Layout

    sizeToFit: function(){
        if (this._widthTracksContent || this._heightTracksContent){
            var size = JSSize(Number.MAX_VALUE, Number.MAX_VALUE);
            if (!this._widthTracksContent){
                size.width = this.bounds.size.width - this._contentInsets.left - this._contentInsets.right;
            }
            if (!this._heightTracksContent){
                size.height = this.bounds.size.height - this._contentInsets.top - this._contentInsets.bottom;
            }
            var fitSize;
            if (this.viewController){
                fitSize = this.viewController.contentSizeThatFitsSize(size);
            }else{
                this._contentView.sizeToFitSize(size);
                fitSize = this._contentView.frame.size;
            }

            this.bounds = JSRect(
                0,
                0,
                fitSize.width + this._contentInsets.left + this._contentInsets.right,
                fitSize.height + this._contentInsets.top + this._contentInsets.bottom
            );
        }
    },

    layoutSubviews: function(){
        UIWindow.$super.layoutSubviews.call(this);
        this._contentView.frame = this.bounds.rectWithInsets(this._contentInsets);
    },

    // -------------------------------------------------------------------------
    // MARK: - Key Window

    canBecomeMainWindow: function(){
        return true;
    },

    canBecomeKeyWindow: function(){
        return true;
    },

    canBecomeFirstResponder: function(){
        return true;
    },

    makeVisible: function(){
        this.windowServer.makeWindowVisible(this);
        if (this.viewController){
            this.viewController.viewWillAppear(false);
        }else if (this._contentViewController){
            this._contentViewController.viewWillAppear(false);
        }
    },

    makeKey: function(){
        this.windowServer.makeWindowKey(this);
    },

    makeMain: function(){
        this.windowServer.makeWindowMain(this);
    },

    makeKeyAndVisible: function(){
        this.windowServer.makeWindowKeyAndVisible(this);
    },

    orderFront: function(){
        this.windowServer.orderWindowFront(this);
    },

    didBecomeVisible: function(){
        if (this.viewController){
            this.viewController.viewDidAppear(false);
        }else if (this._contentViewController){
            this._contentViewController.viewDidAppear(false);
        }
        if (this._initialFirstResponder !== null){
            var responder = this._initialFirstResponder;
            this._initialFirstResponder = null;
            this.setFirstResponder(responder);
        }
    },

    didClose: function(){
        if (this.viewController){
            this.viewController.viewDidDisappear(false);
        }else if (this._contentViewController){
            this._contentViewController.viewDidDisappear(false);
        }
    },

    // -------------------------------------------------------------------------
    // MARK: - Closing

    close: function(){
        if (this.viewController){
            this.viewController.viewWillDisappear(false);
        }else if (this._contentViewController){
            this._contentViewController.viewWillDisappear(false);
        }
        this.windowServer.windowRemoved(this);
    },

    // -------------------------------------------------------------------------
    // MARK: - Window Server

    windowServer: JSReadOnlyProperty(),
    application: JSReadOnlyProperty('_application', null),
    scene: JSReadOnlyProperty('_scene', null),
    screen: JSReadOnlyProperty('_screen', null),
    level: 0,

    getWindowServer: function(){
        if (this._application !== null){
            return this._application.windowServer;
        }
        return null;
    },

    // -------------------------------------------------------------------------
    // MARK: - Events

    isUserMovable: true,
    _downLocation: null,
    _downOrigin: null,
    _isMoving: false,

    mouseDown: function(event){
        // this.setFirstResponder(null);
        if (this.level == UIWindow.Level.normal && this.isUserMovable){
            this._downLocation = this.convertPointToScreen(event.locationInWindow);
            this._downOrigin = JSPoint(this.frame.origin);
            this._isMoving = true;
        }
    },

    mouseDragged: function(event){
        if (!this._isMoving){
            return;
        }
        var location = this.convertPointToScreen(event.locationInWindow);
        var d = JSPoint(location.x - this._downLocation.x, location.y - this._downLocation.y);
        var origin = JSPoint(this._downOrigin.x + d.x, this._downOrigin.y + d.y);
        var safeArea = this.screen.availableFrame;
        var over = JSPoint(origin.x - safeArea.origin.x - safeArea.size.width, origin.y - safeArea.origin.y - safeArea.size.height);
        if (over.x > 0){
            origin.x -= over.x;
        }
        if (over.y > 0){
            origin.y -= over.y;
        }
        if (origin.y < safeArea.origin.y){
            origin.y = safeArea.origin.y;
        }
        this.frame = JSRect(origin, this.frame.size);
    },

    mouseUp: function(){
        this._downLocation = null;
        this._downOrigin = null;
    },

    // -------------------------------------------------------------------------
    // MARK: - First Responder

    firstResponder: JSDynamicProperty('_firstResponder', null),
    _initialFirstResponder: null,

    getFirstResponder: function(){
        return this._firstResponder;
    },

    setFirstResponder: function(responder){
        if (responder !== this._firstResponder){
            var previousResponder = this._firstResponder;
            var didResignResponder = true;
            if (this._firstResponder !== null){
                if (this._firstResponder.canResignFirstResponder()){
                    this._firstResponder.resignFirstResponder();
                    this._firstResponder = null;
                    didResignResponder = true;
                }else{
                    didResignResponder = false;
                }
            }
            if (didResignResponder && responder !== null){
                if (responder.canBecomeFirstResponder()){
                    responder.becomeFirstResponder();
                    this._firstResponder = responder;
                }
            }
            if (this._firstResponder !== previousResponder){
                this.windowServer.windowDidChangeResponder(this);
            }
        }
    },

    setFirstResponderToKeyViewAfterView: function(view){
        if (view === null){
            return;
        }
        var haveLooped = false;
        var next;
        do {
            next = view.nextKeyView;
            if (next === null && !haveLooped){
                next = this.nextKeyView;
                haveLooped = true;
            }
        } while (next !== null && (next.hidden || !next.canBecomeFirstResponder()));
        if (next !== null){
            this.firstResponder = next;
        }
    },

    setFirstResponderToKeyViewBeforeView: function(view){
        if (view === null){
            return;
        }
        var keyView = this.nextKeyView;
        // TODO:
    },

    getNextResponder: function(){
        return this._application;
    },

    // -------------------------------------------------------------------------
    // MARK: - Coordinate Space Conversions

    convertPointFromScreen: function(point){
        if (this._screen === null){
            return null;
        }
        return this.layer._convertPointFromSuperlayer(JSPoint(point.x - this._screen.frame.origin.x, point.y - this.screen.frame.origin.y));
    },

    convertPointToScreen: function(point){
        if (this._screen === null){
            return null;
        }
        point = this.layer._convertPointToSuperlayer(point);
        return JSPoint(point.x + this._screen.frame.origin.x, point.y + this._screen.frame.origin.y);
    },

    convertRectFromScreen: function(rect){
        if (this._screen === null){
            return null;
        }
        return JSRect(this.convertPointFromScreen(rect.origin), rect.size);
    },

    convertRectToScreen: function(rect){
        if (this._screen === null){
            return null;
        }
        return JSRect(this.convertPointToScreen(rect.origin), rect.size);
    },

    // -------------------------------------------------------------------------
    // MARK: - Event Dispatch

    receivesAllEvents: false,

    sendEvent: function(event){
        switch (event.category){
            case UIEvent.Category.mouse:
                this._sendMouseEvent(event);
                break;
            case UIEvent.Category.key:
                this._sendKeyEvent(event);
                break;
            case UIEvent.Category.touches:
                this._sendTouchEvent(event);
                break;
            case UIEvent.Category.scroll:
                this._sendScrollEvent(event);
                break;
        }
    },

    adoptMouseEvents: function(fromWindow){
        this.mouseEventView = this;
        this.mouseDownType = fromWindow.mouseDownType;
    },

    cancelMouseEvents: function(){
        this.mouseEventView = null;
        this.mouseDownType = null;
    },

    shouldReceiveTrackingInBack: false,

    mouseEventView: null,
    mouseDownType: null,

    _sendMouseEvent: function(event){
        if (this.mouseEventView === null && event.type == UIEvent.Type.leftMouseDown || event.type == UIEvent.Type.rightMouseDown){
            this.mouseEventView = this.hitTest(event.locationInWindow);
            if (this.receivesAllEvents && this.mouseEventView === null){
                this.mouseEventView = this;
            }
            this.mouseDownType = event.type;
        }
        var eventTarget = event.trackingView || this.mouseEventView;
        if (eventTarget === null){
            return;
        }
        switch (event.type){
            case UIEvent.Type.leftMouseDown:
                this.orderFront();
                if (this.canBecomeKeyWindow() && this.windowServer.keyWindow !== this){
                    this.makeKey();
                }else if (this.canBecomeMainWindow() && this.windowServer.mainWindow !== this){
                    this.makeMain();
                }
                eventTarget.mouseDown(event);
                break;
            case UIEvent.Type.leftMouseUp:
                eventTarget.mouseUp(event);
                if (this.mouseDownType == UIEvent.Type.leftMouseDown){
                    this.mouseEventView = null;
                }
                break;
            case UIEvent.Type.leftMouseDragged:
                eventTarget.mouseDragged(event);
                break;
            case UIEvent.Type.rightMouseDown:
                eventTarget.rightMouseDown(event);
                break;
            case UIEvent.Type.rightMouseUp:
                eventTarget.rightMouseUp(event);
                if (this.mouseDownType == UIEvent.Type.rightMouseDown){
                    this.mouseEventView = null;
                }
                break;
            case UIEvent.Type.rightMouseDragged:
                eventTarget.rightMouseDragged(event);
                break;
            case UIEvent.Type.mouseEntered:
                eventTarget.mouseEntered(event);
                break;
            case UIEvent.Type.mouseExited:
                eventTarget.mouseExited(event);
                break;
            case UIEvent.Type.mouseMoved:
                eventTarget.mouseMoved(event);
                break;
        }

    },

    _sendScrollEvent: function(event){
        var view = this.hitTest(event.locationInWindow);
        if (view){
            switch (event.type){
                case UIEvent.Type.scrollWheel:
                    view.scrollWheel(event);
                    break;
            }
        }
    },

    _sendTouchEvent: function(event){
        var touches = event.touchesInWindow(this);
        var touchesByView = {};
        var view;
        for (var i = 0, l = touches.length; i < l; ++i){
            // We only dispatch the touches that changed in this version of the event.
            // A view can get all the touches it wants from the event.
            if (touches[i].timestamp == event.timestamp){
                view = this.hitTest(touches[i].locationInWindow) || this;
                if (!touchesByView[view.objectID]){
                    touchesByView[view.objectID] = {view: view, touches: []};
                }
                touchesByView[view.objectID].touches.push(touches[i]);
            }
        }
        for (var id in touchesByView){
            view = touchesByView[id].view;
            touches = touchesByView[id].touches;
            if (!view.isMultipleTouchEnabled){
                touches = [touches[0]];
            }
            this._sendEventTouchesToView(event, touches, touchesByView[id].view);
        }
    },

    _sendEventTouchesToView: function(event, touches, view){
        var touchesByPhase = {};
        touchesByPhase[UITouch.Phase.began] = {method: 'touchesBegan', touches: []};
        touchesByPhase[UITouch.Phase.moved] = {method: 'touchesMoved', touches: []};
        touchesByPhase[UITouch.Phase.ended] = {method: 'touchesEnded', touches: []};
        touchesByPhase[UITouch.Phase.canceled] = {method: 'touchesCanceled', touches: []};
        for (var i = 0, l = touches.length; i < l; ++i){
            touchesByPhase[touches[i].phase].touches.push(touches[i]);
        }
        for (var phase in touchesByPhase){
            if (touchesByPhase[phase].touches.length > 0){
                view[touchesByPhase[phase].method](touchesByPhase[phase].touches, event);
            }
        }
    },

    _sendKeyEvent: function(event){
        var view = this._firstResponder || this;
        if (view){
            switch (event.type){
                case UIEvent.Type.keyDown:
                    view.keyDown(event);
                    break;
                case UIEvent.Type.keyUp:
                    view.keyUp(event);
                    break;
            }
        }
    }

});

UIWindow.Level = {
    back: -1,
    normal: 0,
    front: 1,
};