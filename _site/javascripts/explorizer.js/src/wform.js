(function(exp) {
    
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
