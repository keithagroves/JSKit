// #import "UIKit/UIView.js"
// #import "UIKit/UILabel.js"
// #import "UIKit/UIImageView.js"
/* global JSClass, UIView, UILabel, JSReadOnlyProperty, JSDynamicProperty, JSLazyInitProperty, UIListViewCell, JSConstraintBox, JSInsets, JSPoint, JSSize, JSRect, JSColor, UIImageView */
'use strict';

JSClass("UIListViewCell", UIView, {

    listView: null,
    indexPath: null,
    reuseIdentifier: null,
    titleInsets: JSDynamicProperty('_titleInsets', null),
    titleSpacing: JSDynamicProperty('_titleSpacing', 2.0),
    contentView: JSReadOnlyProperty('_contentView', null),
    titleLabel: JSLazyInitProperty('_createTitleLabel', '_titleLabel'),
    detailLabel: JSLazyInitProperty('_createDetailLabel', '_detailLabel'),
    imageView: JSLazyInitProperty('_createImageView', '_imageView'),
    stylerProperties: null,

    initWithReuseIdentifier: function(identifier){
        this.init();
        this.reuseIdentifier = identifier;
    },

    initWithFrame: function(frame){
        UIListViewCell.$super.initWithFrame.call(this, frame);
        this._commonCellInit();
    },

    initWithSpec: function(spec, values){
        UIListViewCell.$super.initWithSpec.call(this, spec, values);
        this._commonCellInit();
    },

    _commonCellInit: function(){
        this.stylerProperties = {};
        this._titleInsets = JSInsets(0, 10);
        this._contentView = UIView.initWithConstraintBox(JSConstraintBox.Margin(0));
        this.addSubview(this._contentView);
    },

    _createTitleLabel: function(){
        var label = UILabel.init();
        this.contentView.addSubview(label);
        return label;
    },

    _createDetalLabel: function(){
        var label = UILabel.init();
        this.contentView.addSubview(label);
        return label;
    },

    _createImageView: function(){
        var imageView = UIImageView.init();
        this.contentView.addSubview(imageView);
        return imageView;
    },

    setTitleInsets: function(titleInsets){
        this._titleInsets = JSInsets(titleInsets);
        this.setNeedsLayout();
    },

    setTitleSpacing: function(titleSpacing){
        this._titleSpacing = titleSpacing;
        this.setNeedsLayout();
    },

    layoutSubviews: function(){
        UIListViewCell.$super.layoutSubviews.call(this);
        var size = JSSize(this.bounds.size.width - this._titleInsets.left - this._titleInsets.right, 0);
        var origin = JSPoint(this._titleInsets.left, 0);
        if (this._titleLabel !== null){
            if (this._detailLabel !== null){
                size.height = this._titleLabel.font.displayLineHeight + this._detailLabel.font.displayLineHeight;
                origin.y =  Math.floor((this.bounds.size.height - size.height) / 2.0);
                size.height = this._titleLabel.font.displayLineHeight;
                this._titleLabel.frame = JSRect(origin, size);
                origin.y += size.height;
                size.height = this._detailLabel.font.displayLineHeight;
                this._detailLabel.frame = JSRect(origin, size);
            }else{
                size.height = this._titleLabel.font.displayLineHeight;
                origin.y =  Math.floor((this.bounds.size.height - size.height) / 2.0);
                this._titleLabel.frame = JSRect(origin, size);
            }
        }else if (this._detailLabel !== null){
            size.height = this._detailLabel.font.displayLineHeight;
            this._detailLabel.frame = JSRect(JSPoint(this._titleInsets.left, Math.floor((this.bounds.size.height - size.height) / 2.0)), size);
        }
    },

    // --------------------------------------------------------------------
    // MARK: - State

    state: JSReadOnlyProperty('_state', null),
    active: JSDynamicProperty(null, null, 'isActive'),
    selected: JSDynamicProperty(null, null, 'isSelected'),
    contextSelected: JSDynamicProperty(null, null, 'isContextSelected'),

    _updateState: function(newState){
        if (newState != this._state){
            this._state = newState;
            this._didChangeState();
        }
    },

    _didChangeState: function(){
        this.listView.styler.updateCell(this, this.indexPath);
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

    isActive: function(){
        return (this._state & UIListViewCell.State.active) === UIListViewCell.State.active;
    },

    setActive: function(isActive){
        this._toggleState(UIListViewCell.State.active, isActive);
    },

    isSelected: function(){
        return (this._state & UIListViewCell.State.selected) === UIListViewCell.State.selected;
    },

    setSelected: function(isSelected){
        this._toggleState(UIListViewCell.State.selected, isSelected);
    },

    isContextSelected: function(){
        return (this._state & UIListViewCell.State.contextSelected) === UIListViewCell.State.contextSelected;
    },

    setContextSelected: function(isContextSelected){
        this._toggleState(UIListViewCell.State.contextSelected, isContextSelected);
    }

});

UIListViewCell.State = {
    normal:   0,
    active:   1 << 1,
    selected: 1 << 2,
    contextSelected: 1 << 3
};