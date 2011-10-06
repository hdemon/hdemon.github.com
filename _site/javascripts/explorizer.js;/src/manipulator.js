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
