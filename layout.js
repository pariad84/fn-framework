(function() {
    var fn = window.fn;

    fn.component.layout.set({
        name : 'text',
        layout : function(opt) {
            return fn.element.create({
                tagName : 'div',
                attribute : { contenteditable : 'true', class : '__component' },
                text : (opt.data && opt.data.text) || 'Text',
                style : { padding : '4px', minWidth : '20px', outline : 'none' },
                parent : opt.parent,
            });
        },
    });

    // Shared by canvas and box below, so any container a component can be dropped into (the
    // canvas itself, or a box nested any number of levels deep) accepts drops the same way.
    // drop stops propagation so a drop on a nested box is only ever inserted once, into the
    // innermost box under the cursor, instead of also bubbling up to an ancestor box/canvas.
    fn.component._.enableDrop = function(el) {
        el.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
        el.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var name = e.dataTransfer.getData('text/plain');
            if (fn.component.layout.get({ name : name })) {
                fn.component.create({ name : name, parent : el });
            }
        });
    };

    fn.component.layout.set({
        name : 'box',
        layout : function(opt) {
            var box = fn.element.create({
                tagName : 'div',
                attribute : { class : '__component' },
                style : { minHeight : '60px', minWidth : '60px', padding : '4px', border : '1px dashed #3a3f4b' },
                parent : opt.parent,
            });
            fn.component._.enableDrop(box);
            return box;
        },
    });

    // Referenced by canvas/attributes-panel below via .closest('.__builder'), the same
    // self-contained convention popup/close-btn/save-btn already use.
    fn.component.layout.set({
        name : 'builder',
        layout : function(opt = {components : []}) {
            var builder = fn.element.create({
                tagName : 'div',
                attribute : { class : '__builder' },
                style : { display : 'flex', height : '100vh' },
            });

            fn.component.create({ name : 'palette', components : opt.components, parent : builder });
            fn.component.create({ name : 'canvas', parent : builder });
            fn.component.create({ name : 'attributes-panel', parent : builder });

            return builder;
        },
    });

    fn.component.layout.set({
        name : 'palette',
        layout : function(opt = {components : []}) {
            var palette = fn.element.create({
                tagName : 'div',
                attribute : { class : '__palette' },
                style : {
                    width : '160px', flexShrink : '0', display : 'flex', flexDirection : 'column',
                    gap : '8px', padding : '12px', borderRight : '1px solid #3a3f4b', overflowY : 'auto',
                },
            });

            opt.components.forEach(function(name) {
                fn.element.create({
                    tagName : 'div',
                    text : name,
                    attribute : { draggable : 'true' },
                    style : { padding : '8px 12px', background : '#1e2128', border : '1px solid #3a3f4b', borderRadius : '6px', cursor : 'grab' },
                    event : { dragstart : function(e) { e.dataTransfer.setData('text/plain', name); } },
                    parent : palette,
                });
            });

            return palette;
        },
    });

    fn.component.layout.set({
        name : 'canvas',
        layout : function(opt = {}) {
            var canvas = fn.element.create({
                tagName : 'div',
                attribute : { class : '__canvas' },
                style : { flex : '1', padding : '16px', overflowY : 'auto', background : '#0f1115' },
                event : {
                    // Delegated from the canvas root rather than attached per component, so it
                    // keeps working no matter how deeply text/box end up nested inside each
                    // other. .closest('.__component') starting from e.target always resolves to
                    // the innermost component under the click, since e.target is already that
                    // deepest element (or one of its own children, for text's own contents).
                    click : function(e) {
                        var canvasEl = e.currentTarget;
                        var selected = e.target.closest('.__component');
                        if (canvasEl._.selected) {
                            canvasEl._.selected.style.outline = '';
                        }
                        canvasEl._.selected = selected || null;
                        if (selected) {
                            selected.style.outline = '2px solid #8ab4f8';
                        }
                        canvasEl.closest('.__builder').querySelector('.__attributes-panel').refresh(selected || null);
                    },
                },
            });
            fn.component._.enableDrop(canvas);
            return canvas;
        },
    });

    // Same shape as `list`'s own tableArea/.refresh(): a stable wrapper the canvas's click
    // handler finds via .closest('.__builder').querySelector('.__attributes-panel'), which owns
    // re-rendering its own content in place rather than the canvas reaching into its DOM.
    fn.component._.renderAttributeRows = function(el) {
        var wrap = fn.element.create({ tagName : 'div' });

        if (!el) {
            fn.element.create({ tagName : 'div', text : 'No component selected', style : { color : '#9aa0a6' }, parent : wrap });
            return wrap;
        }

        var opt = el._.opt || {};
        var attribute = Object.assign({}, opt.attribute);
        delete attribute.class;
        var rows = Object.assign({ tag : el.tagName.toLowerCase() }, attribute, opt.style || {});
        Object.keys(rows).forEach(function(key) {
            var row = fn.element.create({
                tagName : 'div',
                style : { display : 'flex', justifyContent : 'space-between', gap : '8px', padding : '4px 0', borderBottom : '1px solid #262a33' },
                parent : wrap,
            });
            fn.element.create({ tagName : 'span', text : key, style : { color : '#9aa0a6' }, parent : row });
            fn.element.create({ tagName : 'span', text : String(rows[key]), parent : row });
        });
        return wrap;
    };

    fn.component.layout.set({
        name : 'attributes-panel',
        layout : function(opt = {}) {
            var panel = fn.element.create({
                tagName : 'div',
                attribute : { class : '__attributes-panel' },
                style : { width : '220px', flexShrink : '0', padding : '12px', borderLeft : '1px solid #3a3f4b', overflowY : 'auto' },
            });

            panel.content = fn.element.create({ tagName : 'div', parent : panel });
            panel.content.appendChild(fn.component._.renderAttributeRows(null));

            panel.refresh = function(el) {
                Array.from(panel.content.children).forEach(function(child) { child.remove(); });
                panel.content.appendChild(fn.component._.renderAttributeRows(el));
            };

            return panel;
        },
    });
})();
