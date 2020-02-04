'use strict';

(function(){

Object.defineProperties(Error.prototype, {

    frames: {
        get: function Error_getFrames(){
            var frames = [];
            if (this.stack){
                var lines = this.stack.split("\n");
                var frame;
                for (var i = 0, l = lines.length; i < l; ++i){
                    frame = frameFromLine(lines[i]);
                    if (frame){
                        frames.push(frame);
                    }
                }
            }
            return frames;
        }
    }

});


// Safari: searchChanged@https://test1.breakside.dev:8089/debug/JS/SidebarViewController.js:213:23
// Firefox: textStorageDidReplaceCharactersInRange@https://test1.breakside.dev:8089/debug/Frameworks/Foundation/JSTextLayoutManager.js:186:25
// Chrome:     at SidebarViewController.searchChanged (https://test1.breakside.dev:8089/debug/JS/SidebarViewController.js:213:9)

var chromeLikePattern = {
    regex: /^\s+at\s+(.+\.)?([^.]+)\s*\((.+):(\d+):(\d+)\)$/,
    groups: {method: 2, filename: 3, lineno: 4, colno: 5}
};
var firefoxLikePattern = {
    regex: /^(.+)@(.+):(\d+):(\d+)$/,
    groups: {method: 1, filename: 2, lineno: 3, colno: 4}
};
var patterns = [chromeLikePattern, firefoxLikePattern];

var frameFromLine = function(line){
    var matches;
    var pattern;
    for (var i = 0, l = patterns.length; i < l; ++i){
        pattern = patterns[i];
        matches = line.match(pattern.regex);
        if (matches){
            return {
                method: matches[pattern.groups.method],
                filename: matches[pattern.groups.filename],
                lineno: matches[pattern.groups.lineno],
                colno: matches[pattern.groups.colno]
            };
        }
    }
};

})();