// #import "UIKit/UILayer.js"
// #import "UIKit/UIWindowServer.js"
/* global JSClass, JSDynamicProperty, JSReadOnlyProperty, JSRect, JSPoint, JSSize, JSInsets, UILayer, UITextLayer, JSAttributedString, JSTextLayoutManager, JSTextContainer, JSTextStorage, UIWindowServer */
'use strict';

JSClass("UITextLayer", UILayer, {

    text: JSDynamicProperty(),
    attributedText: JSDynamicProperty(),
    font: JSDynamicProperty(),
    textColor: JSDynamicProperty(),
    lineBreakMode: JSDynamicProperty(),
    textAlignment: JSDynamicProperty(),
    textInsets: JSDynamicProperty('_textInsets', JSInsets.Zero),
    maximumNumberOfLines: JSDynamicProperty(),
    widthTracksText: JSDynamicProperty('_widthTracksText', false),
    heightTracksText: JSDynamicProperty('_heightTracksText', false),

    _textStorage: null,
    textLayoutManager: JSReadOnlyProperty('_textLayoutManager', null),
    textContainer: JSReadOnlyProperty('_textContainer', null),
    _hasSetDisplayFramesetter: false,

    // MARK: - Creating a UITextLayer

    init: function(){
        UITextLayer.$super.init.call(this);
        this._commonTextLayerInit();
    },

    _commonTextLayerInit: function(){
        this._textLayoutManager = JSTextLayoutManager.init();
        this._textLayoutManager.delegate = this;
        this._textContainer = JSTextContainer.initWithSize(this._availableTextSize());
        this._textStorage = JSTextStorage.init();
        this._textStorage.addLayoutManager(this._textLayoutManager);
        this._textLayoutManager.addTextContainer(this._textContainer);
        this.setNeedsLayout();
    },

    didChangeSize: function(){
        UITextLayer.$super.didChangeSize.call(this);
        this._textContainer.size = this._availableTextSize();
    },

    // MARK: - Styling

    getFont: function(){
        return this._textLayoutManager.defaultFont;
    },

    setFont: function(font){
        this._textLayoutManager.defaultFont = font;
    },

    getTextColor: function(){
        return this._textLayoutManager.defaultTextColor;
    },

    setTextColor: function(color){
        this._textLayoutManager.defaultTextColor = color;
        this.setNeedsDisplay();
    },

    getLineBreakMode: function(){
        return this._textContainer.lineBreakMode;
    },

    setLineBreakMode: function(lineBreakMode){
        this._textContainer.lineBreakMode = lineBreakMode;
    },

    getTextAlignment: function(){
        return this._textContainer.textAlignment;
    },

    setTextAlignment: function(textAlignment){
        this._textContainer.textAlignment = textAlignment;
    },

    setTextInsets: function(insets){
        this._textInsets = JSInsets(insets);
        this._textContainer.size = this._availableTextSize();
    },

    getMaximumNumberOfLines: function(){
        return this._textContainer.maximumNumberOfLines;
    },

    setMaximumNumberOfLines: function(maxLines){
        this._textContainer.maximumNumberOfLines = maxLines;
        this._textContainer.size = this._availableTextSize();
    },

    getWidthTracksText: function(){
        return this._widthTracksText;
    },

    setWidthTracksText: function(widthTracksText){
        this._widthTracksText = widthTracksText;
        this._textContainer.size = this._availableTextSize();
    },

    getHeightTracksText: function(){
        return this._heightTracksText;
    },

    setHeightTracksText: function(heightTracksText){
        this._heightTracksText = heightTracksText;
        this._textContainer.size = this._availableTextSize();
    },

    // MARK: - Fetching & Updating Text

    getText: function(){
        return this._textStorage.string;
    },

    setText: function(text){
        this.setAttributedText(JSAttributedString.initWithString(text));
    },

    getAttributedText: function(){
        return this._textStorage;
    },

    setAttributedText: function(text){
        if (!text.isKindOfClass(JSTextStorage)){
            text = JSTextStorage.initWithAttributedString(text);
        }
        this._textStorage = text;
        this._textLayoutManager.replaceTextStorage(this._textStorage);
        this.setNeedsDisplay();
    },

    // MARK: - Converting coordinates to Text Container

    convertPointToTextContainer: function(point){
        return JSPoint(point.x - this._textContainer.origin.x, point.y - this._textContainer.origin.y);
    },

    // MARK: - Drawing

    _availableTextSize: function(){
        var width = this.bounds.size.width - this._textInsets.left - this._textInsets.right;
        var height = this.bounds.size.height - this._textInsets.top - this._textInsets.bottom;
        if (this._widthTracksText){
            width = Number.MAX_VALUE;
        }
        if (this._heightTracksText){
            height = Number.MAX_VALUE;
        }
        return JSSize(width, height);
    },

    drawInContext: function(context){
        var textOrigin = JSPoint(this._textInsets.left, this._textInsets.top);
        this._textLayoutManager.layoutIfNeeded();
        this._textLayoutManager.drawContainerInContextAtPoint(this._textContainer, context, textOrigin);
    },

    sizeToFit: function(){
        this._textContainer.size = JSSize(Number.MAX_VALUE, Number.MAX_VALUE);
        this.layoutIfNeeded();
        if (this._textContainer.textFrame !== null){
            var width = this._textContainer.textFrame.size.width + this._textInsets.left + this._textInsets.right;
            var height = this._textContainer.textFrame.size.height + this._textInsets.top + this._textInsets.bottom;
            if (width != this.bounds.width || height != this.bounds.height){
                this.bounds = JSRect(0, 0, width, height);
            }
        }
    },

    layoutSublayers: function(){
        UITextLayer.$super.layoutSublayers.call(this);
        if (this._displayServer !== null){
            if (!this._hasSetDisplayFramesetter){
                this._textContainer.framesetter = this._displayServer.createTextFramesetter();
                this._hasSetDisplayFramesetter = true;
            }
            this._textContainer.origin = JSPoint(this._textInsets.left, this._textInsets.top);
            this._textLayoutManager.layoutIfNeeded();
        }
        if ((this._widthTracksText || this._heightTracksText) && this._textContainer.textFrame !== null){
            var width = this.bounds.size.width;
            var height = this.bounds.size.height;
            if (this._widthTracksText){
                width = this._textContainer.textFrame.size.width + this._textInsets.left + this._textInsets.right;
            }
            if (this._heightTracksText){
                height = this._textContainer.textFrame.size.height + this._textInsets.top + this._textInsets.bottom;
            }
            this.bounds = JSRect(0, 0, width, height);
        }
    },

    // MARK: - Layout Manager delegate

    layoutManagerDidInvalidateLayout: function(layoutManager){
        this.setNeedsLayout();
        this.setNeedsDisplay();
    },

    layoutManagerTextContainerForLocation: function(layoutManager, location){
        return this._textContainer;
    }

});