"use strict";
"use warnings";

(function(window) {	
var hdemon = hdemon || {},
    exp = {};
﻿
﻿(function(exp) {

/**
 * @type
 */
var core;
core = (function() {
    function init_ () {
        this.mod = {
            eventController : exp .eventController,
            aligner     : exp .aligner,
            selector    : exp .selector,
            manipulator : exp .manipulator,
            locator     : exp .locator
        };
        this.formId = 0;
        this.form  = [];
        
        $("body").append("<div id=\"hdex_secretRepo\"></div>");
        this.$secretRepo = $("#hdex_secretRepo");
        this.$secretRepo
            .css({ "display" : "hidden" });
        
        this.initialized = true;
    }

    return {
        pref : "hdex_",
        lb : { // label
            form        : "form",
            elem        : "elem",
            content     : "ct",
            innrWrap    : "iw",
            outrWrap    : "ow",
            cursor      : "cursor",
            cursor_copy : "cursor_copy",
            cursor_move : "cursor_move",
            cursor_text : "cursor_text",    
            slctBoxId   : "slctBox",
            unSelect    : "ex_unselect",
            selecting   : "ex_selecting",
            selected    : "ex_selected",
            preselect   : "ex_preselect",
            titleBar    : "titleBar",
            removeBtn   : "removeBtn",
            titleSpace  : "titleSpc",
            resize      : "resize"    
        },

        set : function(args) {
            // required --------
            this.$wrapper      = args .$wrapper;

            // optional --------
            // scroll                                 
            this.autoScroll    = args .autoScroll  ||
               (exp.util.browser.ie || exp.util.browser.opera || exp.util.browser.firefox);
            this.scrollWeight  = args .scrollWeight|| 0.6;

            // individual parameter
            // style
            this.width         = (typeof args .width      === "undefined")  ? 300   : args .width;    // initial value
            this.height        = (typeof args .height     === "undefined")  ? 400   : args .height;    // do.
            this.minWidth      = (typeof args .minWidth   === "undefined")  ? 50   : args .minWidth;
            this.minHeight     = (typeof args .minHeight  === "undefined")  ? 50   : args .minHeight;
            this.maxWidth      = (typeof args .maxWidth   === "undefined")  ? null  : args .maxWidth;
            this.maxHeight     = (typeof args .maxHeight  === "undefined")  ? null  : args .maxHeight;
          
            this.tBarHeight    = (typeof args .tBarHeight === "undefined")  ? 30    : args .tBarHeight;
            this.removeBtn     = (typeof args .removeBtn === "undefined")   ? true  : args .removeBtn;

            this.statusBar     = (typeof args .removeBtn === "undefined")   ? true  : args .statusBar
            this.sBarHeight    = (typeof args .removeBtn === "undefined")   ? 50    : args .sBarHeight;
            
            // callback    
            this.callback    = {
                manipulated     : args .manipulated     || function() {},
                selected        : args .selected        || function() {},
                formRemoved     : args .formRemoved     || function() {},
                formAdded       : args .formAdded       || function() {},
                onElement       : args .onElement       || function() {},
                focusChanged    : args .focusChange     || function() {},
                focusKeeped     : args .focusKeeped     || function() {},
                resizingStart   : args .resizingStart   || function() {},
                resizing        : args .resizing        || function() {},
                resizingEnded   : args .resizingEnded   || function() {}
            };

            return this;
        },

        add : function() {
            // initialize mods
            if (typeof this.mod === "undefined") init_.bind(this)();

            // create form object. This contains $ objects mainly.

            // create form root. And the content element object relocate
            // under "form.rootObj". $iw(inner wrapper) and $ow(outer wrapper)
            // locate there too.
            var form    = new exp.windowForm(this),
                formId  = form.getFormId();
            this.form[ formId ] = form;
            form = null;
            var _form = this.form[ formId ];

            _form
                .add();

            _form.$ow
                .css({ "z-index" : formId });

            // reset and add event listener for the new windowForm.
            this.mod.eventController
                .set({
                    "callback" : this.initialize.bind(this) })
                .initialize();
                                                 
            this.formId++;
            return {
                "$form" : _form.$ow,
                "$content" : _form.$ct,
                "formId" : formId
            }
        },

        convert : function($content) {
            var isExplorized = $content.is(
                "." + this.pref + this.lb.content +
                ",." + this.pref + this.lb.ow
            );
            console.log($content);
            
            if (isExplorized) {                
                var $oldElem, $oldElemClone, $wrapperElement, formId;
                
                formId = this.parse($content).formId;
                $oldElemClone = this.form[formId].getOldElemInfo();
                $oldElem = $oldElemClone.clone(true, true)
             
                $oldElem
                   .appendTo(this.$wrapper);
                
                $content.children()
                   .appendTo($oldElem);                    
             
                $oldElemClone.remove();
                this.form[formId].get$ow().remove();
                
                return $oldElem;
            } else {             
                var $oldElem, $newContent, newForm;
                
                $oldElem = $content.clone(true, true);
                $oldElem.children().remove();
                $oldElem.appendTo(this.$secretRepo);
                                                 
                newForm = this.add(),
                $newContent = newForm.$content;

                this.form[newForm.formId].setOldElemInfo($oldElem);
                                
                $content.children().clone(true, true).appendTo($newContent);
                $content.remove();
                $newContent.attr("id", id);
    
                return newForm;
            }
        },
            
        remove : function(formId) {
            this.form[formId].remove();
        },
            
        initialize : function() {
            this.mod.eventController
                .initialize();

            core.unselectAllElem();
            // 変更があったformのみにinitializeを絞るべき？
            for (var i = 0, l = this.form.length; i < l; i++) {
                var form = this.form[ i ];
                form .initialize();
            }
        },
            
        get$wrapper : function() { return this.$wrapper; },
        
        get$ow : function(formId) {
            if (arguments[0] === "all" || arguments.length === 0)
                return $( "." + this.pref + this.lb.outrWrap );
            else
                return this.form[formId].get$ow();
        },

        get$iw : function(formId) {
            if (arguments[0] === "all" || arguments.length === 0)
                return $( "." + this.pref + this.lb.innrWrap );
            else
                return this.form[formId].get$iw();
        },
            
        get$ct : function(formId) {
            if (arguments[0] === "all" || arguments.length === 0)
                return $( "." + this.pref + this.lb.content );
            else
                return this.form[formId].get$ct();
        },
       
        get$elem : function(formId, elemId) {
            if (arguments.length === 0 || arguments[0] === "all")
                return $( "." + this.pref + this.lb.elem );
            else if (arguments.length === 1)
                return this.form[formId].get$elem();
            else if (arguments[0] === "selected")
                return $( "." + this.lb.selected + ((arguments[1]) ? ", ." + this.lb.preselect : "") )
            else
                return this.form[formId].get$elem(elemId);
        },

        get$titleBar : function(formId) {
            if (arguments[0] === "all" || arguments.length === 0) {
                return $( "." + this.pref + "titleBar" );
            } else {
                return this.form[formId].get$titleBar();
            }
        },

        get$titleSpace : function(formId) {
            if (arguments[0] === "all" || arguments.length === 0) {
                return $( "." + this.pref + "titleSpace" );
            } else {
                return this.form[formId].get$titleSpace();
            }
        },
            
        parse : function ($target) {
            var _formId = $target.attr("class").match(/form_[0-9]{1,}/),                
                formId  = (_formId !== null ? _formId[0].slice(5)-0 : false),
                _elemId = $target.attr("class").match(/elem_[0-9]{1,}/),
                elemId  = (_elemId !== null ? _elemId[0].slice(5)-0 : false);
                    
            return {
                "formId" : formId,
  //              "part"   : part,
                "elemId" : elemId
            }
        },            
                            
        selectElem : function(formId, elemId) { this.form[formId].selectElem(elemId); },
        preselectElem : function(formId, elemId) { this.form[formId].preselectElem(elemId); },
        unselectElem : function(formId, elemId) { this.form[formId].unselectElem(elemId); },

        unselectAllElem : function() {
            $( "." + this.pref + this.lb.elem )
                .removeClass( this.lb.selected  )
                .removeClass( this.lb.preselect )
                .addClass  (this.lb.unSelect  );
        },

        selectPropery : function(formId, elemId) {
            $( "." + this.lb.preselect )
                .removeClass( this.lb.preselect )
                .addClass  (this.lb.selected  );
        },

        isSelect : function(formId, elemId, includePreslct) {
            return (
                this.get$elem(formId, elemId)
                    .is( "."+this.lb.selected + ((includePreslct) ? ", ."+this.lb.preselect : "") )
            )
        },

        cb : function(funcObj, handleName, argsArray) {
            if(typeof funcObj[ handleName ] !== "undefined") {
                return funcObj[ handleName ].apply(this, argsArray);
            }
        }
    }

}());

exp.core = core;
})(exp);
﻿(function(exp) {

var util;
util = (function(core) {
    var ua = navigator.userAgent;
    
    function delayTrigger (event, startX, startY, threshold, removeTrigDelayer, callback) {
        // calculate torelance range.
        var outOfRange = (
            Math.sqrt(
                Math.pow((event.pageX - startX), 2) +
                Math.pow((event.pageY - startY), 2) 
           ) > threshold
       );

        if (outOfRange) {
            removeTrigDelayer();
            callback();
        }
    }

    return {
        browser : {
            "chrome"    : (ua.indexOf("Chrome") !== -1),
            "firefox"   : (ua.indexOf("Firefox")!== -1),
            "ie"        : (ua.indexOf("MSIE")   !== -1),
            "opera"     : (ua.indexOf("Opera")  !== -1),
            "safari"    : (ua.indexOf("safari") !== -1)
        },
                
        preventSelect : function() {
            return (
                this.browser.ie || this.browser.firefox
                    ? "onmousemove=\"window.getSelection().removeAllRanges();\"" 
                    : ""
           )
        },
        
        createDiv : function($target, name_, formId) {
            $target
                .append(
                    "<div " +
                        "class=\""+
                            core.pref + name_ + " " +
                            core.pref + core.lb.form + "_" + formId +
                        "\" " +
                        this.preventSelect() +
                    ">" +
                    "</div>"   );
            
            return $("." + core.pref + core.lb.form + "_" + formId)
                    .filter("." + core.pref + name_)
        },
            
        setTrigDelayer : function (startX, startY, torelance, callback) {
            this.mouseMove_delayer = function (event) {
                delayTrigger(
                    event,
                    startX, startY,
                    torelance,
                    this.removeTrigDelayer,
                    callback
               );
            };
            $(window).bind("mousemove", this.mouseMove_delayer.bind(this));
        },

        removeTrigDelayer : function (event) {
            $(window).unbind("mousemove");
        }
    }
}(exp.core));

exp.util = util;
})(exp);
(function(exp) {

var resizer;
resizer = (function(util) {
    var NewResizer = function() {};

    NewResizer.prototype = (function() { 
        var angleStr    = "top bottom left right top_left top_right bottom_left bottom_right",
            angleArray  = angleStr .split(" "),
            protoMember = {},
            handle = {};
                
        handle.top = {
            css : function () {
                return {
                    "top":      0 - this.handleWidth + this.topGap,
                    "left":     0,
                    "width":    this.width,
                    "height":   this.handleWidth,
                    "z-index":  this.zIndex,
                    "cursor":   "n-resize"
                }
            },
            mouseMove : function (event) { this.$t.css( handle.top.range.bind(this)(event)); },
            mouseUp : function (event) {
                this.$handle["left"]    .css({ "height": this.$t.height() - this.topGap });
                this.$handle["right"]   .css({ "height": this.$t.height() - this.topGap });
            },
            range : function (event) {
                var top, height,
                    nowTop      = event.pageY - this.divY_Hnd_top,
                    divY        = this.prevTop - nowTop,
                    _height     = (this.height - this.borderHeight) + divY,
                    accTerm     = (nowTop + this.topGap < 0),
                    attMax      = (_height > this.limit.maxHeight),
                    attMin      = (_height < this.limit.minHeight),
                    priority    = ( (this.prevBottom - this.limit.maxHeight) > 0 );

                if (accTerm || attMax) {
                    if (priority) {
                        top     = this.prevBottom - this.limit.maxHeight;// - this.divY_Hnd_top;
                        height  = this.height - this.borderHeight - (top - this.prevTop);
                    } else if (nowTop + this.topGap < 0) {
                        top     = 0 - this.topGap;
                        height  = this.height - this.borderHeight - (top - this.prevTop);
                    }
                } else if (attMin) {
                    top     = this.prevBottom - this.limit.minHeight - this.borderHeight;// - this.divY_Hnd_top;
                    height  = this.limit.minHeight;
                } else {
                    top     = nowTop;
                    height  = this.height - this.borderHeight - (top - this.prevTop);
                }

                return { "top" : top, "height" : height };
            }
        },

        handle.bottom = {
            css : function () {
                return {
                    "bottom":   0 - this.handleWidth + this.bottomGap,
                    "left":     0,
                    "width":    this.width,
                    "height":   this.handleWidth,
                    "cursor":   "s-resize",
                    "z-index":  this.zIndex
                }
            },
            mouseMove : function (event) { this.$t.css( handle.bottom.range.bind(this)(event)); },
            mouseUp : handle.top.mouseUp,
            range : function (event) {
                var height,
                    nowTop      = event.pageY - this.divY_Hnd_bottom,
                    divY        = nowTop - this.prevBottom,
                    _height     = (this.height - this.borderHeight) + divY,
                    accTerm     = (nowTop > this.wrap.height),
                    attMax      = (_height > this.limit.maxHeight),
                    attMin      = (_height < this.limit.minHeight),
                    priority    = ( (this.prevTop + this.limit.maxHeight) < this.wrap.height );

                if (accTerm || attMax) {
                    if (priority)   height = this.limit.maxHeight;
                    else            height = this.wrap.height - this.prevTop;
                } else 
                    if (attMin)     height = this.limit.minHeight;
                    else            height = _height;

                return { "height" : height };
            }
        },

        handle.left = {
            css : function () {
                return {
                    "top":      0 + this.topGap,
                    "left":     0 - this.handleWidth + this.leftGap,
                    "width":    this.handleWidth,
                    "height":   this.height - this.topGap,
                    "cursor":   "e-resize",
                    "z-index":  this.zIndex
                }
            },
            mouseMove : function (event) { this.$t.css( handle.left.range.bind(this)(event)); },
            mouseUp : function (event) {
                this.$handle["top"]     .css({ "width" : this.$t.width() });
                this.$handle["bottom"]  .css({ "width" : this.$t.width() });
            },
            range : function (event) {
                var left, width,
                    nowLeft     = event.pageX - this.divX_Hnd_left,
                    divX        = this.prevLeft - nowLeft,
                    _width      = (this.width - this.borderWidth) + divX,
                    accTerm     = (nowLeft + this.leftGap < 0),
                    attMax      = (_width > this.limit.maxWidth),
                    attMin      = (_width < this.limit.minWidth),
                    priority    = ( (this.prevRight - this.limit.maxWidth) > 0 );

                if (accTerm || attMax) {
                    if (priority) {
                        left    = this.prevRight - this.limit.maxWidth;// - this.divX_Hnd_left;
                        width   = this.width - this.borderWidth - (left - this.prevLeft);
                    } else if (nowLeft + this.leftGap < 0) {
                        left    = 0 - this.leftGap;
                        width   = this.width - this.borderWidth - (left - this.prevLeft);
                    }
                } else if (attMin) {
                    left    = this.prevRight - this.limit.minWidth - this.borderWidth;// - this.divX_Hnd_left;
                    width   = this.limit.minWidth;
                } else {
                    left    = nowLeft;
                    width   = this.width - this.borderWidth - (left - this.prevLeft);
                }

                return { "left" : left, "width" : width };
            }
        },

        handle.right = {
            css : function () {
                return {
                    "top":      0 + this.topGap,
                    "right":    0 - this.handleWidth + this.rightGap,
                    "width":    this.handleWidth,
                    "height":   this.height - this.topGap,
                    "cursor":   "w-resize",
                    "z-index":  this.zIndex
                }
            },
            mouseMove : function (event) { this.$t.css( handle.right.range.bind(this)(event)); },
            mouseUp : handle.left.mouseUp,
            range : function (event) {
                var width,
                    nowLeft     = event.pageX - this.divX_Hnd_right,
                    divX        = nowLeft - this.prevRight,
                    _width      = (this.width - this.borderHeight) + divX,
                    accTerm     = (nowLeft > this.wrap.width),
                    attMax      = (_width > this.limit.maxWidth),
                    attMin      = (_width < this.limit.minWidth),
                    priority    = ( (this.prevLeft + this.limit.maxWidth) < this.wrap.width );

                if (accTerm || attMax) {
                    if (priority)   width = this.limit.maxWidth;
                    else            width = this.wrap.width - this.prevLeft;
                } else 
                    if (attMin)     width = this.limit.minWidth;
                    else            width = _width;

                return { "width" : width };
            }
        },

        handle.top_left = {
            css : function () {
                return {
                    "top":      0 - this.handleWidth + this.topGap,
                    "left":     0 - this.handleWidth + this.leftGap,
                    "width":    this.angleHandleSize,
                    "height":   this.angleHandleSize,
                    "cursor":   "nw-resize",
                    "z-index":  this.zIndex + 1
                }
            },
            mouseMove : function (event) { 
                handle.top.mouseMove.bind(this)(event);  
                handle.left.mouseMove.bind(this)(event); 
            },
            mouseUp : function (event) { 
                handle.top.mouseUp.bind(this)(event);  
                handle.left.mouseUp.bind(this)(event); 
            }
        },

        handle.top_right = {
            css : function () {
                return {
                    "top":      0 - this.handleWidth + this.topGap,
                    "right":    0 - this.handleWidth + this.rightGap,
                    "width":    this.angleHandleSize,
                    "height":   this.angleHandleSize,
                    "cursor":   "ne-resize",
                    "z-index":  this.zIndex + 1
                }
            },
            mouseMove : function (event) { 
                handle.top.mouseMove.bind(this)(event);  
                handle.right.mouseMove.bind(this)(event); 
            },
            mouseUp : handle.top_left.mouseUp
        },

        handle.bottom_left = {
            css : function () {
                return {
                    "bottom":   0 - this.handleWidth + this.bottomGap,
                    "left":     0 - this.handleWidth + this.leftGap,
                    "width":    this.angleHandleSize,
                    "height":   this.angleHandleSize,
                    "cursor":   "sw-resize",
                    "z-index":  this.zIndex + 1
                }
            },
            mouseMove : function (event) { 
                handle.bottom.mouseMove.bind(this)(event);  
                handle.left.mouseMove.bind(this)(event); 
            },
            mouseUp : handle.top_left.mouseUp
        },

        handle.bottom_right = {
            css : function () {
                return {
                    "bottom":   0 - this.handleWidth + this.bottomGap,
                    "right":    0 - this.handleWidth + this.rightGap,
                    "width":    this.angleHandleSize,
                    "height":   this.angleHandleSize,
                    "cursor":   "se-resize",
                    "z-index":  this.zIndex + 1
                }
            },
            mouseMove : function (event) {
                handle.bottom.mouseMove.bind(this)(event);
                handle.right.mouseMove.bind(this)(event);
            },
            mouseUp : handle.top_left.mouseUp
        }

        function mouseDown_common ( x, y, angle ) {
            var $w = this.$wrapper,
                wos = $w.offset();
            
            this.width      = this.$t.outerWidth(true);
            this.height     = this.$t.outerHeight(true);            
            this.prevTop    = this.$t.position().top;
            this.prevLeft   = this.$t.position().left;
            this.prevBottom = this.prevTop + this.height;
            this.prevRight  = this.prevLeft + this.width;
            this.wrap = {
                top     : wos.top,
                bottom  : wos.top + $w.height(),
                left    : wos.left,
                right   : wos.left + $w.width(),
                width   : $w.width(),
                height  : $w.height()
            };
            this.divX_Hnd_left  = x - this.prevLeft; // divasion from handle central axis. 
            this.divX_Hnd_right = x - this.prevLeft - this.width; // divasion from handle central axis. 
            this.borderWidth   = ( parseInt(this.$t.css("border-left-width")) +
                                    parseInt(this.$t.css("border-right-width")) );
            this.divY_Hnd_top   = y - this.prevTop; // divasion from handle central axis. 
            this.divY_Hnd_bottom = y - this.prevBottom; // divasion from handle central axis. 
            this.borderHeight   = ( parseInt(this.$t.css("border-top-width")) +
                                    parseInt(this.$t.css("border-bottom-width")) );
            
            this.callback.start();

            this.event.mouseMove[ angle ] = function (event) {
                handle[ angle ].mouseMove.bind(this)(event);
                this.callback.resizing();
            }.bind(this);
            $(window).bind( "mousemove", this.event.mouseMove[ angle ] );
            
            this.event.mouseUp = protoMember.mouseUpEvent || function (event) {
                $(window)
                    .unbind( "mouseup",    this.event.mouseUp );                    
                handle[ angle ].mouseUp.bind(this)(event, this);
                this.callback.end();
            }.bind(this);
            $(window).bind( "mouseup", this.event.mouseUp );            
        }

        function createHandleDiv ( angle ) {
            this.$t
                .append(
                    "<div " +
                        "class=\"" +
                            this.clsName +" "+
                            "hnd_" + angle +
                        "\" " +
                        "id=\"" +
                            this.clsName +"_"+ angle +"_"+ this.id +
                        "\" " +
                        exp.util.preventSelect +
                    ">" +
                    "</div>"
                );
            return this.$t .children( "." + this.clsName ) .filter( ".hnd_" + angle );
        } 

        function setCss ( angle ) {
            this.$handle[ angle ].css( handle[ angle ].css.bind(this)() );
        }

        function setMouseDown ( angle ) {
            var that = this;
            this.event.mouseDown[ angle ] = function (event) {
                event.stopPropagation();
                mouseDown_common.bind(that)( event.pageX, event.pageY, angle );
                this.callback.start();
            }.bind(this);
                        
            this.$handle[ angle ]
                .bind( "mousedown",    this.event.mouseDown[ angle ].bind(this) );
        }
        
        return {
            set : function (args) {
                args = args || { gap:null, limit:null };

                this.$wrapper   = args  .wrapper;
                this.clsName    = args  .clsName    || "hd_ex_resize";
                this.id         = String( args.id ) || null;
                this.angle      = args  .angle      || angleStr;
                this.handleWidth = args .handleWidth|| 15;
                this.angleHandleSize = args .angleHandleSize || 15;
                this.zIndex     = args  .zIndex     || 0;
                this.leftGap    = (typeof args .leftGap !== "number")   ? 0 : args.leftGap,
                this.rightGap   = (typeof args .rightGap !== "number")  ? 0 : args.rightGap,
                this.topGap     = (typeof args .topGap !== "number")    ? 0 : args.topGap,
                this.bottomGap  = (typeof args .bottomGap !== "number") ? 0 : args.bottomGap
                this.limit      = {
                    maxWidth    : (typeof args.maxWidth !== "number") ? 9999  : args.maxWidth,
                    maxHeight   : (typeof args.maxHeight !== "number") ? 9999 : args.maxHeight,
                    minWidth    : (typeof args.minWidth !== "number") ? 50  : args.minWidth,
                    minHeight   : (typeof args.minHeight !== "number") ? 50 : args.minHeight
                };

                this.callback    = {
                    start       : args .start       || function() {},
                    resizing    : args .resizing    || function() {},
                    end         : args .end         || function() {}
                };
                
                return    this;
            },

            add : function( $target ) {
                this.$t    = $target;
                this.$handle = {};
                this.event = { mouseDown:{}, mouseMove:{}, mouseUp:{} };

                this.width    = this.$t.outerWidth(true);
                this.height    = this.$t.outerHeight(true);

                for ( var i=0, a=this.angle.split(" "), l=a.length; i<l; i++ ) {
                    var angle = String( a[i] );
                    this.$handle[ angle ] = createHandleDiv.bind(this)( angle );
                    setCss.bind(this)( angle );
                    setMouseDown.bind(this)( angle );
                }
            
                return    this;
            }
        } //return
    }()); //prototype

    return NewResizer;
}(exp.util));

exp.resizer = resizer;
})(exp);/** 
 * @fileOverview A module for window-form alignment.
 *  
 * @author Masami Yonehara
 * @version 0.1
 */

(function(exp){

var aligner;

/**
 * @namespace aligner
 */
aligner = (function(core, util){
    /** @private */
    var callback;
    
    /**
     * @private
     * @param $ow
     */
    function getZindex($ow) {
        return $ow
            .css("z-index");
    }

    /**
     * 与えられたDOMオブジェクトが持つz-indexについて、指定された条件のものを返す。
     * @private
     * @param formObj
     * @returns {object} max 最大のz-indexを返す。
     * @returns {object} min 最小のz-indexを返す。
     */
    function getMaxZindex(formObj) {
        var zIndexArray = [],
            all$ow = core.get$ow("all");
        
        for (var i = 0, l = all$ow.length; i < l; i++) {
            zIndexArray.push(getZindex(all$ow.eq(i)));
        }
        
        return {
            "max" : Math.max.apply(null, zIndexArray),
            "min" : Math.min.apply(null, zIndexArray)
        }
    }

    /**
     * z-indexを設定する。
     * @private
     * @param $ow 整列させるラッパー要素
     * @param val 加算もしくは代入する値
     * @param method addの場合は加算、setの場合はその数値の代入とする。
     */
    function setZindex($ow, val, method) {
        var current = $ow.css("z-index")-0;

        switch (method) {
            case "add":
                $ow.css({ "z-index":  current + val    });
                break;
            case "set":
                $ow.css({ "z-index":  val });
                break;
        };
    }
            
    return {        
        /**
         * 重なり順を判定し、クリックされたものを最前面に表示する。
         * また、終了時に指定のコールバック処理を行う。
         * @param formId
         * @param callback
         * @returns {object} this
         */
        setFocus : function(formId, callback) {                
            var i, l, $ow_rest, prevZindex, zIndex = {};
            
            var focused    = this.focusedFormId,
                clicked    = formId,
                $ow        = core.form[formId].get$ow();

            // if selected window's id differs with previous active window...
            if (clicked !== focused) {
                zIndex      = getMaxZindex.bind(this)(core.form);
                prevZindex  = getZindex.bind(this)($ow);

                setZindex.bind(this)($ow, zIndex.max + 1, "set");

                for (var restId in core.form) {
                    $ow_rest = core.form[restId-0].get$ow();
                    
                    if (getZindex.bind(this)($ow_rest) > prevZindex) {
                        setZindex.bind(this)($ow_rest, -1, "add");
                    }
                }

                this.focusedFormId = clicked;
                callback.focusChanged();
                core.callback.focusChanged();

            } else {
                this.focusedFormId = clicked;
                core.callback.focusKeeped();
            }
            
            return this;
        }
    }
}(exp.core, exp.eutil));

exp.aligner = aligner;
})(exp);
(function(exp){

var selector;
selector = (function(core, util){
    var slctBoxId = "slctBox",
        timer = {},
        param = {},
        _preVal,
        $box,
        $preselect = [],
        autoScroll,
        scrollWeight,
        // 
        prevShift,
        prevClicked,
        startId,
        noSelect,
        // event handle
        ehandle_drag;

    function byDrag (
        relX, relY,
        relX_start, relY_start,
        owLeft, owTop, owHeight,
        wrapWidth, wrapHeight,
        contentWidth, contentHeight,
        $iw, $elem, formId,
        ctrlKey, shiftKey
   ) {
        var scrX    = $iw.scrollLeft(),
            scrY    = $iw.scrollTop(),
            nowRelX    = relX + scrX,
            nowRelY    = relY + scrY,
            t;

        // calculate and limit range.
        if      (nowRelX > contentWidth)
            nowRelX = contentWidth;
        else if (nowRelX < 0)
            nowRelX = 0; 
        if      (nowRelY > contentHeight)
            nowRelY = contentHeight;
        else if (nowRelY < 0)
            nowRelY = 0;

        if (relX_start > nowRelX) { t = nowRelX; nowRelX = relX_start; relX_start = t; }
        if (relY_start > nowRelY) { t = nowRelY; nowRelY = relY_start; relY_start = t; }

        // scroll function for the browser who don't have auto-scroll func. ex ie, opera
        if (core.autoScroll) {
            if      (relY < 0)
                scrollCt($iw, relY * core.scrollWeight);
            else if (relY > owHeight)
                scrollCt($iw, (relY - owHeight) * core.scrollWeight);
            else
                stopScrollCt(); 
        }
        
        // draw a box that shows selecting range.
        $box
            .css({
                "left"  : relX_start,
                "top"   : relY_start,
                "width" : nowRelX - relX_start,
                "height": nowRelY - relY_start });

        // determinate whether or not elements are in range
        for (var i = 0, l = $elem.length; i < l; i++) {
            var $e = core.get$elem(formId, i), 
                pos = $e.position();

            var left    = pos.left  + parseInt( $e.css( "margin-left")),
                right   = pos.left  + parseInt( $e.css( "margin-left"))   + $e.width(),
                top     = pos.top   + parseInt( $e.css( "margin-top"))    + scrY,
                bottom  = pos.top   + parseInt( $e.css( "margin-top"))    + scrY + $e.height();

            // in range?
            var outRange = (left > nowRelX || right < relX_start || top > nowRelY || bottom < relY_start);
            if (!outRange)
                core.preselectElem(formId, i);
            else if (!ctrlKey && !shiftKey)
                core.unselectElem(formId, i);
        }
    }

    function scrollCt ($iw, val) {
        if (timer === null || val !== _preVal) {
            clearInterval(timer);
            timer = setInterval(function() {//
                $iw.scrollTop( $iw.scrollTop() + val); 
            }, 1);
            _preVal = val;
        }
    }

    function stopScrollCt() {
        clearInterval(timer);
        timer = null;
    }
    
    function removeBox() {
        if ($box) $box.remove();
    }
    
    return {                
        set : function(args) {
            return this;
        },

        onElem : function(ctrlKey, shiftKey, formId, clickedId, cb) {                
            var p1, p2, i,
                isSelect = core.isSelect(formId, clickedId);
                                
            if (shiftKey) {
                // shiftを押しながら選択した場合、
                // もしリセット後初めて押したのなら、その1つ前の選択を基点にする。   // 2回目以降であれば、基点は変えない。
                if (!prevShift) startId = prevClicked;
                               
                if (startId > clickedId) {
                    p1 = clickedId,
                    p2 = startId;
                } else {
                    p1 = startId,
                    p2 = clickedId;
                }
                if (!ctrlKey) core.unselectAllElem();
                for (var i = p1, counter = 0; i <= p2; ++i) core.preselectElem( formId, i);
                
                core.cb( cb, "selectWithShift", [ formId, clickedId ]);
            } else if (ctrlKey) {
                if (isSelect) { 
                    core.unselectElem( formId, clickedId);
                    core.cb( cb, "unselectByCtrl", [ formId, clickedId ]);
                } else {
                    core.preselectElem( formId, clickedId);
                    core.cb( cb, "preselectByCtrl", [ formId, clickedId ]);
                 }
            } else if (!ctrlKey) {
                if (isSelect) { 
                    core.cb( cb, "downOnSelected", [ formId, clickedId ]);
                   } else {
                    core.unselectAllElem();
                    core.preselectElem( formId, clickedId);
                    core.cb( cb, "preselect", [ formId, clickedId ]);
                }
            }
            prevClicked = clickedId;
            prevShift = shiftKey;
        },

        onBack : function (x, y, formId) {                
            var $ow     = core.get$ow(formId),
                $iw     = core.get$iw(formId),
                $ct     = core.get$ct(formId),
                $elem   = core.get$elem(formId);
            
            noSelect = true;
            
            // The following logic prevent the status changes into "byDrag" that is caused immediately, 
            // so as to keep the status "mouseDownonNonElement" in case of selecting no elements eventually.
            util.setTrigDelayer( x, y, 1, function() {
                var $wrapper    = core.get$wrapper(),
                    wrapLeft    = $wrapper.offset().left,
                    wrapTop     = $wrapper.offset().top,
                    wrapWidth   = $wrapper.width(),
                    wrapHeight  = $wrapper.height(),
                    owPos       = $ow.position(),
                    owLeft      = owPos.left,
                    owTop       = owPos.top,
                    owHeight    = $ow.outerHeight(),
                    owScrLeft   = $iw.scrollLeft(),
                    owScrTop    = $iw.scrollTop(),
                    relX_start  = x - wrapLeft - owLeft + owScrLeft,
                    relY_start  = y - wrapTop - owTop + owScrTop,
                    owBottom    = owTop + owHeight,
                    fieldWidth  = $ct.width(),
                    fieldHeight = $ct.height(),
                    contentWidth  = fieldWidth  - 2,
                    contentHeight = fieldHeight - 2;

                noSelect = false;
            
                $box = util.createDiv(
                    $ct,
                    slctBoxId,
                    formId,
                    util.preventSelect()
                );
                
                // bind new mousemove event.
                ehandle_drag = function (event) {
                    byDrag(
                        event.pageX - wrapLeft - owLeft, event.pageY - wrapTop - owTop,
                        relX_start, relY_start,
                        owLeft, owTop, owHeight,
                        wrapWidth, wrapHeight,
                        contentWidth, contentHeight,
                        $iw, $elem, formId,
                        event.ctrlKey, event.shiftKey
                   );
                };

                $(window)
                    .bind( "mousemove", ehandle_drag);
            });
        },

        mouseUp : function() {                
            stopScrollCt();
            removeBox();
            if (noSelect) core.unselectAllElem();
            noSelect = false;
            return this;
        }
    }
}(exp.core, exp.util));

exp.selector = selector;
})(exp);
/** 
 * @fileOverview A module for manipulation.
 * 	
 * @author Masami Yonehara
 * @version 0.1
 */

(function(exp){

var manipulator;
/**
 * A module for manipulation.
 * @namespace		
 */
manipulator = (function(core, util){
    /** @private */
    var $cursor,           
        active      = false, 
        baseFormId,
        elemNum,
        mode;
    
    /**
     * ドラッグ処理をまとめる。
     * @private
     * @param event
     */
    function dragElement_(event) {
        setCurStatus_(event.ctrlKey);
        displayCursor_(event.pageX, event.pageY);
    }
    
    /**
     * ctrlの押下状態に応じて、カーソルのCSSと状態を示す変数を変化させる。
     * @param ctrlKey
     */
    function setCurStatus_(ctrlKey) {
        var newClass =
            ctrlKey 
                ? (core.lb.cursor_copy)
                : (core.lb.cursor_move);

        if ($cursor != null){
            $cursor
                .removeClass(core.lb.cursor_copy)
                .removeClass(core.lb.cursor_move)
                .addClass(newClass);
        }

        mode = (ctrlKey) ? "copy" : "move"; 
    }
    
    /**
     * カーソルと内部のエレメント数の表示を更新する。
     * @param x
     * @param y
     */
    function displayCursor_(x, y) {
        $cursor
            .css({
                "top"    : y,
                "left"    : x
            })
            .children()
            .text(elemNum);
    }

    /**
     * カーソルを描画するdiv要素を、body要素に作成する。
     * @returns {$object} カーソルを示すjQueryオブジェクト
     */
    function createCursor_() {
        $("body")
            .append(
                "<div " +
                    "id=\""+
                        core.pref + core.lb.cursor +
                    "\" " +
                    "class=\""+
                        core.lb.cursor_move +
                    "\"" +
                    util.preventSelect() +
                ">" +
                    "<div " +
                        "id=\""+
                            core.pref + core.lb.cursor_text +
                        "\"" +
                        util.preventSelect() +
                    ">" +
                    "</div>" +
                "</div>"
           );    
            
        return $("#" + core.pref + core.lb.cursor);
    }

    /**
     * エレメントをコピーする。
     * @param $elem
     * @param formId
     */
    function copyElements_($elem, formId) {
        core.get$ct(formId)
            .append($elem.clone());
    }

    /**
     * エレメントを移動する。
     * @param $elem
     * @param formId
     */
    function moveElements_($elem, formId) {
        copyElements_($elem, formId);
        $elem.remove();
    }
    
    /**
     * ドラッグ後マウスを話した際、どの処理を行うかを判定する。
     * @param $elem
     * @param targetFormId
     */
    function manipulation_($elem, targetFormId) {
        if      (mode === "copy")   copyElements_($elem, targetFormId);
        else if (mode === "move")   moveElements_($elem, targetFormId);    
    }
    
    return {
        /**
         * @param event
         * @param formId
         */
        startDrag : function (event, formId) {
            baseFormId = formId;
            elemNum =
                core.get$elem("selected", true)
                    .size();

            util.setTrigDelayer(event.pageX, event.pageY, 18, callback);
            
            function callback() {
                $cursor= createCursor_();
                $(window)
                    .bind("mousemove", dragElement_);
                active = true;
            }
        },

        /**
         * マウスを上げた時、つまりエレメントをドロップした時の処理。
         * イベント判定および事前処理は、evtcontrollerで行う。
         * @param targetFormId
         * @param callback
         */
        mouseUp : function (targetFormId, callback) {
            var $elem = core.get$elem("selected", true);

            if (active) manipulation_($elem, targetFormId);
            
            targetFormId = null;
            active = false;
            this.removeCursor();
            
            return $elem;
        },
        
        /**
         * 
         */
        isActive : function() {
            return active;
        },
        
        /**
         * ctrlの押下状態プロパティを更新する。
         * これもmanipulatorモジュール内ではなく、イベント判定のある
         * evtcontrollerから呼び出される。
         */
        setCurStatus : function (ctrlKey) {
            setCurStatus_(ctrlKey);
        },
        
        /**
         * カーソルを削除する。内部プロパティは変更しない。
         */
        removeCursor : function () {
            if (typeof $cursor !== "undefined") $cursor.remove();
        }
    }    
}(exp.core, exp.util, exp.core.mod));

exp.manipulator = manipulator;
})(exp);
(function(exp){

var titleBar;
titleBar = (function(core, util){
    function NewTitleBar(form){
        this.form = form;
        this.formId = form.formId;
    }

    NewTitleBar.prototype = (function () {
        var titleBar    = "titleBar",
            removeBtn   = "removeBtn",
            titleSpace  = "titleSpc",
            string      = "string",
            ellipsis    = "ellipsis";

        function adjustLocation ($bar, tBarHeight) {
            $bar
                .css({
                    "position"  : "absolute",
                    "width"     : "100%",
                    "height"    : tBarHeight });
        }

        return {
            set : function(args) {
                args = args || {};

                this.callback = {
                    remove : args .remove  || function() {},
                };
                
                return this;
            },
                 
            add : function() {                
                this.$titleBar = util.createDiv(
                    this.form.get$ow(),
                    titleBar,
                    this.formId
                );

                this.$titleSpace = util.createDiv(
                    this.$titleBar,
                    titleSpace,
                    this.formId
                );
                                
                this.$removeBtn = util.createDiv(
                    this.$titleBar,
                    removeBtn,
                    this.formId
                );
                
                this.$removeBtn.bind("click", this.callback.remove);                
                adjustLocation(this.$titleBar, core.tBarHeight);

                return this.$titleBar;
            },
            
            get$titleBar : function() { return this.$titleBar; },                
            get$titleSpace : function() { return this.$titleSpace; }
        }
    }());

    return    NewTitleBar;
}(exp.core, exp.util));

exp.titleBar = titleBar;
})(exp);
(function(exp){

var locator;
locator = (function(core, util){
    var ehandle;

    function mouseMove(
        $ow, 
        owWidth, owHeight, 
        wrapWidth, wrapHeight, tBarHeight, 
        relX, relY, wp
    ){
        var x, y;
        
        // calculate and limit range.
        if (relX + owWidth > wrapWidth)
            x = wrapWidth - owWidth;
        else if (relX < 0)
            x = 0;
        else
            x = relX;   
        
        if (relY + owHeight > wrapHeight)
            y = wrapHeight - owHeight;
        else if (relY - tBarHeight < 0)
            y = tBarHeight;
        else
            y = relY;   
        
        // この時点で、xとyは絶対座標である。
        
        $ow
            .css({
                "top"  : y,
                "left" : x });
    }  
                        
    return {
        mouseDown : function (absX, absY, $ow, $titleBar) {
            var op          = $ow.offset(),
                divX        = absX - op.left, // divasion from handle central axis. 
                divY        = absY - op.top,  // divasion from handle central axis.
                
                $w          = core.get$wrapper(),
                wp          = $w.offset(),
                wrapWidth   = $w.innerWidth(),
                wrapHeight  = $w.innerHeight(),
                owWidth     = $ow.width(),
                owHeight    = $ow.height(),
                tBarHeight  = $titleBar.height();  
                
            ehandle = function(event) {
                //event.stopPropagation();
                var relX        = event.pageX - divX - wp.left,
                    relY        = event.pageY - divY - wp.top;
                
                mouseMove(
                    $ow,                    
                    owWidth, owHeight,
                    wrapWidth, wrapHeight,
                    tBarHeight,
                    relX, relY,
                    wp
                );
            };
            
            $(window)
                .bind( "mousemove", ehandle );
        }
    }
}(exp.core, exp.eutil));

exp.locator = locator;
})(exp);
(function(exp){

var eventController;
eventController = (function(core, util){
    var handle,
        $window = $(window),
        callback,
        targetFormId,
        baseFormId;
    
    // method
    function alignment (formId){
        core.mod.aligner
            .setFocus(formId, {
                "focusChanged" : function() { core.unselectAllElem(); }
            });
    }

    function mouseDown_elem (event, formId, elemId) {
        alignment(formId);
        baseFormId = formId;
      
        core.mod.selector
            .onElem(event.ctrlKey, event.shiftKey, formId, elemId, {
                downOnSelected  : startDrag,
                selectWithShift : startDrag,
                preselectByCtrl : startDrag,
                preselect       : startDrag
            });

        function startDrag(){ core.mod.manipulator.startDrag(event, baseFormId); };
    }

    function mouseDown_content (event, formId, part, elemId) {
        alignment(formId);

        core.mod.selector
            .onBack(event.pageX, event.pageY, formId);
    }

    function mouseDown_titleBar (event, formId) {
        alignment(formId);

        core.mod.locator
            .mouseDown(
                event.pageX, event.pageY, 
                core.get$ow(formId), core.get$titleBar(formId));
    }

    function mouseUp_slctPhase (event) {
        $window
            .unbind("mousemove");
        core.mod.selector
            .mouseUp();

        core.selectPropery();
    }
    
    function mouseUp_termPhase () {
        core.mod.manipulator.removeCursor();
    }

    return {
        set : function(args){
            callback = args. callback || function(){};
            return this;
        },
            
        initialize : function() {
            var self = this;
            targetFormId = null;
            
            handle = handle || {
                mouseDown_elem : function(event) {
                    var p = core.parse($(this));

                    event.stopPropagation();
                    mouseDown_elem(event, p.formId, p.elemId);
                },

                mouseDown_content : function(event) {
                    var p = core.parse($(this));

                    event.stopPropagation();
                    mouseDown_content(event, p.formId, p.part, p.elemId);
                },

                mouseDown_titleBar : function(event) {
                    var p = core.parse($(this));

                    event.stopPropagation();
                    mouseDown_titleBar(event, p.formId);
                },
                    
                mouseUp : function(event) {
                    event.stopPropagation();

                    mouseUp_slctPhase(event);

                    if (core.mod.manipulator.isActive()) {
                        // wait to acquire targetFormId ------
                        var timer = setInterval(function() {
                        if (targetFormId !== null) { clearInterval(timer); 
                        // -----------------------------------
                        core.mod.manipulator.mouseUp(targetFormId);
                        mouseUp_termPhase(event);
                        callback();
                     //   self.initialize();
                        // logic ends-------------------------
                        }}, 1);
                        // -----------------------------------
                    } else {
                        mouseUp_termPhase(event);
                    }
                },

                mouseUp_content : function(event) {
                     targetFormId = core.parse($(this)).formId;
                },

                keyDown : function(event) {
                    core.mod.manipulator.setCurStatus(event.ctrlKey);
                },

                keyUp : function(event) {
                    core.mod.manipulator.setCurStatus(event.ctrlKey);
                }
            };
            
            core.get$elem("all")
                .unbind  ("mousedown")
                .bind    ("mousedown", handle.mouseDown_elem);

            core.get$ct("all")
                .unbind  ("mousedown")
                .bind    ("mousedown", handle.mouseDown_content)
                
                .unbind  ("mouseup")
                .bind    ("mouseup",   handle.mouseUp_content);

            core.get$titleBar("all")
                .unbind  ("mousedown")
                .bind    ("mousedown", handle.mouseDown_titleBar);

            $window
                .unbind  ("mouseup")
                .bind    ("mouseup",   handle.mouseUp);

            document.removeEventListener("keydown",    handle.keyDown, false);
            document.addEventListener   ("keydown",    handle.keyDown, false);
            document.removeEventListener("keyup",      handle.keyDown, false);
            document.addEventListener   ("keyup",      handle.keyDown, false);
        },
        
        alignment : function(formId){
            core.mod.aligner
                .setFocus(formId, {
                    "focusChanged" : function() { core.unselectAllElem(); }
                });
        }        
    }
}(exp.core, exp.util));

exp.eventController = eventController;
})(exp);
﻿(function(exp) {
    
var windowForm;
windowForm = (function(core, util) {
    var idCounter    = 0;

    function NewWindowForm() {
        this.formId     = idCounter;
        
        this.width      = core.width;
        this.height     = core.height;
        this.minWidth   = core.minWidth;
        this.minHeight  = core.minHeight; 
        this.maxWidth   = core.maxWidth; 
        this.maxHeight  = core.maxHeight; 
        this.tBarHeight = core.tBarHeight;

        this.mod = {};
        idCounter += 1;
    }

    NewWindowForm.prototype = (function() {
        var form    = "form",
            elem    = "elem";
            
        function adjustSize ($ct, $ow, height, width) {
            var x    = $ct.position().left,
                y    = $ct.position().top,
                h    = height   || $ct.outerHeight(),
                w    = width    || $ct.outerWidth();
         
             // The CSS height of content (lowermost layer) change "auto".   
             $ct.css({
                 "top"      : 0,
                 "left"     : 0,
                 "width"    : "",
                 "height"   : ""
             });

            // Set the same location and size as the content element before altering.
            // The outer wrapper works indicator for location and size.
            $ow.css({
                "top"       : y + core.tBarHeight, // タイトルバーの分だけ差し引く処理が必要
                "left"      : x,
                "height"    : h,
                "width"     : w
            });
            // The inner wrapper confire display range. this width and height are "100%" for the outer wrapper.
        }

        function resetCtSize ($ct) {
            $ct
                .css({ "height" : "" });
        }

        function fitCtSize ($ct, $iw) {
            // if the content's height is less than that of the inner wrapper, selection range is confired by
            // the content's size (because selection events work in the content object). And so the content's
            // size fit in the inner wrapper.
            if ($ct.height() < $iw.height()) {
                $ct
                    .css({ "height": $iw.height() - 8 });
            }
        }
            
        /**
         * "this.get$elem(i)" is unavailable here. Because get$elem function use
         * id attribute, but id are not prepared before execution of "numbering" function.
         */
        function numbering($allElem, formId) {
            for (var i = 0, l = $allElem.length; i < l; i++) {
                var $tElem = $allElem.eq(i),
                    p = core.parse($tElem),
                    oldFormCls = String(core.pref + core.lb.form + "_" + p.formId),
                    oldElemCls = String(core.pref + core.lb.elem + "_" + p.elemId);
                    
                $tElem
                    .removeClass(oldFormCls)
                    .removeClass(oldElemCls)
                    .addClass(core.pref + core.lb.form + "_" + formId)
                    .addClass(core.pref + core.lb.elem + "_" + i);
            }
        }
            
        return {
             //public
            add : function() {
                this.$ow    = util.createDiv(core.$wrapper,  core.lb.outrWrap,   this.formId);
                this.$iw    = util.createDiv(this.$ow,       core.lb.innrWrap,   this.formId);
                this.$ct    = util.createDiv(this.$iw,       core.lb.content,    this.formId);
                adjustSize(this.$ct, this.$ow, this.height, this.width);

                this.$ct
                    .css({ "padding" : 2 });     // to prevent display vertical-scrollbar over again
                
                /**
                 * mod
                 */
                this.mod.resizer =  new exp.resizer(this),
                this.mod.titleBar = new exp.titleBar(this);
                
                this.mod.resizer
                    .set({
                        "wrapper"       : core.get$wrapper(),
                        "clsName"       : core.pref + core.lb.resize,
                        "id"            : this.formId,
                        "topGap"        : -25,        // for title bar's height
                        "bottomGap"     : 5,
                        "leftGap"       : 5,
                        "zIndex"        : 3,
                        "angleHandleSize": 25,
                        "maxWidth"          : core.maxWidth,
                        "maxHeight"          : core.maxHeight,
                        "minWidth"          : core.minWidth,
                        "minHeight"          : core.minHeight,
                        "start"         : function() {
                            resetCtSize(this.$ct);
                            core.mod.eventController
                                .alignment(this.formId);
                            /*
                            core.mod.aligner
                                .setFocus(formId, {
                                    "focusChanged" : function() { core.unselectAllElem(); }
                                });
                            */
                            core.callback.resizingStart();
                        }.bind(this),
                        /* too decrease rendering speed.
                        "resizing"      : function() {
                            core.callback.resizing();
                        }.bind(this),
                        */
                        "end"           : function() {
                            fitCtSize(this.$ct, this.$iw)
                            core.callback.resizingEnded();                            
                        }.bind(this)   })
                    .add(this.$ow);

                var $bar = this.mod.titleBar
                    .set({
                        "remove" : function() { this.remove(); }.bind(this) })
                    .add();

                return     this.$ct;
            },

            initialize : function() {
                resetCtSize(this.$ct);
                fitCtSize(this.$ct, this.$iw);
                numbering(this.get$elem("all"), this.formId);
            },
            
            remove : function() {
                this.$ow.remove();
                delete this;
                core.callback.formRemoved();
            },
             
            setOldElemInfo : function(elemInfo) {
                this.elemInfo = elemInfo;
            },

            getOldElemInfo : function(elemInfo) {
                return this.elemInfo;
            },
                
            getFormId : function() { return this.formId; },
            get$ow : function() { return this.$ow; },
            get$iw : function() { return this.$iw; },
            get$ct : function() { return this.$ct; },

            get$elem : function (elemId) {
                if (arguments.length === 0 || arguments[0] === "all")
                    return this.get$ct().children("." + core.pref + core.lb.elem);
                else
                    return this.get$ct().children("." + core.pref + core.lb.elem + "_" + elemId);
             //   $("." + core.pref + this.formId + "_" + core.lb.elem + "_" + elemId);
            },

            get$titleBar : function() {
                return this.mod.titleBar.get$titleBar();
            },

            get$titleSpace : function() {
                return this.mod.titleBar.get$titleSpace();
            },
                            
            preselectElem : function (elemId) {
                this.get$elem(elemId)
                    .removeClass(core.lb.unSelect )
                    .removeClass(core.lb.selected )
                    .removeClass(core.lb.preselect)
                    .addClass   (core.lb.preselect);
            },

            selectElem : function (elemId) {
                this.get$elem(elemId)
                    .removeClass(core.lb.selected )
                    .removeClass(core.lb.preselect)
                    .addClass   (core.lb.selected );
            },

            unselectElem : function (elemId) {
                this.get$elem(elemId)
                    .removeClass(core.lb.selected )
                    .removeClass(core.lb.preselect)
                    .addClass   (core.lb.unSelect );
            },

            selectAllElem : function() {
                this.get$elem("all")
                    .removeClass(core.lb.selected )
                    .removeClass(core.lb.preselect)
                    .addClass   (core.lb.selected );
            },

            unselectAllElem : function() {
                this.get$elem("all")
                    .removeClass(core.lb.selected )
                    .removeClass(core.lb.preselect)
                    .addClass   (core.lb.unSelect );
            },
                
            selectPropery : function (elemId) {
                $("." + core.lb.preselect)
                    .removeClass(core.lb.preselect)
                    .addClass   (core.lb.selected );
            },

            isSelect : function (elemId, includePre) {
                includePre = true;
                return (
                    $("#" + core.pref + this.formId + "_" + core.lb.elem + "_" + elemId)
                        .is("."+core.lb.selected + ((includePre) ? ", ."+core.lb.preselect : ""))
               )
            }
        }
    }());

    return NewWindowForm;
}(exp.core, exp.util));

exp.windowForm = windowForm;    
})(exp);

window.hdemon = window.hdemon || {};
window.hdemon.explorizer = exp.core;
})(window);
﻿
