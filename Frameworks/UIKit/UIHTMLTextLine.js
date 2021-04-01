// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// #import Foundation
// #import "UIHTMLTextRun.js"
// jshint browser: true
'use strict';

(function(){

JSClass("UIHTMLTextLine", JSTextLine, {

    element: null,
    emptyTextNode: null,
    attachments: null,
    overflowed: false,
    fontLineHeight: 0,

    initWithElementAndFont: function(element, font, height, location){
        UIHTMLTextLine.$super.initWithHeight.call(this, height, -font.displayDescender, location);
        this.element = element;
        element.style.font = font.cssString(height);
        this.emptyTextNode = element.appendChild(element.ownerDocument.createTextNode('\u200B'));
        this.fontLineHeight = font.displayLineHeight;
        this.attachments = [];
        this.element.dataset.rangeLocation = location;
        this.element.dataset.rangeLength = 0;
        this.element.dataset.jstext = "line";
    },

    initWithElement: function(element, runs, trailingWhitespaceWidth, attachments){
        // constructing this.element before super init because super init calls
        // this.align, which neesd to use this.element
        UIHTMLTextLine.$super.initWithRuns.call(this, runs, trailingWhitespaceWidth);
        this.element = element;
        this.attachments = attachments || [];
        var run;
        for (var i = 0, l = runs.length; i < l; ++i){
            run = this.runs[i];
            if (run.element.parentNode !== this.element){
                this.element.appendChild(run.element);
            }
        }
        this.element.dataset.rangeLocation = this._range.location;
        this.element.dataset.rangeLength = this._range.length;
        this.element.dataset.jstext = "line";
    },

    // verticallyAlignRuns: function(){
    //     // HTML does this for us
    // },

    truncatedLine: function(width, token){
        if (!this.overflowed || width === Number.MAX_VALUE || width === 0){
            return this;
        }

        if (token === undefined){
            token = '\u2026';
        }

        this.element.style.maxWidth = '%dpx'.sprintf(width);
        this.element.style.overflow = 'hidden';
        // only firefox supports an arbitrary string as the token, so for now
        // we'll just hard code ellipsis
        this.element.style.textOverflow = 'ellipsis';

        // Adopt relevant styles from the final run, otherwise the ellipis will
        // use the style of the line div.  Currently this only adopts text color,
        // and font, taking care to keep our line height 0;
        if (this._runs.length > 0){
            var lastRun = this._runs[this._runs.length - 1];
            this.element.style.color = lastRun.element.style.color;
            this.element.style.font = lastRun.element.style.font;
            this.element.style.lineHeight = '0';
        }

        // Add an ellipsis...if it fits, great!  If not, we'll get the html generated ellipis
        this.element.appendChild(this.element.ownerDocument.createTextNode(token));

        // TODO: add JSTextRun with ellipsis (in case this line is drawn to a non-html context, and so .runs is consistent)
        // but this would also possibly require backing up 1+ characters to make enough room for the ellipis

        // This should perhaps return a copy, but for our current use cases,
        // there's no need to copy since the original line gets abandoned.
        return this;
    },

    rectForEmptyCharacter: function(){
        return JSRect(0, 0, 0, this.fontLineHeight);
    },

    domSelectionPointForCharacterAtIndex: function(index){
        if (this.range.length === 0){
            return {node: this.emptyTextNode, offset: 0};
        }
        var run = this.runForCharacterAtIndex(index);
        if (run !== null){
            return run.domSelectionPointForCharacterAtIndex(index);
        }
        return {node: this.element, offset: 0};
    },

    debugDescription: JSReadOnlyProperty(),

    getDebugDescription: function(){
        if (this.emptyTextNode !== null){
            "  %dx%d @%d->%d [empty]".sprintf(this._size.width, this._size.height, this._range.location, this._range.end);
        }
        var lines = [];
        lines.push(["  %dx%d @%d->%d".sprintf(this._size.width, this._size.height, this._range.location, this._range.end)]);
        for (var i = 0, l = this.runs.length; i < l; ++i){
            lines.push(this.runs[i].debugDescription);
        }
        return lines.join("\n");
    },

    recalculateSize: function(){
        var lineClientRect = this.element.getBoundingClientRect();
        var runClientRect;
        // The line height should already be an integer, because it is derived from its
        // runs, which use integer font.displayLineHeight values for their heights.
        // However, the width may be a non-integer.  We round up because if we don't,
        // the browser may round down when we ask for a line to be X.y pixels wide, and
        // that wouldn't leave enough space for the final character.
        this._size = JSSize(Math.ceil(lineClientRect.width), this.size.height);
        var run;
        for (var i = 0, l = this.runs.length; i < l; ++i){
            run = this.runs[i];
            runClientRect = run.element.getBoundingClientRect();
            run._origin = JSPoint(runClientRect.left - lineClientRect.left, runClientRect.top - lineClientRect.top);
            run._size = JSSize(runClientRect.width, runClientRect.height);
        }
    },

    recalculateTrailingWhitespace: function(){
        var run;
        var iterator;
        this._trailingWhitespaceWidth = 0;
        for (var i = this.runs.length - 1; i >= 0; --i){
            run = this.runs[i];
            if (!run.textNode || run.textNode.nodeValue.length === 0){
                break;
            }
            iterator = run.textNode.nodeValue.unicodeIterator(run.textNode.nodeValue.length);
            iterator.decrement();
            while (iterator.index > 0 && iterator.isWhiteSpace){
                iterator.decrement();
            }
            if (!iterator.isWhiteSpace){
                iterator.increment();
                this._trailingWhitespaceWidth += run._textFrameConstructionWidthOfRange(JSRange(iterator.index, run.textNode.nodeValue.length - iterator.index));
                break;
            }
        }
    },

    recalculateRange: function(offset){
        var diff = 0;
        this._range = JSRange(this._range.location + offset, 0);
        var run;
        for (var i = 0, l = this._runs.length; i < l; ++i){
            run = this._runs[i];
            diff += run.recalculateRange(offset + diff);
            this._range.length += run._range.length;
        }
        this.element.dataset.rangeLocation = this._range.location;
        this.element.dataset.rangeLength = this._range.length;
        return diff;
    }

});

})();