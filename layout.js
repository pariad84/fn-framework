(function() {
    var fn = window.fn;

    fn.component.layout.set({
        name : 'text',
        layout : function(opt) {
            return fn.element.create({
                tagName : 'div',
                attribute : { contenteditable : 'true' },
                text : (opt.data && opt.data.text) || 'Text',
                style : { padding : '4px', minWidth : '20px', outline : 'none' },
                parent : opt.parent,
            });
        },
    });
})();
