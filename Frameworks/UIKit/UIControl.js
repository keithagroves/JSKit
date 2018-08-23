// #import "UIKit/UIView.js"
/* global JSClass, JSObject, UIView, UIControl, JSReadOnlyProperty, JSDynamicProperty, JSRect, JSSize */
'use strict';

JSClass("UIControl", UIView, {

    // MARK: - Creating a Control

    init: function(){
        this.initWithFrame(JSRect(0, 0, 100, 100));
    },

    initWithStyler: function(styler){
        this._styler = styler;
        this.initWithFrame(JSRect(0, 0, 100, 100));
    },

    initWithFrame: function(frame){
        UIControl.$super.initWithFrame.call(this, frame);
        this.commonUIControlInit();
    },

    initWithSpec: function(spec, values){
        UIControl.$super.initWithSpec.call(this, spec, values);
        if ('styler' in values){
            this._styler = spec.resolvedValue(values.styler);
        }
        this.commonUIControlInit();
        if (('target' in values) && ('action' in values)){
            var target = spec.resolvedValue(values.target);
            var action = target[spec.resolvedValue(values.action)];
            if (!action){
                throw new Error("Missing action on target: %s.%s".sprintf(values.target, values.action));
            }
            this.addTargetedAction(target, action);
        }
    },

    commonUIControlInit: function(){
        this._actionsByEvent = {};
        this._state = UIControl.State.normal;
        this.stylerProperties = {};
    },

    // MARK: - Styler

    styler: JSReadOnlyProperty('_styler', null),
    stylerProperties:  null,

    layoutSubviews: function(){
        UIControl.$super.layoutSubviews.call(this);
        if (this._styler !== null){
            this._styler.layoutControl(this);
        }
    },

    drawLayerInContext: function(layer, context){
        if (this._styler !== null){
            this._styler.drawControlLayerInContext(this, layer, context);
        }
    },

    getIntrinsicSize: function(){
        if (this._styler !== null){
            return this._styler.intrinsicSizeOfControl(this);
        }
        return UIControl.$super.getIntrinsicSize.call(this);
    },

    sizeToFit: function(){
        this.sizeToFitSize(JSSize(Number.MAX_VALUE, Number.MAX_VALUE));
    },

    sizeToFitSize: function(size){
        if (this._styler !== null){
            this._styler.sizeControlToFitSize(this, size);
        }else{
            UIControl.$super.sizeToFitSize.call(this, size);
        }
    },

    // MARK: - Actions

    _actionsByEvent: null,

    addTargetedAction: function(target, action){
        this.addTargetedActionForEvent(target, action, UIControl.Event.primaryAction);
    },

    addAction: function(action){
        this.addActionForEvent(action, UIControl.Event.primaryAction);
    },

    addTargetedActionForEvent: function(target, action, controlEvent){
        return this.addActionForEvent(action.bind(target), controlEvent);
    },

    addActionForEvent: function(action, controlEvent){
        var actions = this._actionsByEvent[controlEvent];
        if (!actions){
            actions = [];
            this._actionsByEvent[controlEvent] = actions;
        }
        actions.push(action);
        return action;
    },

    removeActionForEvent: function(action, controlEvent){
        var actions = this._actionsByEvent[controlEvent];
        if (actions){
            for (var i = actions.length - 1; i >= 0; --i){
                if (actions[i] === action){
                    actions.splice(i, 1);
                }
            }
        }
    },

    sendActionsForEvent: function(controlEvent){
        var actions = this._actionsByEvent[controlEvent];
        if (actions){
            for (var i = 0; i < actions.length; ++i){
                actions[i](this);
            }
        }
    },

    // MARK: - State

    state: JSReadOnlyProperty('_state', null),
    enabled: JSDynamicProperty(null, null, 'isEnabled'),
    over: JSDynamicProperty(null, null, 'isOver'),
    active: JSDynamicProperty(null, null, 'isActive'),
    dropTarget: JSDynamicProperty(null, null, 'isDropTarget'),

    _updateState: function(newState){
        if (newState != this._state){
            var wasEnabled = this.isEnabled();
            this._state = newState;
            var isEnabled = this.isEnabled();
            if (this.hasOverState && wasEnabled != isEnabled){
                if (isEnabled){
                    this.startMouseTracking(UIView.MouseTracking.enterAndExit);
                }else{
                    this.stopMouseTracking();
                }
            }
            this.update();
        }
    },

    update: function(){
        if (this._styler !== null){
            this._styler.updateControl(this);
        }
    },

    _toggleState: function(flag, on){
        var newState = this._state;
        if (on){
            newState |= flag;
        }else{
            newState &= ~flag;
        }
        this._updateState(newState);
    },

    isEnabled: function(){
        return (this._state & UIControl.State.disabled) === 0;
    },

    setEnabled: function(isEnabled){  
        this._toggleState(UIControl.State.disabled, !isEnabled);
        if (!isEnabled && this.window && this.window.firstResponder === this){
            this.window.firstResponder = null;
        }
    },

    isOver: function(){
        return (this._state & UIControl.State.over) === UIControl.State.over;
    },

    setOver: function(isOver){
        this._toggleState(UIControl.State.over, isOver);
    },

    isActive: function(){
        return (this._state & UIControl.State.active) === UIControl.State.active;
    },

    setActive: function(isActive){
        this._toggleState(UIControl.State.active, isActive);
    },

    isDropTarget: function(){
        return (this._state & UIControl.State.dropTarget) === UIControl.State.dropTarget;
    },

    setDropTarget: function(isDropTarget){
        this._toggleState(UIControl.State.dropTarget, isDropTarget);
    },

    // MARK: - Mouse Tracking

    hasOverState: false,
    _hasSetInitialTracking: false,

    mouseEntered: function(event){
        if (!this.enabled){
            return;
        }
        this.over = true;
    },

    mouseExited: function(event){
        this.over = false;
    },

    rightMouseDown: function(){
        // Do nothing by default, so the event doesn't propagate to the next
        // responder.  Subclasses can override as needed
    },

    setWindow: function(window){
        if (!this._hasSetInitialTracking){
            if (this.hasOverState && this.enabled){
                this.startMouseTracking(UIView.MouseTracking.enterAndExit);
            }
            this._hasSetInitialTracking = true;
        }
        UIControl.$super.setWindow.call(this, window);
    }

});

JSClass("UIControlStyler", JSObject, {

    showsOverState: false,

    initializeControl: function(control){
    },

    updateControl: function(control){
    },

    layoutControl: function(control){
    },

    intrinsicSizeOfControl: function(control){
        return JSSize(UIView.noIntrinsicSize, UIView.noIntrinsicSize);
    },

    sizeControlToFitSize: function(control, size){
        control.layer.sizeToFitSize(size);
    },

    drawControlLayerInContext: function(control, layer, context){
    }

});

UIControl.State = {
    normal:     0,
    over:       1 << 0,
    active:     1 << 1,
    disabled:   1 << 2,
    dropTarget: 1 << 3,
    firstUserState: 1 << 16
};

UIControl.Event = {
    primaryAction:      1 << 0,
    valueChanged:       1 << 1,
    editingDidBegin:    1 << 2,
    editingChanged:     1 << 3,
    editingDidEnd:      1 << 4,
    firstUserEvent:     1 << 16
};