/** 
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
