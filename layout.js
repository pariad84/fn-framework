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
            var text = fn.element.create({
                tagName : 'div',
                attribute : { class : '__component' },
                text : (opt.data && opt.data.text) || 'Text',
                style : { padding : '4px', minWidth : '20px', outline : 'none' },
                parent : opt.parent,
            });
            fn.util.enableDrag({ el : text });
            return text;
        },
    });

    fn.component.layout.set({
        name : 'span',
        layout : function(opt) {
            var span = fn.element.create({
                tagName : 'span',
                attribute : { class : '__component' },
                text : (opt.data && opt.data.text) || 'Span',
                style : { padding : '4px', minWidth : '20px', display : 'inline-block', outline : 'none' },
                parent : opt.parent,
            });
            fn.util.enableDrag({ el : span });
            return span;
        },
    });

    fn.component.layout.set({
        name : 'div',
        layout : function(opt) {
            var div = fn.element.create({
                tagName : 'div',
                attribute : { class : '__component' },
                style : { minHeight : '60px', minWidth : '60px', padding : '4px', border : '1px dashed #d9dce1' },
                parent : opt.parent,
            });
            // .content marks where a container's own children/drops go -- for div that's just
            // itself; popup (below) sets it to an inner div instead, since its header isn't a
            // drop target. serializeComponent reads any el.content as "this is a container".
            div.content = div;
            fn.util.enableDrop({ el : div.content });
            fn.util.enableDrag({ el : div });
            return div;
        },
    });

    // Chrome around the same drop-target content area div has, styled like a modal card
    // (fn.component.layout.js's popup convention) but rendered inline rather than
    // position:fixed, since this is the design canvas, not a live running page. The close "✕"
    // is purely visual here -- clicking it just selects the popup like clicking anywhere else
    // on it would, the same way none of these components simulate their own runtime behavior.
    fn.component.layout.set({
        name : 'popup',
        layout : function(opt) {
            var popup = fn.element.create({
                tagName : 'div',
                attribute : { class : '__component' },
                style : { background : '#ffffff', border : '1px solid #d9dce1', borderRadius : '8px', boxShadow : '0 4px 12px rgba(0, 0, 0, 0.08)', minWidth : '200px' },
                parent : opt.parent,
            });

            var header = fn.element.create({
                tagName : 'div',
                style : { display : 'flex', justifyContent : 'space-between', alignItems : 'center', gap : '12px', padding : '10px 14px', borderBottom : '1px solid #d9dce1' },
                parent : popup,
            });
            fn.element.create({
                tagName : 'div',
                attribute : { class : '__popup-title' },
                text : (opt.data && opt.data.title) || 'Popup',
                style : { fontWeight : '600' },
                parent : header,
            });
            fn.element.create({ tagName : 'div', text : '✕', style : { color : '#6b7280' }, parent : header });

            popup.content = fn.element.create({
                tagName : 'div',
                style : { minHeight : '60px', margin : '10px', padding : '10px', border : '1px dashed #d9dce1' },
                parent : popup,
            });
            fn.util.enableDrop({ el : popup.content });
            fn.util.enableDrag({ el : popup });

            return popup;
        },
    });

    fn.component.layout.set({
        name : 'button',
        layout : function(opt) {
            var button = fn.element.create({
                tagName : 'button',
                attribute : { type : 'button', class : '__component' },
                text : (opt.data && opt.data.text) || 'Button',
                style : { padding : '8px 16px' },
                parent : opt.parent,
            });
            fn.util.enableDrag({ el : button });
            return button;
        },
    });

    // A native <textarea>, edited through its own .value like any real form control --
    // serializeComponent below reads that instead of .textContent for this one component.
    fn.component.layout.set({
        name : 'textarea',
        layout : function(opt) {
            var textarea = fn.element.create({
                tagName : 'textarea',
                attribute : { class : '__component' },
                text : (opt.data && opt.data.text) || 'Textarea',
                style : { padding : '8px', minHeight : '60px', font : 'inherit' },
                parent : opt.parent,
            });
            fn.util.enableDrag({ el : textarea });
            return textarea;
        },
    });

    // A plain <table>: opt.data.rows defaults to a 2-column sample (header row + two data
    // rows). Cells aren't editable on canvas (see the text/span/button/popup note below for
    // why none of this app's components are anymore) and there's no single string to plug into
    // attributes-panel's text field either, so a list's cell content is fixed at drop time.
    fn.component.layout.set({
        name : 'list',
        layout : function(opt) {
            var rows = (opt.data && opt.data.rows) || [
                [ 'Column 1', 'Column 2' ],
                [ 'Row 1', 'Row 1' ],
                [ 'Row 2', 'Row 2' ],
            ];
            var table = fn.element.create({
                tagName : 'table',
                attribute : { class : '__component' },
                style : { borderCollapse : 'collapse' },
                parent : opt.parent,
            });
            rows.forEach(function(rowValues, rowIndex) {
                var tr = fn.element.create({ tagName : 'tr', parent : table });
                rowValues.forEach(function(value) {
                    fn.element.create({
                        tagName : rowIndex === 0 ? 'th' : 'td',
                        text : value,
                        style : { border : '1px solid #d9dce1', padding : '6px 10px', textAlign : 'left' },
                        parent : tr,
                    });
                });
            });
            fn.util.enableDrag({ el : table });
            return table;
        },
    });

    // Turns a canvas's live component tree into plain data the `screens` tab can store/list --
    // relies on fn.js's fn.component.create stamping el._.name with the layout that produced
    // each element. A container (div, popup -- anything that sets its own el.content, see div's
    // comment above) walks el.content's children; 'list' reads its grid of cell text; 'textarea'
    // reads its own .value (a real form control's live value, unlike a plain div/span/button,
    // never shows up in .textContent); anything else (text/span/button) is read as its own
    // textContent, kept current by attributes-panel's text field (see renderAttributeRows)
    // rather than by editing on canvas -- see that field's comment for why. Reads all of these
    // live rather than the original opt.data, since editing only ever changes the DOM/value,
    // never that original opt.
    fn.component._.serializeComponent = function(el) {
        var node = { type : el._.name, style : (el._.opt && el._.opt.style) || {} };
        if (el.content) {
            node.children = Array.from(el.content.children)
                .filter(function(child) { return child.classList.contains('__component'); })
                .map(fn.component._.serializeComponent);
            if (el._.name === 'popup') {
                node.data = { title : el.querySelector('.__popup-title').textContent };
            }
        } else if (el._.name === 'list') {
            node.data = { rows : Array.from(el.rows).map(function(tr) {
                return Array.from(tr.children).map(function(cell) { return cell.textContent; });
            }) };
        } else if (el._.name === 'textarea') {
            node.data = { text : el.value };
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
            fn.component.create({ name : 'palette', components : opt.components || [ 'text', 'span', 'div', 'button', 'textarea', 'list', 'popup' ], parent : body });
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

    // Shared by canvas's click (select/deselect) and contextmenu (right-click also selects,
    // before the menu opens on it) handlers below, so the outline/attributes-panel bookkeeping
    // lives in exactly one place.
    fn.component._.selectComponent = function(canvasEl, selected) {
        if (canvasEl._.selected) {
            canvasEl._.selected.style.outline = '';
        }
        canvasEl._.selected = selected || null;
        if (selected) {
            selected.style.outline = '2px solid #2563eb';
        }
        canvasEl.closest('.__builder').querySelector('.__attributes-panel').refresh(selected || null);
    };

    // A minimal right-click menu: Delete only, for now. Positioned at the cursor via
    // position:fixed on body (not inside canvas) so it isn't clipped by canvas's own
    // overflow:auto. Closes itself on the next click anywhere, the same "click outside to
    // dismiss" convention as a native context menu.
    fn.component._.showContextMenu = function(opt) {
        var existing = document.querySelector('.__context-menu');
        if (existing) {
            existing.remove();
        }

        var menu = fn.element.create({
            tagName : 'div',
            attribute : { class : '__context-menu' },
            style : {
                position : 'fixed', left : opt.x + 'px', top : opt.y + 'px', minWidth : '120px',
                background : '#ffffff', border : '1px solid #d9dce1', borderRadius : '6px',
                boxShadow : '0 4px 12px rgba(0, 0, 0, 0.12)', padding : '4px', zIndex : '1000',
            },
            parent : document.body,
        });

        fn.element.create({
            tagName : 'div',
            text : 'Delete',
            style : { padding : '6px 14px', borderRadius : '4px', color : '#dc2626', cursor : 'pointer' },
            event : {
                click : function() {
                    if (opt.canvas._.selected === opt.target) {
                        fn.component._.selectComponent(opt.canvas, null);
                    }
                    opt.target.remove();
                    menu.remove();
                },
            },
            parent : menu,
        });

        document.addEventListener('click', function closeOnce() {
            menu.remove();
            document.removeEventListener('click', closeOnce);
        }, { once : true });
    };

    fn.component.layout.set({
        name : 'canvas',
        layout : function(opt = {}) {
            var canvas = fn.element.create({
                tagName : 'div',
                attribute : { class : '__canvas' },
                style : { flex : '1', padding : '16px', overflowY : 'auto', background : '#eef0f3' },
                event : {
                    // Delegated from the canvas root rather than attached per component, so it
                    // keeps working no matter how deeply text/div end up nested inside each
                    // other. .closest('.__component') starting from e.target always resolves to
                    // the innermost component under the click, since e.target is already that
                    // deepest element (or one of its own children, for text's own contents).
                    click : function(e) {
                        fn.component._.selectComponent(e.currentTarget, e.target.closest('.__component'));
                    },
                    contextmenu : function(e) {
                        var target = e.target.closest('.__component');
                        if (!target) {
                            return;
                        }
                        e.preventDefault();
                        fn.component._.selectComponent(e.currentTarget, target);
                        fn.component._.showContextMenu({ x : e.clientX, y : e.clientY, target : target, canvas : e.currentTarget });
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

        // text/span/button/popup used to be edited via contenteditable directly on canvas, but
        // that put draggable and contenteditable on the same element -- a real user's mousedown
        // on the visible label was ambiguous between "select this text" and "drag this
        // component", and native browsers resolved it as text selection often enough to make
        // repositioning unreliable (confirmed with real mouse drag events, not just synthetic
        // DragEvents). Editing here instead sidesteps the conflict entirely rather than adding a
        // separate drag handle, since this app is for arranging components, not for typing into
        // them on canvas. popup's title lives in a child (.__popup-title), not its own
        // textContent, since a popup's textContent would also include its children's text.
        var textTarget = el._.name === 'popup' ? el.querySelector('.__popup-title')
            : (!el.content && el._.name !== 'list' && el._.name !== 'textarea') ? el
            : null;
        if (textTarget) {
            var textInput = fn.element.create({
                tagName : 'input',
                attribute : { type : 'text', value : textTarget.textContent, placeholder : 'Text' },
                style : { width : '100%', marginBottom : '12px', padding : '6px', background : '#ffffff', border : '1px solid #d9dce1', color : '#1f2328' },
                parent : wrap,
            });
            textInput.addEventListener('input', function(e) {
                textTarget.textContent = e.target.value;
            });
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
    // div/popup/canvas's own drop handling or any component's own draggability.
    fn.component._.renderPreviewNode = function(node) {
        if (node.type === 'list') {
            var table = fn.element.create({ tagName : 'table', style : Object.assign({ borderCollapse : 'collapse' }, node.style) });
            node.data.rows.forEach(function(rowValues, rowIndex) {
                var tr = fn.element.create({ tagName : 'tr', parent : table });
                rowValues.forEach(function(value) {
                    fn.element.create({
                        tagName : rowIndex === 0 ? 'th' : 'td',
                        text : value,
                        style : { border : '1px solid #d9dce1', padding : '4px 8px', textAlign : 'left' },
                        parent : tr,
                    });
                });
            });
            return table;
        }

        var el = fn.element.create({ tagName : 'div', style : Object.assign({ padding : '4px' }, node.style) });
        if (node.children) {
            if (node.type === 'popup') {
                fn.element.create({ tagName : 'div', text : node.data.title, style : { fontWeight : '600' }, parent : el });
            }
            node.children.forEach(function(child) {
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
