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

    fn.component.layout.set({
        name : 'box',
        layout : function(opt) {
            return fn.element.create({
                tagName : 'div',
                style : { minHeight : '60px', minWidth : '60px', padding : '4px', border : '1px dashed #3a3f4b' },
                parent : opt.parent,
            });
        },
    });
})();
