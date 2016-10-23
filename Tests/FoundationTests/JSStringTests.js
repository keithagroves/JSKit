// #import "Foundation/Foundation.js"
// #import "TestKit/TestKit.js"
/* global JSClass, TKTestSuite, JSString, JSRange, TKAssertNotNull, TKAssertEquals, TKAssertObjectEquals */
'use strict';

JSClass('JSStringTests', TKTestSuite, {

    testInit: function(){
        var string = JSString.initWithNativeString("Hello, world!");
        TKAssertNotNull(string);
        TKAssertEquals(string.length, 13);
        TKAssertObjectEquals(string, "Hello, world!");
    },

    testInitFormat: function(){
        var string = JSString.initWithFormat("This %s a test %d!", "is", 123);
        TKAssertNotNull(string);
        TKAssertObjectEquals(string, "This is a test 123!");
    },

    testAppend: function(){
        var string = JSString.initWithNativeString("Hello");
        string.appendString(", world!");
        TKAssertObjectEquals(string, "Hello, world!");
        string.appendString(JSString.initWithNativeString("  TEST!"));
        TKAssertObjectEquals(string, "Hello, world!  TEST!");
    },

    testReplace: function(){
        var string = JSString.initWithNativeString("Hello, world!");
        var range = JSRange(7, 5);
        string.replaceCharactersInRangeWithString(range, "test");
        TKAssertObjectEquals(string, "Hello, test!");
        range = JSRange(0, 5);
        string.replaceCharactersInRangeWithString(range, JSString.initWithNativeString("Yo"));
        TKAssertObjectEquals(string, "Yo, test!");
    },

    testDelete: function(){
        var string = JSString.initWithNativeString("Hello, world!");
        var range = JSRange(5, 8);
        string.deleteCharactersInRange(range);
        TKAssertObjectEquals(string, "Hello");
    },

    testSubstring: function(){
        var string = JSString.initWithNativeString("Hello, world!");
        var range = JSRange(7, 5);
        var substring = string.substringInRange(range);
        TKAssertObjectEquals(substring, "world");
    },

    testUnicodeForwardIterator: function(){
        var string = JSString.initWithNativeString("Tésting 😀");
        TKAssertEquals(string.length, 10);
        var iterator = JSString._UnicodeIterator(string, 0);
        TKAssertEquals(iterator.index, 0);
        TKAssertEquals(iterator.nextIndex, 1);
        iterator.increment();
        TKAssertEquals(iterator.index, 1);
        TKAssertEquals(iterator.nextIndex, 2);
        iterator.increment();
        TKAssertEquals(iterator.index, 2);
        TKAssertEquals(iterator.nextIndex, 3);
        iterator.increment();
        iterator.increment();
        iterator.increment();
        iterator.increment();
        iterator.increment();
        TKAssertEquals(iterator.index, 7);
        TKAssertEquals(iterator.nextIndex, 8);
        iterator.increment();
        TKAssertEquals(iterator.index, 8);
        TKAssertEquals(iterator.nextIndex, 10);
        iterator.increment();
        TKAssertEquals(iterator.index, 10);
        TKAssertEquals(iterator.nextIndex, 10);
        iterator.increment();
        TKAssertEquals(iterator.index, 10);
        TKAssertEquals(iterator.nextIndex, 10);
    },

    testUnicodeBackwardIterator: function(){
        var string = JSString.initWithNativeString("Tésting 😀");
        var iterator = JSString._UnicodeIterator(string, 10);
        TKAssertEquals(iterator.index, 10);
        TKAssertEquals(iterator.nextIndex, 10);
        iterator.decrement();
        TKAssertEquals(iterator.index, 8);
        TKAssertEquals(iterator.nextIndex, 10);
        iterator.decrement();
        TKAssertEquals(iterator.index, 7);
        TKAssertEquals(iterator.nextIndex, 8);
        iterator.decrement();
        iterator.decrement();
        iterator.decrement();
        iterator.decrement();
        iterator.decrement();
        iterator.decrement();
        iterator.decrement();
        TKAssertEquals(iterator.index, 0);
        TKAssertEquals(iterator.nextIndex, 1);
        iterator.decrement();
        TKAssertEquals(iterator.index, -1);
        TKAssertEquals(iterator.nextIndex, 0);
        iterator.decrement();
        TKAssertEquals(iterator.index, -1);
        TKAssertEquals(iterator.nextIndex, 0);
    },

    testCharacterBoundaries: function(){
        var string = JSString.initWithNativeString("Hello, world!");
        var range = string.rangeForUserPerceivedCharacterAtIndex(0);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 1);
        range = string.rangeForUserPerceivedCharacterAtIndex(1);
        TKAssertEquals(range.location, 1);
        TKAssertEquals(range.length, 1);
        range = string.rangeForUserPerceivedCharacterAtIndex(3);
        TKAssertEquals(range.location, 3);
        TKAssertEquals(range.length, 1);
        range = string.rangeForUserPerceivedCharacterAtIndex(12);
        TKAssertEquals(range.location, 12);
        TKAssertEquals(range.length, 1);
        range = string.rangeForUserPerceivedCharacterAtIndex(13);
        TKAssertEquals(range.location, 13);
        TKAssertEquals(range.length, 0);
    },

    testUnicodeCharacterBoundaries: function(){
        var string = JSString.initWithNativeString("Te\u0301st 😀!");
        var range = string.rangeForUserPerceivedCharacterAtIndex(0);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 1);
        range = string.rangeForUserPerceivedCharacterAtIndex(1);
        TKAssertEquals(range.location, 1);
        TKAssertEquals(range.length, 2);
        range = string.rangeForUserPerceivedCharacterAtIndex(2);
        TKAssertEquals(range.location, 1);
        TKAssertEquals(range.length, 2);
        range = string.rangeForUserPerceivedCharacterAtIndex(3);
        TKAssertEquals(range.location, 3);
        TKAssertEquals(range.length, 1);
        range = string.rangeForUserPerceivedCharacterAtIndex(6);
        TKAssertEquals(range.location, 6);
        TKAssertEquals(range.length, 2);
        range = string.rangeForUserPerceivedCharacterAtIndex(7);
        TKAssertEquals(range.location, 6);
        TKAssertEquals(range.length, 2);
        range = string.rangeForUserPerceivedCharacterAtIndex(8);
        TKAssertEquals(range.location, 8);
        TKAssertEquals(range.length, 1);
        range = string.rangeForUserPerceivedCharacterAtIndex(9);
        TKAssertEquals(range.location, 9);
        TKAssertEquals(range.length, 0);
    },

    testWordBoundaries: function(){
        var string = JSString.initWithNativeString("Hello, world. \"this\" is a test!");
        var range = string.rangeForWordAtIndex(0);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(1);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(4);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(5);
        TKAssertEquals(range.location, 5);
        TKAssertEquals(range.length, 1);
        range = string.rangeForWordAtIndex(6);
        TKAssertEquals(range.location, 6);
        TKAssertEquals(range.length, 1);
        range = string.rangeForWordAtIndex(7);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(8);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(11);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
    },

    testUnicodeWordBoundaries: function(){
        var string = JSString.initWithNativeString("Hello, wörld. \"this\" is a te\u0301st 😀!");
        var range = string.rangeForWordAtIndex(0);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(1);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(7);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(8);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(9);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(26);
        TKAssertEquals(range.location, 26);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(27);
        TKAssertEquals(range.location, 26);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(28);
        TKAssertEquals(range.location, 26);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(29);
        TKAssertEquals(range.location, 26);
        TKAssertEquals(range.length, 5);
        range = string.rangeForWordAtIndex(32);
        TKAssertEquals(range.location, 32);
        TKAssertEquals(range.length, 2);
        range = string.rangeForWordAtIndex(33);
        TKAssertEquals(range.location, 32);
        TKAssertEquals(range.length, 2);
        range = string.rangeForWordAtIndex(34);
        TKAssertEquals(range.location, 34);
        TKAssertEquals(range.length, 1);
    },

    _testWordBoundarySpaces: function(){
        // disabled until I can decide exactly what I want here
        // Unicode word break standard doesn't treat runs of whitespace as a word; each space is its own word
        // But for practical use, I think treating consecutive whitespace as a word makes sense
        var str = JSString.initWithNativeString("  Hello     there,\t   what\n\na test!  ");
        var range = str.rangeForWordAtIndex(0);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 2);
        range = str.rangeForWordAtIndex(1);
        TKAssertEquals(range.location, 0);
        TKAssertEquals(range.length, 2);
        range = str.rangeForWordAtIndex(2);
        TKAssertEquals(range.location, 2);
        TKAssertEquals(range.length, 5);
        range = str.rangeForWordAtIndex(7);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
        range = str.rangeForWordAtIndex(11);
        TKAssertEquals(range.location, 7);
        TKAssertEquals(range.length, 5);
        range = str.rangeForWordAtIndex(17);
        TKAssertEquals(range.location, 17);
        TKAssertEquals(range.length, 1);
        range = str.rangeForWordAtIndex(18);
        TKAssertEquals(range.location, 18);
        TKAssertEquals(range.length, 4);
        range = str.rangeForWordAtIndex(19);
        TKAssertEquals(range.location, 18);
        TKAssertEquals(range.length, 4);
        range = str.rangeForWordAtIndex(20);
        TKAssertEquals(range.location, 18);
        TKAssertEquals(range.length, 4);
        range = str.rangeForWordAtIndex(26);
        TKAssertEquals(range.location, 26);
        TKAssertEquals(range.length, 2);
        range = str.rangeForWordAtIndex(27);
        TKAssertEquals(range.location, 26);
        TKAssertEquals(range.length, 2);
        range = str.rangeForWordAtIndex(35);
        TKAssertEquals(range.location, 35);
        TKAssertEquals(range.length, 2);
        range = str.rangeForWordAtIndex(36);
        TKAssertEquals(range.location, 35);
        TKAssertEquals(range.length, 2);
    },

    testUTF8: function(){

    }

});