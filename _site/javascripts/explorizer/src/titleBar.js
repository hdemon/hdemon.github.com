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
