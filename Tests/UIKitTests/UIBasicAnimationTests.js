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

// #import UIKit
// #import TestKit
'use strict';

JSClass("UIBasicAnimationTests", TKTestSuite, {

    testUpdateForTime: function(){
        var layer = UILayer.init();
        layer.position = JSPoint(0, 0);
        var animation = UIBasicAnimation.initWithKeyPath('position.x');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.position.x;
        layer.addAnimationForKey(animation, 'position.x');
        layer.position = JSPoint(100, 0);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 0);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 10);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.500);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 50);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(1.000);
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertFloatEquals(layer.presentation.position.x, 100);
        TKAssertFloatEquals(layer.position.x, 100);
    },

    testInterpolateNull: function(){
        var layer = UILayer.init();
        layer.backgroundColor = null;
        var animation = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.backgroundColor;
        layer.addAnimationForKey(animation, 'backgroundColor');
        layer.backgroundColor = JSColor.black;
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertExactEquals(layer.presentation.backgroundColor, null);
        TKAssertExactEquals(layer.backgroundColor, JSColor.black);

        animation.updateForTime(0.5);
        TKAssert(!animation.isComplete);
        TKAssertExactEquals(layer.presentation.backgroundColor, null);
        TKAssertExactEquals(layer.backgroundColor, JSColor.black);

        animation.updateForTime(1);
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertExactEquals(layer.presentation.backgroundColor, JSColor.black);
        TKAssertExactEquals(layer.backgroundColor, JSColor.black);

        layer = UILayer.init();
        layer.backgroundColor = JSColor.black;
        animation = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.backgroundColor;
        layer.addAnimationForKey(animation, 'backgroundColor');
        layer.backgroundColor = null;
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.black);
        TKAssertExactEquals(layer.backgroundColor, null);

        animation.updateForTime(0.5);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.black);
        TKAssertExactEquals(layer.backgroundColor, null);
        
        animation.updateForTime(1);
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertExactEquals(layer.presentation.backgroundColor, null);
        TKAssertExactEquals(layer.backgroundColor, null);
    },

    testInterpolateNumber: function(){
        var layer = UILayer.init();
        layer.position = JSPoint(0, 0);
        var animation = UIBasicAnimation.initWithKeyPath('position.x');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.position.x;
        layer.addAnimationForKey(animation, 'position.x');
        layer.position = JSPoint(100, 0);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 0);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 10);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.500);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 50);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(1.000);
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertFloatEquals(layer.presentation.position.x, 100);
        TKAssertFloatEquals(layer.position.x, 100);
    },

    testInterpolatePoint: function(){
        var layer = UILayer.init();
        layer.position = JSPoint(0, 0);
        var animation = UIBasicAnimation.initWithKeyPath('position');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.position;
        layer.addAnimationForKey(animation, 'position');
        layer.position = JSPoint(100, 200);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 0);
        TKAssertFloatEquals(layer.presentation.position.y, 0);
        TKAssertFloatEquals(layer.position.x, 100);
        TKAssertFloatEquals(layer.position.y, 200);
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 10);
        TKAssertFloatEquals(layer.presentation.position.y, 20);
        TKAssertFloatEquals(layer.position.x, 100);
        TKAssertFloatEquals(layer.position.y, 200);
        animation.updateForTime(0.200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 20);
        TKAssertFloatEquals(layer.presentation.position.y, 40);
        TKAssertFloatEquals(layer.position.x, 100);
        TKAssertFloatEquals(layer.position.y, 200);
        animation.updateForTime(0.900);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 90);
        TKAssertFloatEquals(layer.presentation.position.y, 180);
        TKAssertFloatEquals(layer.position.x, 100);
        TKAssertFloatEquals(layer.position.y, 200);
        animation.updateForTime(1.000);
        
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertFloatEquals(layer.presentation.position.x, 100);
        TKAssertFloatEquals(layer.presentation.position.y, 200);
        TKAssertFloatEquals(layer.position.x, 100);
        TKAssertFloatEquals(layer.position.y, 200);
    },

    testInterpolateSize: function(){
        var layer = UILayer.init();
        layer.bounds = JSRect(0, 0, 0, 0);
        var animation = UIBasicAnimation.initWithKeyPath('bounds.size');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.bounds.size;
        layer.addAnimationForKey(animation, 'bounds.size');
        layer.bounds = JSRect(0, 0, 100, 200);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.bounds.size.width, 0);
        TKAssertFloatEquals(layer.presentation.bounds.size.height, 0);
        TKAssertFloatEquals(layer.bounds.size.width, 100);
        TKAssertFloatEquals(layer.bounds.size.height, 200);
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.bounds.size.width, 10);
        TKAssertFloatEquals(layer.presentation.bounds.size.height, 20);
        TKAssertFloatEquals(layer.bounds.size.width, 100);
        TKAssertFloatEquals(layer.bounds.size.height, 200);
        animation.updateForTime(0.200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.bounds.size.width, 20);
        TKAssertFloatEquals(layer.presentation.bounds.size.height, 40);
        TKAssertFloatEquals(layer.bounds.size.width, 100);
        TKAssertFloatEquals(layer.bounds.size.height, 200);
        animation.updateForTime(0.900);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.bounds.size.width, 90);
        TKAssertFloatEquals(layer.presentation.bounds.size.height, 180);
        TKAssertFloatEquals(layer.bounds.size.width, 100);
        TKAssertFloatEquals(layer.bounds.size.height, 200);
        animation.updateForTime(1.00);
        
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertFloatEquals(layer.presentation.bounds.size.width, 100);
        TKAssertFloatEquals(layer.presentation.bounds.size.height, 200);
        TKAssertFloatEquals(layer.bounds.size.width, 100);
        TKAssertFloatEquals(layer.bounds.size.height, 200);
    },

    testInterpolateRect: function(){
        var layer = UILayer.init();
        layer.bounds = JSRect(0, 0, 0, 0);
        var animation = UIBasicAnimation.initWithKeyPath('bounds');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.bounds;
        layer.addAnimationForKey(animation, 'bounds');
        layer.bounds = JSRect(100, 200, 300, 400);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.bounds.origin.x, 0);
        TKAssertFloatEquals(layer.presentation.bounds.origin.y, 0);
        TKAssertFloatEquals(layer.presentation.bounds.size.width, 0);
        TKAssertFloatEquals(layer.presentation.bounds.size.height, 0);
        TKAssertFloatEquals(layer.bounds.origin.x, 100);
        TKAssertFloatEquals(layer.bounds.origin.y, 200);
        TKAssertFloatEquals(layer.bounds.size.width, 300);
        TKAssertFloatEquals(layer.bounds.size.height, 400);
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.bounds.origin.x, 10);
        TKAssertFloatEquals(layer.presentation.bounds.origin.y, 20);
        TKAssertFloatEquals(layer.presentation.bounds.size.width, 30);
        TKAssertFloatEquals(layer.presentation.bounds.size.height, 40);
        TKAssertFloatEquals(layer.bounds.origin.x, 100);
        TKAssertFloatEquals(layer.bounds.origin.y, 200);
        TKAssertFloatEquals(layer.bounds.size.width, 300);
        TKAssertFloatEquals(layer.bounds.size.height, 400);
        animation.updateForTime(0.200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.bounds.origin.x, 20);
        TKAssertFloatEquals(layer.presentation.bounds.origin.y, 40);
        TKAssertFloatEquals(layer.presentation.bounds.size.width, 60);
        TKAssertFloatEquals(layer.presentation.bounds.size.height, 80);
        TKAssertFloatEquals(layer.bounds.origin.x, 100);
        TKAssertFloatEquals(layer.bounds.origin.y, 200);
        TKAssertFloatEquals(layer.bounds.size.width, 300);
        TKAssertFloatEquals(layer.bounds.size.height, 400);
        animation.updateForTime(0.900);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.bounds.origin.x, 90);
        TKAssertFloatEquals(layer.presentation.bounds.origin.y, 180);
        TKAssertFloatEquals(layer.presentation.bounds.size.width, 270);
        TKAssertFloatEquals(layer.presentation.bounds.size.height, 360);
        TKAssertFloatEquals(layer.bounds.origin.x, 100);
        TKAssertFloatEquals(layer.bounds.origin.y, 200);
        TKAssertFloatEquals(layer.bounds.size.width, 300);
        TKAssertFloatEquals(layer.bounds.size.height, 400);
        animation.updateForTime(1.00);
        
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertFloatEquals(layer.presentation.bounds.origin.x, 100);
        TKAssertFloatEquals(layer.presentation.bounds.origin.y, 200);
        TKAssertFloatEquals(layer.presentation.bounds.size.width, 300);
        TKAssertFloatEquals(layer.presentation.bounds.size.height, 400);
        TKAssertFloatEquals(layer.bounds.origin.x, 100);
        TKAssertFloatEquals(layer.bounds.origin.y, 200);
        TKAssertFloatEquals(layer.bounds.size.width, 300);
        TKAssertFloatEquals(layer.bounds.size.height, 400);
    },

    testInterpolateAffineTransform: function(){
        var layer = UILayer.init();
        var animation = UIBasicAnimation.initWithKeyPath('transform');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.transform;
        layer.addAnimationForKey(animation, 'transform');
        layer.transform = layer.transform.translatedBy(10, 20).scaledBy(3, 4);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.transform.a, 1);
        TKAssertFloatEquals(layer.presentation.transform.d, 1);
        TKAssertFloatEquals(layer.presentation.transform.tx, 0);
        TKAssertFloatEquals(layer.presentation.transform.ty, 0);
        TKAssertFloatEquals(layer.transform.a, 3);
        TKAssertFloatEquals(layer.transform.d, 4);
        TKAssertFloatEquals(layer.transform.tx, 10);
        TKAssertFloatEquals(layer.transform.ty, 20);
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.transform.a, 1.2);
        TKAssertFloatEquals(layer.presentation.transform.d, 1.3);
        TKAssertFloatEquals(layer.presentation.transform.tx, 1);
        TKAssertFloatEquals(layer.presentation.transform.ty, 2);
        TKAssertFloatEquals(layer.transform.a, 3);
        TKAssertFloatEquals(layer.transform.d, 4);
        TKAssertFloatEquals(layer.transform.tx, 10);
        TKAssertFloatEquals(layer.transform.ty, 20);
        animation.updateForTime(0.200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.transform.a, 1.4);
        TKAssertFloatEquals(layer.presentation.transform.d, 1.6);
        TKAssertFloatEquals(layer.presentation.transform.tx, 2);
        TKAssertFloatEquals(layer.presentation.transform.ty, 4);
        TKAssertFloatEquals(layer.transform.a, 3);
        TKAssertFloatEquals(layer.transform.d, 4);
        TKAssertFloatEquals(layer.transform.tx, 10);
        TKAssertFloatEquals(layer.transform.ty, 20);
        animation.updateForTime(0.900);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.transform.a, 2.8);
        TKAssertFloatEquals(layer.presentation.transform.d, 3.7);
        TKAssertFloatEquals(layer.presentation.transform.tx, 9);
        TKAssertFloatEquals(layer.presentation.transform.ty, 18);
        TKAssertFloatEquals(layer.transform.a, 3);
        TKAssertFloatEquals(layer.transform.d, 4);
        TKAssertFloatEquals(layer.transform.tx, 10);
        TKAssertFloatEquals(layer.transform.ty, 20);
        animation.updateForTime(1.00);
        
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertFloatEquals(layer.presentation.transform.a, 3);
        TKAssertFloatEquals(layer.presentation.transform.d, 4);
        TKAssertFloatEquals(layer.presentation.transform.tx, 10);
        TKAssertFloatEquals(layer.presentation.transform.ty, 20);
        TKAssertFloatEquals(layer.transform.a, 3);
        TKAssertFloatEquals(layer.transform.d, 4);
        TKAssertFloatEquals(layer.transform.tx, 10);
        TKAssertFloatEquals(layer.transform.ty, 20);
    },

    testInterpolate1Color: function(){
        var layer = UILayer.init();
        layer.backgroundColor = JSColor.black;
        var animation = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.backgroundColor;
        layer.addAnimationForKey(animation, 'backgroundColor');
        layer.backgroundColor = JSColor.white;
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.black);
        TKAssertObjectEquals(layer.backgroundColor, JSColor.white);
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithWhite(0.1));
        TKAssertObjectEquals(layer.backgroundColor, JSColor.white);
        animation.updateForTime(0.200);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithWhite(0.2));
        TKAssertObjectEquals(layer.backgroundColor, JSColor.white);
        animation.updateForTime(0.900);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithWhite(0.9));
        TKAssertObjectEquals(layer.backgroundColor, JSColor.white);
        animation.updateForTime(1.000);
        
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithWhite(1.0));
        TKAssertObjectEquals(layer.backgroundColor, JSColor.white);
    },

    testInterpolate3Color: function(){
        var layer = UILayer.init();
        layer.backgroundColor = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.0, 0.2, 0.4]);
        var animation = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.backgroundColor;
        layer.addAnimationForKey(animation, 'backgroundColor');
        layer.backgroundColor = JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.6, 1.0]);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.0, 0.2, 0.4]));
        TKAssertObjectEquals(layer.backgroundColor, JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.6, 1.0]));
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.02, 0.24, 0.46]));
        TKAssertObjectEquals(layer.backgroundColor, JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.6, 1.0]));
        animation.updateForTime(0.200);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.04, 0.28, 0.52]));
        TKAssertObjectEquals(layer.backgroundColor, JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.6, 1.0]));
        animation.updateForTime(0.900);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.18, 0.56, 0.94]));
        TKAssertObjectEquals(layer.backgroundColor, JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.6, 1.0]));
        animation.updateForTime(1.00);
        
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.6, 1.0]));
        TKAssertObjectEquals(layer.backgroundColor, JSColor.initWithSpaceAndComponents(JSColor.SpaceIdentifier.rgb, [0.2, 0.6, 1.0]));
    },

    testInterpolate4Color: function(){
        var layer = UILayer.init();
        layer.backgroundColor = JSColor.initWithRGBA(0.0, 0.2, 0.4, 0.6);
        var animation = UIBasicAnimation.initWithKeyPath('backgroundColor');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.model.backgroundColor;
        layer.addAnimationForKey(animation, 'backgroundColor');
        layer.backgroundColor = JSColor.initWithRGBA(0.2, 0.6, 1.0, 1.0);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.0, 0.2, 0.4, 0.6));
        TKAssertObjectEquals(layer.backgroundColor, JSColor.initWithRGBA(0.2, 0.6, 1.0, 1.0));
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.02, 0.24, 0.46, 0.64));
        TKAssertObjectEquals(layer.backgroundColor, JSColor.initWithRGBA(0.2, 0.6, 1.0, 1.0));
        animation.updateForTime(0.200);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.04, 0.28, 0.52, 0.68));
        TKAssertObjectEquals(layer.backgroundColor, JSColor.initWithRGBA(0.2, 0.6, 1.0, 1.0));
        animation.updateForTime(0.900);
        TKAssert(!animation.isComplete);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.18, 0.56, 0.94, 0.96));
        TKAssertObjectEquals(layer.backgroundColor, JSColor.initWithRGBA(0.2, 0.6, 1.0, 1.0));
        animation.updateForTime(1.000);
        
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertObjectEquals(layer.presentation.backgroundColor, JSColor.initWithRGBA(0.2, 0.6, 1.0, 1.0));
        TKAssertObjectEquals(layer.backgroundColor, JSColor.initWithRGBA(0.2, 0.6, 1.0, 1.0));
    },

    testPause: function(){
        var layer = UILayer.init();
        layer.position = JSPoint(0, 0);
        var animation = UIBasicAnimation.initWithKeyPath('position.x');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.position.x;
        layer.addAnimationForKey(animation, 'position.x');
        layer.position = JSPoint(100, 0);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 0);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 10);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 20);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.pause();
        animation.updateForTime(0.500);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 20);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(1.000);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 20);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(2.000);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 20);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.resume();
        animation.updateForTime(2.200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 20);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(2.300);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 30);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(2.700);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 70);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.pause();
        animation.updateForTime(2.800);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 70);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(2.900);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 70);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(3.500);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 70);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.resume();
        animation.updateForTime(3.700);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 70);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(3.800);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 80);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(3.900);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 90);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(4.000);
        
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertFloatEquals(layer.presentation.position.x, 100);
        TKAssertFloatEquals(layer.position.x, 100);
    },

    testReverse: function(){
        var layer = UILayer.init();
        layer.position = JSPoint(0, 0);
        var animation = UIBasicAnimation.initWithKeyPath('position.x');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.position.x;
        layer.addAnimationForKey(animation, 'position.x');
        layer.position = JSPoint(100, 0);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 0);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 10);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 20);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.reverse();
        TKAssertFloatEquals(layer.position.x, 0);
        animation.updateForTime(0.300);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 20);
        TKAssertFloatEquals(layer.position.x, 0);
        animation.updateForTime(0.400);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 10);
        TKAssertFloatEquals(layer.position.x, 0);
        animation.updateForTime(0.500);
        
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertFloatEquals(layer.presentation.position.x, 0);
        TKAssertFloatEquals(layer.position.x, 0);


        layer = UILayer.init();
        layer.position = JSPoint(0, 0);
        animation = UIBasicAnimation.initWithKeyPath('position.x');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.position.x;
        layer.addAnimationForKey(animation, 'position.x');
        layer.position = JSPoint(100, 0);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 0);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 10);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 20);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.300);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 30);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.400);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 40);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.reverse();
        TKAssertFloatEquals(layer.position.x, 0);
        animation.updateForTime(0.500);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 40);
        TKAssertFloatEquals(layer.position.x, 0);
        animation.updateForTime(0.600);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 30);
        TKAssertFloatEquals(layer.position.x, 0);
        animation.updateForTime(0.700);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 20);
        TKAssertFloatEquals(layer.position.x, 0);
        animation.reverse();
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.800);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 20);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.900);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 30);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(1.000);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 40);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(1.1);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 50);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(1.2);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 60);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(1.3);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 70);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(1.4);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 80);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(1.5);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 90);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(1.6);
        
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertFloatEquals(layer.presentation.position.x, 100);
        TKAssertFloatEquals(layer.position.x, 100);
    },

    testSetPercentComplete: function(){
        var layer = UILayer.init();
        layer.position = JSPoint(0, 0);
        var animation = UIBasicAnimation.initWithKeyPath('position.x');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.position.x;
        layer.addAnimationForKey(animation, 'position.x');
        layer.position = JSPoint(100, 0);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 0);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 10);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 20);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.percentComplete = 0.6;
        animation.updateForTime(0.300);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 60);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.400);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 70);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.500);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 80);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.600);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 90);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.700);
        
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertFloatEquals(layer.presentation.position.x, 100);
        TKAssertFloatEquals(layer.position.x, 100);


        layer = UILayer.init();
        layer.position = JSPoint(0, 0);
        animation = UIBasicAnimation.initWithKeyPath('position.x');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.position.x;
        layer.addAnimationForKey(animation, 'position.x');
        layer.position = JSPoint(100, 0);
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 0);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 10);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 20);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.percentComplete = 0.6;
        animation.updateForTime(0.300);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 60);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.400);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 70);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.500);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 80);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.600);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 90);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.percentComplete = 0.4;
        animation.updateForTime(0.700);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 40);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.800);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 50);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.900);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 60);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(1.000);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 70);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(1.100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 80);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(1.200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 90);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(1.300);
        
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertFloatEquals(layer.presentation.position.x, 100);
        TKAssertFloatEquals(layer.position.x, 100);


        layer = UILayer.init();
        layer.position = JSPoint(0, 0);
        animation = UIBasicAnimation.initWithKeyPath('position.x');
        animation.layer = layer;
        animation.duration = 1;
        animation.fromValue = layer.position.x;
        layer.addAnimationForKey(animation, 'position.x');
        layer.position = JSPoint(100, 0);
        animation.percentComplete = 0.4;
        animation.updateForTime(0);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 40);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.100);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 50);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.200);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 60);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.300);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 70);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.400);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 80);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.500);
        TKAssert(!animation.isComplete);
        TKAssertFloatEquals(layer.presentation.position.x, 90);
        TKAssertFloatEquals(layer.position.x, 100);
        animation.updateForTime(0.600);
        TKAssert(animation.isComplete);
        layer.removeAnimation(animation);
        TKAssertExactEquals(layer.animationCount, 0);
        TKAssertFloatEquals(layer.presentation.position.x, 100);
        TKAssertFloatEquals(layer.position.x, 100);
    }
});