// #import "Foundation/Foundation.js"
// #import "UIKit/UIHTMLTextLine.js"
/* global JSClass, JSTextFrame, UIHTMLTextFrame, UIHTMLTextLine, JSAttributedString, JSRange, JSFont, JSPoint, JSLineBreakMode, JSRect, JSSize */
'use strict';

(function(){

JSClass("UIHTMLTextFrame", JSTextFrame, {

    element: null,

    initWithReusableElement: function(element, size){
        UIHTMLTextFrame.$super.initWithSize.call(this, size);
        this.element = element;
        this.element.style.width = '%dpx'.sprintf(this.size.width);
        this.element.style.height = '%dpx'.sprintf(this.size.height);

        // this.shade = this.element.appendChild(domDocument.createElement('div'));
        // this.shade.style.position = 'absolute';
        // this.shade.style.top = '0';
        // this.shade.style.left = '0';
        // this.shade.style.bottom = '0';
        // this.shade.style.right = '0';
        // this.shade.style.backgroundColor = 'rgba(255,0,0,0.3)';
    },

    initWithDocument: function(domDocument, size){
        this.initWithReusableElement(domDocument.createElement('div'), size);
        this.element.style.position = 'absolute';
        this.element.dataset.uiText = "frame";
    },

    drawInContextAtPoint: function(context, point){
        this.element.style.left = '%dpx'.sprintf(point.x);
        this.element.style.top = '%dpx'.sprintf(point.y);
        context.addExternalElement(this.element);
    },

    addLine: function(line){
        UIHTMLTextFrame.$super.addLine.call(this, line);
        if (line.element.parentNode !== this.element){
            this.element.appendChild(line.element);
        }
    }

    /*
    _reusableLines: null,

    createLine: function(){
        return this._dequeueReusableLine();
    },

    layout: function(firstCharacterIndex){
        this._prepareForLayout();
        var consumed = UIHTMLTextFrame.$super.layout.call(this, firstCharacterIndex);
        this._cleanupAfterLayout();
        return consumed;
    },

    _prepareForLayout: function(){
        for (var i = 0, l = this._lines.length; i < l; ++i){
            this._enqueueReusableLine(this._lines[i]);
        }
        this._lines = [];
        this.element.style.width = '%dpx'.sprintf(this.size.width);
        this.element.style.height = '%dpx'.sprintf(this.size.height);
    },

    _cleanupAfterLayout: function(){
        var line;
        for (var i = 0, l = this._reusableLines.length; i < l; ++i){
            line = this._reusableLines[i];
            line.element.parentNode.removeChild(line.element);
        }
        this._reusableLines = [];
    },

    _enqueueReusableLine: function(line){
        this._reusableLines.push(line);
    },

    _dequeueReusableLine: function(){
        if (this._reusableLines.length > 0){
            return this._reusableLines.shift();
        }
        var doc = this.element.ownerDocument;
        var line = UIHTMLTextLine.initWithDocument(doc);
        this.element.appendChild(line.element);
        this._lines.append(line);
        // TODO: update line to match truncation mode
        // TODO: set initial span to match attributes
        return line;
    }

    */

});

})();