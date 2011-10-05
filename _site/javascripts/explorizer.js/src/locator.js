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
