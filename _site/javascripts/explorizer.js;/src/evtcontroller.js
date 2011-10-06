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
