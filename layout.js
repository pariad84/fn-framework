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
                style : { display : 'flex', gap : '4px', padding : '8px 12px', background : '#ffffff', borderBottom : '1px solid #d9dce1', flexShrink : '0' },
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
                    style : { padding : '8px 12px', color : '#2563eb', textDecoration : 'none', borderRadius : '6px' },
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
                style : { minHeight : '60px', minWidth : '60px', padding : '4px', border : '1px dashed #d9dce1' },
                parent : opt.parent,
            });
            fn.util.enableDrop({ el : box });
            return box;
        },
    });

    fn.component.layout.set({
        name : 'button',
        layout : function(opt) {
            return fn.element.create({
                tagName : 'button',
                attribute : { type : 'button', contenteditable : 'true', class : '__component' },
                text : (opt.data && opt.data.text) || 'Button',
                style : { padding : '8px 16px' },
                parent : opt.parent,
            });
        },
    });

    // Turns a canvas's live component tree into plain data the `screens` tab can store/list --
    // relies on fn.js's fn.component.create stamping el._.name with the layout that produced
    // each element, since a saved node needs to know 'box' (a container) from 'text'/'button'
    // (their own contenteditable text) to be previewed or (later) reloaded. Reads live
    // el.textContent for text/button rather than their original opt.data.text, since
    // contenteditable typing only ever changes the DOM, never that original opt.
    fn.component._.serializeComponent = function(el) {
        var node = { type : el._.name, style : (el._.opt && el._.opt.style) || {} };
        if (el._.name === 'box') {
            node.children = Array.from(el.children)
                .filter(function(child) { return child.classList.contains('__component'); })
                .map(fn.component._.serializeComponent);
        } else {
            node.data = { text : el.textContent };
        }
        return node;
    };

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
                style : { display : 'flex', flexDirection : 'column', flex : '1', minHeight : '0' },
            });

            var toolbar = fn.element.create({
                tagName : 'div',
                style : { display : 'flex', justifyContent : 'flex-end', padding : '8px 12px', background : '#ffffff', borderBottom : '1px solid #d9dce1', flexShrink : '0' },
                parent : builder,
            });
            fn.element.create({
                tagName : 'button',
                attribute : { type : 'button' },
                text : 'Save Screen',
                style : { padding : '6px 14px' },
                event : {
                    click : function(e) {
                        var name = prompt('Screen name?');
                        if (!name) {
                            return;
                        }
                        var canvas = e.target.closest('.__builder').querySelector('.__canvas');
                        var tree = Array.from(canvas.children)
                            .filter(function(child) { return child.classList.contains('__component'); })
                            .map(fn.component._.serializeComponent);
                        fn.data.insert({ key : 'screens', data : { name : name, tree : tree } });
                        alert('Saved.');
                    },
                },
                parent : toolbar,
            });

            var body = fn.element.create({ tagName : 'div', style : { display : 'flex', flex : '1', minHeight : '0' }, parent : builder });
            fn.component.create({ name : 'palette', components : opt.components || [ 'text', 'box', 'button' ], parent : body });
            fn.component.create({ name : 'canvas', parent : body });
            fn.component.create({ name : 'attributes-panel', parent : body });

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
                    gap : '8px', padding : '12px', background : '#ffffff', borderRight : '1px solid #d9dce1', overflowY : 'auto',
                },
            });

            opt.components.forEach(function(name) {
                fn.element.create({
                    tagName : 'div',
                    text : name,
                    attribute : { draggable : 'true' },
                    style : { padding : '8px 12px', background : '#ffffff', border : '1px solid #d9dce1', borderRadius : '6px', cursor : 'grab' },
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
                style : { flex : '1', padding : '16px', overflowY : 'auto', background : '#eef0f3' },
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
                            selected.style.outline = '2px solid #2563eb';
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
            fn.element.create({ tagName : 'div', text : 'No component selected', style : { color : '#6b7280' }, parent : wrap });
            return wrap;
        }

        var styleSelect = fn.element.create({
            tagName : 'select',
            style : { width : '100%', marginBottom : '12px', padding : '6px', background : '#ffffff', border : '1px solid #d9dce1', color : '#1f2328' },
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
                style : { display : 'flex', justifyContent : 'space-between', gap : '8px', padding : '4px 0', borderBottom : '1px solid #e8eaed' },
                parent : wrap,
            });
            fn.element.create({ tagName : 'span', text : key, style : { color : '#6b7280' }, parent : row });
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
                style : { width : '220px', flexShrink : '0', padding : '12px', background : '#ffffff', borderLeft : '1px solid #d9dce1', overflowY : 'auto' },
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
                style : { flex : '0 0 160px', padding : '8px', background : '#ffffff', border : '1px solid #d9dce1', color : '#1f2328' },
                parent : form,
            });

            var styleInput = fn.element.create({
                tagName : 'textarea',
                attribute : { placeholder : '{ "color": "#fff", "padding": "8px" }' },
                style : { flex : '1', minHeight : '60px', padding : '8px', font : '13px/1.4 monospace', background : '#ffffff', border : '1px solid #d9dce1', color : '#1f2328' },
                parent : form,
            });

            var list = fn.element.create({ tagName : 'div', style : { display : 'flex', flexDirection : 'column' }, parent : el });

            list.refresh = function() {
                Array.from(list.children).forEach(function(child) { child.remove(); });
                fn.util.selectFlat({ key : 'stylesheets' }).forEach(function(row) {
                    var item = fn.element.create({
                        tagName : 'div',
                        style : { display : 'flex', alignItems : 'center', gap : '12px', padding : '10px 12px', borderBottom : '1px solid #e8eaed' },
                        parent : list,
                    });
                    fn.element.create({ tagName : 'div', text : row.name, style : { flex : '1' }, parent : item });
                    fn.element.create({
                        tagName : 'div',
                        text : 'Aa',
                        style : Object.assign({ padding : '4px 10px', border : '1px solid #d9dce1', borderRadius : '4px' }, row.style),
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

    // Read-only rendering of one saved node -- deliberately plain elements rather than
    // fn.component.create({name: node.type, ...}), so a preview card doesn't also pick up
    // box/canvas's own drop handling or text/button's contenteditable.
    fn.component._.renderPreviewNode = function(node) {
        var el = fn.element.create({ tagName : 'div', style : Object.assign({ padding : '4px' }, node.style) });
        if (node.type === 'box') {
            (node.children || []).forEach(function(child) {
                el.appendChild(fn.component._.renderPreviewNode(child));
            });
        } else {
            el.textContent = node.data.text;
        }
        return el;
    };

    // Same list.refresh() shape as `stylesheets` above. What a saved screen actually is (the
    // trees `builder`'s Save Screen button writes via fn.component._.serializeComponent) is
    // this tab's own concern to read back, not fn.data's.
    fn.component.layout.set({
        name : 'screens',
        layout : function(opt = {}) {
            var el = fn.element.create({ tagName : 'div', style : { flex : '1', padding : '16px', overflowY : 'auto' } });
            fn.element.create({ tagName : 'h1', text : 'Screens', style : { fontSize : '20px', marginTop : '0' }, parent : el });

            var list = fn.element.create({ tagName : 'div', style : { display : 'flex', flexDirection : 'column', gap : '12px' }, parent : el });

            list.refresh = function() {
                Array.from(list.children).forEach(function(child) { child.remove(); });
                var rows = fn.util.selectFlat({ key : 'screens' });
                if (!rows.length) {
                    fn.element.create({ tagName : 'div', text : 'No screens saved yet.', style : { color : '#6b7280' }, parent : list });
                    return;
                }
                rows.forEach(function(row) {
                    var item = fn.element.create({
                        tagName : 'div',
                        style : { background : '#ffffff', border : '1px solid #d9dce1', borderRadius : '6px', padding : '12px' },
                        parent : list,
                    });
                    var header = fn.element.create({
                        tagName : 'div',
                        style : { display : 'flex', justifyContent : 'space-between', alignItems : 'center', marginBottom : '8px' },
                        parent : item,
                    });
                    fn.element.create({ tagName : 'div', text : row.name, style : { fontWeight : '600' }, parent : header });
                    fn.element.create({
                        tagName : 'button',
                        attribute : { type : 'button' },
                        text : 'Delete',
                        event : { click : function() {
                            fn.data.delete({ key : 'screens', id : row.id });
                            list.refresh();
                        } },
                        parent : header,
                    });

                    var preview = fn.element.create({
                        tagName : 'div',
                        style : { display : 'flex', flexDirection : 'column', gap : '4px', border : '1px dashed #d9dce1', padding : '8px', pointerEvents : 'none' },
                        parent : item,
                    });
                    row.tree.forEach(function(node) {
                        preview.appendChild(fn.component._.renderPreviewNode(node));
                    });
                });
            };
            list.refresh();

            return el;
        },
    });
})();
