// #import "UIKit/UILayer.js"
/* global UILayer, JSConstraintBox */
'use strict';

UILayer.definePropertiesFromExtensions({

    initializeHTMLContext: function(context){
        var element = context.element;
        element.style.position = 'absolute'; // TODO: allow other layout strategies
        element.style.boxSizing = 'border-box';
        element.style.mozBoxSizing = 'border-box';
    },

    updatePropertiesInHTMLContext: function(context, properties){
        var methodName;
        for (var keyPath in properties){
            methodName = 'updateHTMLProperty_' + keyPath;
            if (this[methodName]){
                this[methodName].call(this, context);
            }else{
                throw new Error("UILayer+HTML could not find html display method for keyPath '%s'".sprintf(keyPath));
            }
        }
    },

    updateHTMLProperty_box: function (context){
        var box = this.presentation.constraintBox;
        if (!box){
            box = JSConstraintBox.Rect(this.presentation.frame);
        }
        for (var property in box){
            if (box[property] === undefined){
                context.style[property] = '';
            }else{
                context.style[property] = box[property] + 'px';
            }
        }
        if (box.left === undefined && box.right === undefined){
            var width = box.width;
            if (width === undefined){
                width = this.presentation.frame.size.width;
            }
            context.style.left = '50%';
            context.style.marginLeft = (-width) + 'px';
        }else{
            context.style.marginLeft = '';
        }
        if (box.top === undefined && box.bottom === undefined){
            var height = box.height;
            if (height === undefined){
                height = this.presentation.frame.size.height;
            }
            context.style.top = '50%';
            context.style.marginTop = (-height) + 'px';
        }else{
            context.style.marginTop = '';
        }
        if (context.canvas){
            // TODO: size canvas
        }
    },

    'updateHTMLProperty_frame.origin.x': function(context){
        context.style.left = this.presentation.frame.origin.x + 'px';
    },

    'updateHTMLProperty_frame.origin.y': function(context){
        context.style.top = this.presentation.frame.origin.y + 'px';
    },

    'updateHTMLProperty_frame.size.width': function(context){
        context.style.width = this.presentation.frame.size.width + 'px';
        if (context.canvas){
            // TODO: size canvas
        }
    },

    'updateHTMLProperty_frame.size.height': function(context){
        context.style.height = this.presentation.frame.size.height + 'px';
        if (context.canvas){
            // TODO: size canvas
        }
    },

    'updateHTMLProperty_constraintBox.top': function(context){
        context.style.top = this.presentation.constraintBox.top + 'px';
    },

    'updateHTMLProperty_constraintBox.right': function(context){
        context.style.right = this.presentation.constraintBox.right + 'px';
    },

    'updateHTMLProperty_constraintBox.bottom': function(context){
        context.style.bottom = this.presentation.constraintBox.bottom + 'px';
    },

    'updateHTMLProperty_constraintBox.left': function(context){
        context.style.left = this.presentation.constraintBox.left + 'px';
    },

    'updateHTMLProperty_constraintBox.width': function(context){
        context.style.width = this.presentation.constraintBox.width + 'px';
        if (context.canvas){
            // TODO: size canvas
        }
    },

    'updateHTMLProperty_constraintBox.height': function(context){
        context.style.height = this.presentation.constraintBox.height + 'px';
        if (context.canvas){
            // TODO: size canvas
        }
    },

    updateHTMLProperty_hidden: function(context){
        context.style.display = this.presentation.hidden ? 'none' : '';
    },

    updateHTMLProperty_alpha: function(context){
        context.style.opacity = this.presentation.alpha != 1.0 ? this.presentation.alpha : '';
    },

    updateHTMLProperty_backgroundColor: function(context){
        context.style.backgroundColor = this.presentation.backgroundColor ? this.presentation.backgroundColor.cssString() : '';
    },

    updateHTMLProperty_borderColor: function(context){
        context.style.borderColor = this.presentation.borderColor ? this.presentation.borderColor.cssString() : '';
    },

    updateHTMLProperty_borderWidth: function(context){
        if (this.presentation.borderWidth){
            context.style.borderWidth = this.presentation.borderWidth + 'px';
            context.style.borderStyle = 'solid';
        }else{
            context.style.borderWidth = '';
            context.style.borderStyle = '';
        }
    },

    updateHTMLProperty_borderRadius: function(context){
        context.style.borderRadius = this.presentation.borderRadius ? this.presentation.borderRadius + 'px' : '';
    },

    updateHTMLProperty_shadow: function(context){
        if (this.shadowColor){
            context.style.boxShadow = '%fpx %fpx %fpx %s'.sprintf(this.shadowOffset.x, this.shadowOffset.y, this.shadowRadius, this.shadowColor.cssString());
        }else{
            context.style.boxShadow = '';
        }
    },

    updateHTMLProperty_transform: function(context){
        var transform = this.presentation.transform;
        if (transform){
            context.style.webkitTransform = context.style.MozTransform = 'matrix(%f, %f, %f, %f, %f, %f)'.sprintf(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
        }else{
            context.style.webkitTransform = context.style.MozTransform = '';
        }
    }
});