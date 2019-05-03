// #import "DocComponent.js"
/* global JSClass, DocComponent, DocEnum */
'use strict';

 JSClass("DocEnum", DocComponent, {

    kind: 'enum',
    options: null,

    extractPropertiesFromInfo: async function(info, documentation){
        if (info.options){
            this.options = info.options;
        }else{
            this.options = [];
        }
    },

    htmlArticleElements: function(document){
        var index = 1;
        var elements = DocEnum.$super.htmlArticleElements.call(this, document);
        var declaration = this.codeSectionElement(document, "Declaration", this.declarationCode());
        declaration.setAttribute("class", "declaration");
        elements.splice(index++, 0, declaration);

        if (this.options.length > 0){
            let params = document.createElement("section");
            elements.splice(index++, 0, params);
            params.setAttribute("class", "options");
            let header = params.appendChild(document.createElement("header"));
            let h1 = header.appendChild(document.createElement("h1"));
            h1.appendChild(document.createTextNode("Options"));
            let dl = params.appendChild(document.createElement("dl"));
            for (let i = 0, l = this.options.length; i < l; ++i){
                let option = this.options[i];
                let dt = dl.appendChild(document.createElement("dt"));
                let dd = dl.appendChild(document.createElement("dd"));
                dt.appendChild(document.createTextNode(option.name));
                if (option.summary){
                    let markdown = this.createMarkdownWithString(option.summary);
                    let children = markdown.htmlElementsForDocument(document);
                    for (let i = 0, l = children.length; i < l; ++i){
                        dd.appendChild(children[i]);
                    }
                }
            }
        }
        return elements;
    },

    declarationCode: function(){
        if (this.parent && this.parent.kind == 'class'){
            return ["%s.%s = { ... }".sprintf(this.parent.name, this.name)];
        }
        return ["%s = { ... }".sprintf(this.name)];
    },

    getDisplayNameForKind: function(){
        return 'Enum';
    }

 });