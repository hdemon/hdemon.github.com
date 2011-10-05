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
            titleSpace  = "titleSpc";

        function adjustLocation ($bar, tBarHeight) {
            $bar
                .css({
                    "position"    : "absolute",
                    "width"        : "100%",
                    "height"    : tBarHeight });
        }

        return {
            add : function () {                
                this.$bar = util.createDiv(
                    this.form.get$ow(),
                    titleBar,
                    this.formId
                );
                
                this.$removeBtn = util.createDiv(
                    this.$bar,
                    removeBtn,
                    this.formId
                );
                
                adjustLocation(this.$bar, core.tBarHeight);

                return this.$bar;
            },
            
            get$titleBar : function ( formId ) {
                if ( arguments[0] === "all" || arguments.length === 0 ) {
                    return $( "." + core.pref + titleBar );
                } else {
                    return $( "#" + core.pref + formId + "_" + titleBar );
                }
            }
        }
    }());

    return    NewTitleBar;
}(exp.core, exp.util));

exp.titleBar = titleBar;
})(exp);
