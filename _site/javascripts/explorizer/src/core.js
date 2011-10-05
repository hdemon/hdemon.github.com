(function(exp) {

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
