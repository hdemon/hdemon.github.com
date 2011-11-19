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
