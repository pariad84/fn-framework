(function() {
    var fn = window.fn;

    // The page's own top-level layout: a menu bar over whichever of the three real routes
    // (builder/stylesheets/screens) fn.util.route currently has resolved into content, the
    // same real-navigation shape crm/'s tab bar and route setup already use in mini-framework.
    fn.component.layout.set({
        name : 'shell',
        layout : function(opt = {}) {
            var shell = fn.element.create({
                tagName : 'div',
                style : { display : 'flex', flexDirection : 'column', height : '100vh' },
            });

            var nav = fn.element.create({
                tagName : 'div',
                style : { display : 'flex', gap : '4px', padding : '8px 12px', borderBottom : '1px solid #3a3f4b', flexShrink : '0' },
                parent : shell,
            });

            [
                { hash : '#/', label : 'Builder' },
                { hash : '#/stylesheets', label : 'Stylesheets' },
                { hash : '#/screens', label : 'Screens' },
            ].forEach(function(tab) {
                fn.element.create({
                    tagName : 'a',
                    attribute : { href : tab.hash },
                    text : tab.label,
                    style : { padding : '8px 12px', color : '#8ab4f8', textDecoration : 'none', borderRadius : '6px' },
                    parent : nav,
                });
            });

            var content = fn.element.create({
                tagName : 'div',
                style : { flex : '1', minHeight : '0', display : 'flex', flexDirection : 'column' },
                parent : shell,
            });

            fn.util.route({
                routes : { '#/' : 'builder', '#/stylesheets' : 'stylesheets', '#/screens' : 'screens' },
                defaultHash : '#/',
                style : { flex : '1', minHeight : '0', display : 'flex', flexDirection : 'column' },
                parent : content,
            });

            return shell;
        },
    });

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

    fn.component.layout.set({
        name : 'box',
        layout : function(opt) {
            var box = fn.element.create({
                tagName : 'div',
                attribute : { class : '__component' },
                style : { minHeight : '60px', minWidth : '60px', padding : '4px', border : '1px dashed #3a3f4b' },
                parent : opt.parent,
            });
            fn.util.enableDrop({ el : box });
            return box;
        },
    });

    // Referenced by canvas/attributes-panel below via .closest('.__builder'), the same
    // self-contained convention popup/close-btn/save-btn already use. Routed into shell's
    // content area rather than assuming the whole viewport, so it takes opt.components only as
    // an override -- the shell's route entry doesn't pass one, so the default below is what
    // actually renders the palette day to day.
    fn.component.layout.set({
        name : 'builder',
        layout : function(opt = {}) {
            var builder = fn.element.create({
                tagName : 'div',
                attribute : { class : '__builder' },
                style : { display : 'flex', flex : '1', minHeight : '0' },
            });

            fn.component.create({ name : 'palette', components : opt.components || [ 'text', 'box' ], parent : builder });
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
            fn.util.enableDrop({ el : canvas });
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

        var styleSelect = fn.element.create({
            tagName : 'select',
            style : { width : '100%', marginBottom : '12px', padding : '6px', background : '#1e2128', border : '1px solid #3a3f4b', color : '#e8eaed' },
            parent : wrap,
        });
        fn.element.create({ tagName : 'option', attribute : { value : '' }, text : 'Apply a stylesheet...', parent : styleSelect });
        fn.util.selectFlat({ key : 'stylesheets' }).forEach(function(row) {
            fn.element.create({ tagName : 'option', attribute : { value : row.id }, text : row.name, parent : styleSelect });
        });
        styleSelect.addEventListener('change', function(e) {
            if (!e.target.value) {
                return;
            }
            var stylesheet = fn.data.select({ key : 'stylesheets', id : Number(e.target.value) });
            if (!stylesheet) {
                return;
            }
            el._.opt.style = Object.assign({}, el._.opt.style, stylesheet.data.style);
            for (const [key, value] of Object.entries(stylesheet.data.style)) {
                el.style[key] = value;
            }
            e.target.closest('.__attributes-panel').refresh(el);
        });

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

    // CRUD for a resource this app owns (name + a style object), same fn.data.select/insert/
    // delete verbs every mini-framework example uses. `attributes-panel`'s own style-select
    // reads this same 'stylesheets' key to apply one onto a selected builder component.
    fn.component.layout.set({
        name : 'stylesheets',
        layout : function(opt = {}) {
            var el = fn.element.create({ tagName : 'div', style : { flex : '1', padding : '16px', overflowY : 'auto' } });
            fn.element.create({ tagName : 'h1', text : 'Stylesheets', style : { fontSize : '20px', marginTop : '0' }, parent : el });

            var form = fn.element.create({ tagName : 'div', style : { display : 'flex', gap : '8px', alignItems : 'flex-start', marginBottom : '16px' }, parent : el });

            var nameInput = fn.element.create({
                tagName : 'input',
                attribute : { type : 'text', placeholder : 'Name' },
                style : { flex : '0 0 160px', padding : '8px', background : '#1e2128', border : '1px solid #3a3f4b', color : '#e8eaed' },
                parent : form,
            });

            var styleInput = fn.element.create({
                tagName : 'textarea',
                attribute : { placeholder : '{ "color": "#fff", "padding": "8px" }' },
                style : { flex : '1', minHeight : '60px', padding : '8px', font : '13px/1.4 monospace', background : '#1e2128', border : '1px solid #3a3f4b', color : '#e8eaed' },
                parent : form,
            });

            var list = fn.element.create({ tagName : 'div', style : { display : 'flex', flexDirection : 'column' }, parent : el });

            list.refresh = function() {
                Array.from(list.children).forEach(function(child) { child.remove(); });
                fn.util.selectFlat({ key : 'stylesheets' }).forEach(function(row) {
                    var item = fn.element.create({
                        tagName : 'div',
                        style : { display : 'flex', alignItems : 'center', gap : '12px', padding : '10px 12px', borderBottom : '1px solid #262a33' },
                        parent : list,
                    });
                    fn.element.create({ tagName : 'div', text : row.name, style : { flex : '1' }, parent : item });
                    fn.element.create({
                        tagName : 'div',
                        text : 'Aa',
                        style : Object.assign({ padding : '4px 10px', border : '1px solid #3a3f4b', borderRadius : '4px' }, row.style),
                        parent : item,
                    });
                    fn.element.create({
                        tagName : 'button',
                        attribute : { type : 'button' },
                        text : 'Delete',
                        event : { click : function() {
                            fn.data.delete({ key : 'stylesheets', id : row.id });
                            list.refresh();
                        } },
                        parent : item,
                    });
                });
            };
            list.refresh();

            fn.element.create({
                tagName : 'button',
                attribute : { type : 'button' },
                text : 'Add',
                style : { padding : '8px 16px' },
                event : {
                    click : function() {
                        if (!nameInput.value) {
                            return;
                        }
                        var style;
                        try {
                            style = styleInput.value ? JSON.parse(styleInput.value) : {};
                        } catch (e) {
                            alert('Style must be valid JSON');
                            return;
                        }
                        fn.data.insert({ key : 'stylesheets', data : { name : nameInput.value, style : style } });
                        nameInput.value = '';
                        styleInput.value = '';
                        list.refresh();
                    },
                },
                parent : form,
            });

            return el;
        },
    });

    // Placeholder for now -- will list the screens saved from the builder tab, once saving a
    // screen is built.
    fn.component.layout.set({
        name : 'screens',
        layout : function(opt = {}) {
            var el = fn.element.create({ tagName : 'div', style : { flex : '1', padding : '16px' } });
            fn.element.create({ tagName : 'h1', text : 'Screens', style : { fontSize : '20px' }, parent : el });
            return el;
        },
    });
})();
