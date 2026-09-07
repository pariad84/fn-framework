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

    // Keeps every instance of a component in sync with its own type's stylesheet (e.g. every
    // `text` component always looks like the 'text' row under fn.data's 'stylesheets' key,
    // seeded one-per-type by app.js) -- replaces having a user pick a stylesheet by hand per
    // component and remember which one they picked, since there's nothing left to choose: a
    // small, fixed, real set of component types the Stylesheets tab already covers one-to-one.
    // typeName is passed explicitly rather than read from el._.name, since fn.component.create
    // (fn.js) only stamps el._.name *after* a layout function returns -- each layout below
    // already knows its own name statically, being the one place registered under it. Called
    // once at creation (below, in each component's own layout) and again on selection
    // (selectComponent below), so a stylesheet edited after a component was dropped is picked up
    // the next time that component is looked at, not just baked in once and forgotten.
    fn.component._.applyTypeStylesheet = function(el, typeName) {
        var stylesheet = fn.util.selectFlat({ key : 'stylesheets' }).find(function(row) { return row.name === typeName; });
        if (!stylesheet) {
            return;
        }
        el._.opt.style = Object.assign({}, el._.opt.style, stylesheet.style);
        Object.keys(stylesheet.style).forEach(function(key) {
            el.style[key] = stylesheet.style[key];
        });
    };

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
            fn.component._.applyTypeStylesheet(text, 'text');
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
            fn.component._.applyTypeStylesheet(span, 'span');
            fn.util.enableDrag({ el : span });
            return span;
        },
    });

    // Real <h1>/<h2>/<h3> tags -- plain text leaves like text/span above, just headings.
    // margin:'0' overrides the browser's own default heading margin, so dropping one doesn't
    // introduce surprise whitespace the way every other component here doesn't either.
    fn.component.layout.set({
        name : 'h1',
        layout : function(opt) {
            var h1 = fn.element.create({
                tagName : 'h1',
                attribute : { class : '__component' },
                text : (opt.data && opt.data.text) || 'Heading 1',
                style : { margin : '0', padding : '4px', minWidth : '20px', fontSize : '28px', fontWeight : '700', outline : 'none' },
                parent : opt.parent,
            });
            fn.component._.applyTypeStylesheet(h1, 'h1');
            fn.util.enableDrag({ el : h1 });
            return h1;
        },
    });

    fn.component.layout.set({
        name : 'h2',
        layout : function(opt) {
            var h2 = fn.element.create({
                tagName : 'h2',
                attribute : { class : '__component' },
                text : (opt.data && opt.data.text) || 'Heading 2',
                style : { margin : '0', padding : '4px', minWidth : '20px', fontSize : '22px', fontWeight : '700', outline : 'none' },
                parent : opt.parent,
            });
            fn.component._.applyTypeStylesheet(h2, 'h2');
            fn.util.enableDrag({ el : h2 });
            return h2;
        },
    });

    fn.component.layout.set({
        name : 'h3',
        layout : function(opt) {
            var h3 = fn.element.create({
                tagName : 'h3',
                attribute : { class : '__component' },
                text : (opt.data && opt.data.text) || 'Heading 3',
                style : { margin : '0', padding : '4px', minWidth : '20px', fontSize : '18px', fontWeight : '600', outline : 'none' },
                parent : opt.parent,
            });
            fn.component._.applyTypeStylesheet(h3, 'h3');
            fn.util.enableDrag({ el : h3 });
            return h3;
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
            fn.component._.applyTypeStylesheet(div, 'div');
            fn.util.enableDrop({ el : div.content, dropOutline : '3px dashed #2563eb' });
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
            fn.component._.applyTypeStylesheet(popup, 'popup');
            fn.util.enableDrop({ el : popup.content, dropOutline : '3px dashed #2563eb' });
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
            fn.component._.applyTypeStylesheet(button, 'button');
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
            fn.component._.applyTypeStylesheet(textarea, 'textarea');
            fn.util.enableDrag({ el : textarea });
            return textarea;
        },
    });

    // Shared by list/form's own header/label rendering and their renderPreviewNode counterparts
    // below. column.label || column.name would treat an intentionally blank label ('', e.g. a
    // list column whose only content is a Delete button and needs no header text) the same as a
    // missing one, silently falling back to the data key instead -- checking for undefined keeps
    // an explicit '' respected.
    fn.component._.columnLabel = function(column) {
        return column.label !== undefined ? column.label : column.name;
    };

    // A plain <table>: opt.datas is a row-per-object array (e.g. [{ column1: 'a', column2:
    // 'b' }, ...]), the same shape fn.data.select-backed lists elsewhere in this codebase use.
    // opt.columns (optional) is [{ name, label, list, form, render }, ...] -- name indexes into
    // each datas row, label is the header text (falls back to name), list is extra style merged
    // onto that column's th/td (e.g. { width: '160px' }), and form is carried through unused here
    // -- it's `form`'s own field below (opt.columns is the one shape both components share).
    // Without opt.columns, columns default to the first row's own keys (label === name, no extra
    // style). Cells otherwise show data[column.name] as plain text (see the text/span/button/
    // popup note below for why none of this app's components are contenteditable on canvas) and
    // there's no single string to plug into attributes-panel's text field either, so an ordinary
    // list's cell content is fixed at drop time. column.render(data), when given, overrides that
    // default -- it must return a DOM node to place in the cell instead (e.g. Stylesheets' own
    // list below uses it for a live style-preview swatch and a Delete button per row). render is
    // a function, so it never survives fn.data's JSON storage -- fine for a list built fresh from
    // live app code on every render (like Stylesheets'), but never use it on a list meant to be
    // dropped onto the canvas and saved as a screen; that path only ever needs plain data.
    // opt.skipStylesheet skips fn.component._.applyTypeStylesheet below -- the Stylesheets tab
    // itself renders its own row list through this exact layout (see `stylesheets` below), and
    // without the flag that instance would pick up whatever the user sets the 'list' stylesheet
    // to, visibly distorting the Stylesheets tab's own chrome instead of just a canvas mockup.
    fn.component.layout.set({
        name : 'list',
        layout : function(opt) {
            var datas = (opt.datas && opt.datas.length) ? opt.datas : [
                { column1 : 'Row 1', column2 : 'Row 1' },
                { column1 : 'Row 2', column2 : 'Row 2' },
            ];
            var columns = (opt.columns && opt.columns.length) ? opt.columns
                : Object.keys(datas[0]).map(function(name) { return { name : name, label : name }; });
            var table = fn.element.create({
                tagName : 'table',
                attribute : { class : '__component' },
                style : { borderCollapse : 'collapse' },
                parent : opt.parent,
            });
            var headerRow = fn.element.create({ tagName : 'tr', parent : table });
            columns.forEach(function(column) {
                fn.element.create({
                    tagName : 'th',
                    text : fn.component._.columnLabel(column),
                    style : Object.assign({ border : '1px solid #d9dce1', padding : '6px 10px', textAlign : 'left' }, column.list),
                    parent : headerRow,
                });
            });
            datas.forEach(function(data) {
                var tr = fn.element.create({ tagName : 'tr', parent : table });
                columns.forEach(function(column) {
                    var td = fn.element.create({
                        tagName : 'td',
                        style : Object.assign({ border : '1px solid #d9dce1', padding : '6px 10px', textAlign : 'left' }, column.list),
                        parent : tr,
                    });
                    if (column.render) {
                        td.appendChild(column.render(data));
                    } else {
                        td.textContent = data[column.name];
                    }
                });
            });
            // Resolved datas/columns are stashed directly on the element (the same idiom as
            // div/popup's own .content) rather than left for serializeComponent to reconstruct
            // from the rendered th/td text -- label (shown) and name (the actual data key) can
            // now differ, so header text alone is no longer enough to recover the original shape.
            table.datas = datas;
            table.columns = columns;
            if (!opt.skipStylesheet) {
                fn.component._.applyTypeStylesheet(table, 'list');
            }
            fn.util.enableDrag({ el : table });
            return table;
        },
    });

    // A single-record counterpart to `list`, sharing its opt.columns shape ({ name, label, list,
    // form }) but reading column.form instead of column.list (list's per-cell style has no
    // meaning for a field laid out top-to-bottom) and opt.data -- one plain object, since a form
    // shows one record rather than a row-per-object array. Each field defaults to a real <input>
    // (attribute.type from column.form, defaulting to 'text'; column.form.tagName overrides the
    // element itself, e.g. 'textarea' for a multi-line field -- see Stylesheets' own form below)
    // for visual fidelity with an actual form. Readonly and pointer-events:none by default: unlike
    // list's plain-text td/th, an <input>/<textarea> is natively focusable/selectable, which is
    // exactly the contenteditable-vs-draggable conflict documented above for text/span/button --
    // pointer-events:none routes every mousedown past the field straight to the form's own
    // draggable root instead of letting the browser treat it as a text-selection drag. Pass
    // opt.editable: true to opt out of both and get a real, typable form instead; a
    // canvas-dropped form never does, so this default stays the safe one -- no current caller in
    // this app uses opt.editable (Stylesheets' own "add a stylesheet" row, its one past use, was
    // removed once every component got a fixed one-per-type stylesheet instead), but it's kept
    // as a real, tested capability rather than ripped out along with that one caller. An editable
    // form's typed values would live only in its own DOM (read via
    // formEl.querySelector('[name="..."]').value by column.name); el.data stays whatever
    // opt.data was at creation, so serializeComponent below would save stale data for a form
    // saved mid-edit -- out of scope since nothing drags an editable form onto the canvas.
    fn.component.layout.set({
        name : 'form',
        layout : function(opt) {
            var data = opt.data || {};
            var columns = (opt.columns && opt.columns.length) ? opt.columns
                : Object.keys(data).map(function(name) { return { name : name, label : name }; });
            var form = fn.element.create({
                tagName : 'div',
                attribute : { class : '__component' },
                style : { display : 'flex', flexDirection : 'column', gap : '10px', padding : '10px', border : '1px dashed #d9dce1', minWidth : '200px' },
                parent : opt.parent,
            });
            columns.forEach(function(column) {
                var field = fn.element.create({ tagName : 'div', style : { display : 'flex', flexDirection : 'column', gap : '4px' }, parent : form });
                fn.element.create({ tagName : 'label', text : fn.component._.columnLabel(column), style : { color : '#6b7280', fontSize : '13px' }, parent : field });
                var fieldForm = Object.assign({}, column.form);
                var tagName = fieldForm.tagName || 'input';
                delete fieldForm.tagName;
                fn.element.create({
                    tagName : tagName,
                    attribute : Object.assign(
                        tagName === 'input' ? { type : 'text', value : data[column.name] || '' } : {},
                        { name : column.name },
                        opt.editable ? {} : { readonly : 'true' },
                        fieldForm
                    ),
                    text : tagName === 'textarea' ? (data[column.name] || '') : undefined,
                    style : Object.assign({ padding : '6px 8px', background : '#ffffff', border : '1px solid #d9dce1', color : '#1f2328', font : 'inherit' }, opt.editable ? {} : { pointerEvents : 'none' }),
                    parent : field,
                });
            });
            form.data = data;
            form.columns = columns;
            fn.component._.applyTypeStylesheet(form, 'form');
            fn.util.enableDrag({ el : form });
            return form;
        },
    });

    // Turns a canvas's live component tree into plain data the `screens` tab can store/list --
    // relies on fn.js's fn.component.create stamping el._.name with the layout that produced
    // each element. A container (div, popup -- anything that sets its own el.content, see div's
    // comment above) walks el.content's children; 'list'/'form' read back the el.datas/el.columns
    // or el.data/el.columns those layouts already stashed on themselves (see each layout's own
    // comment for why those, and not el._.opt or rendered DOM text, are the source of truth
    // here); 'textarea' reads its own .value (a real form control's live value, unlike a plain
    // div/span/button, never shows up in .textContent); anything else (text/span/button) is read
    // as its own textContent, kept current by attributes-panel's text field (see
    // renderAttributeRows) rather than by editing on canvas -- see that field's comment for why.
    // Reads all of these live rather than the original opt.data, since editing only ever changes
    // the DOM/value, never that original opt.
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
            node.data = { datas : el.datas, columns : el.columns };
        } else if (el._.name === 'form') {
            node.data = { data : el.data, columns : el.columns };
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
                style : { display : 'flex', flex : '1', minHeight : '0' },
            });

            fn.component.create({ name : 'palette', components : opt.components || [ 'text', 'span', 'h1', 'h2', 'h3', 'div', 'button', 'textarea', 'list', 'form', 'popup' ], parent : builder });

            // The toolbar sits only above canvas, not the full builder width -- wrapping canvas
            // in its own flex column (rather than putting the toolbar back at the builder level)
            // keeps palette/attributes-panel exactly as tall as the canvas column, with nothing
            // above them.
            var canvasColumn = fn.element.create({
                tagName : 'div',
                style : { display : 'flex', flexDirection : 'column', flex : '1', minHeight : '0' },
                parent : builder,
            });

            var toolbar = fn.element.create({
                tagName : 'div',
                style : { display : 'flex', justifyContent : 'flex-end', padding : '8px 12px', background : '#ffffff', borderBottom : '1px solid #d9dce1', flexShrink : '0' },
                parent : canvasColumn,
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

            fn.component.create({ name : 'canvas', parent : canvasColumn });
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
    // lives in exactly one place. Also where a selected component picks up its type's latest
    // stylesheet (see applyTypeStylesheet above) -- selecting is the moment a user is actually
    // looking at a specific component, so it's the natural point to resync it, without needing
    // to push updates out to every instance on canvas the moment a stylesheet is edited.
    fn.component._.selectComponent = function(canvasEl, selected) {
        if (canvasEl._.selected) {
            canvasEl._.selected.style.outline = '';
        }
        canvasEl._.selected = selected || null;
        if (selected) {
            fn.component._.applyTypeStylesheet(selected, selected._.name);
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
            fn.util.enableDrop({ el : canvas, dropOutline : '3px dashed #2563eb' });
            return canvas;
        },
    });

    // Same refresh-in-place wrapper shape used throughout this file (e.g. `screens`' own list
    // below): a stable element the canvas's click handler finds via
    // .closest('.__builder').querySelector('.__attributes-panel'), which owns re-rendering its
    // own content in place rather than the canvas reaching into its DOM.
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
            : (!el.content && el._.name !== 'list' && el._.name !== 'form' && el._.name !== 'textarea') ? el
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

        // No style picker here any more -- selectComponent above already resynced el.style to
        // its type's current stylesheet before this ran, so these rows (opt.style, merged with
        // that stylesheet) already show the applied result rather than a choice still to make.
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

    // CRUD for a resource this app owns -- but only the U: exactly one row per registered
    // component, seeded once by app.js and never added to or removed from here. A row's name
    // must stay exactly its component type's name for fn.component._.applyTypeStylesheet above
    // to keep matching it, so name is shown read-only; only style is editable, via a Save button
    // per row. (This replaced an earlier design where a user picked a stylesheet by hand per
    // canvas component from a dropdown, and had to remember which one they'd picked -- see
    // README's design history for why: once every component already has exactly one stylesheet
    // of its own, per-component picking has nothing left to decide.)
    fn.component.layout.set({
        name : 'stylesheets',
        layout : function(opt = {}) {
            var el = fn.element.create({ tagName : 'div', style : { flex : '1', padding : '16px', overflowY : 'auto' } });
            fn.element.create({ tagName : 'h1', text : 'Stylesheets', style : { fontSize : '20px', marginTop : '0' }, parent : el });
            fn.element.create({
                tagName : 'div',
                text : 'One per Builder component. Edit a style below and Save -- every instance of that component picks it up the next time it is dropped or selected.',
                style : { color : '#6b7280', marginBottom : '16px' },
                parent : el,
            });

            var listArea = fn.element.create({ tagName : 'div', parent : el });

            // Renders the current stylesheets through this app's own `list` component --
            // column.render supplies the live style-preview swatch and the editable Style field
            // + Save button, the two bits a flat column model can't already express. skipStylesheet
            // keeps this particular list instance from picking up the 'list' stylesheet itself
            // (see the `list` layout's own comment for why).
            listArea.refresh = function() {
                Array.from(listArea.children).forEach(function(child) { child.remove(); });
                fn.component.create({
                    name : 'list',
                    skipStylesheet : true,
                    datas : fn.util.selectFlat({ key : 'stylesheets' }),
                    columns : [
                        { name : 'name', label : 'Name' },
                        { name : 'preview', label : 'Preview', render : function(data) {
                            return fn.element.create({
                                tagName : 'div',
                                text : 'Aa',
                                style : Object.assign({ padding : '4px 10px', border : '1px solid #d9dce1', borderRadius : '4px' }, data.style),
                            });
                        } },
                        { name : 'styleJson', label : 'Style (JSON)', render : function(data) {
                            var wrap = fn.element.create({ tagName : 'div', style : { display : 'flex', gap : '6px', alignItems : 'flex-start' } });
                            var textarea = fn.element.create({
                                tagName : 'textarea',
                                text : JSON.stringify(data.style),
                                style : { width : '220px', minHeight : '50px', padding : '4px 6px', background : '#ffffff', border : '1px solid #d9dce1', color : '#1f2328', font : 'inherit' },
                                parent : wrap,
                            });
                            fn.element.create({
                                tagName : 'button',
                                attribute : { type : 'button' },
                                text : 'Save',
                                event : { click : function() {
                                    var style;
                                    try {
                                        style = JSON.parse(textarea.value);
                                    } catch (e) {
                                        alert('Style must be valid JSON');
                                        return;
                                    }
                                    fn.data.update({ key : 'stylesheets', id : data.id, data : { name : data.name, style : style } });
                                    listArea.refresh();
                                } },
                                parent : wrap,
                            });
                            return wrap;
                        } },
                    ],
                    parent : listArea,
                });
            };
            listArea.refresh();

            return el;
        },
    });

    // Read-only rendering of one saved node -- deliberately plain elements rather than
    // fn.component.create({name: node.type, ...}), so a preview card doesn't also pick up
    // div/popup/canvas's own drop handling or any component's own draggability.
    fn.component._.renderPreviewNode = function(node) {
        if (node.type === 'list') {
            var table = fn.element.create({ tagName : 'table', style : Object.assign({ borderCollapse : 'collapse' }, node.style) });
            var headerRow = fn.element.create({ tagName : 'tr', parent : table });
            node.data.columns.forEach(function(column) {
                fn.element.create({
                    tagName : 'th',
                    text : fn.component._.columnLabel(column),
                    style : Object.assign({ border : '1px solid #d9dce1', padding : '4px 8px', textAlign : 'left' }, column.list),
                    parent : headerRow,
                });
            });
            node.data.datas.forEach(function(data) {
                var tr = fn.element.create({ tagName : 'tr', parent : table });
                node.data.columns.forEach(function(column) {
                    fn.element.create({
                        tagName : 'td',
                        text : data[column.name],
                        style : Object.assign({ border : '1px solid #d9dce1', padding : '4px 8px', textAlign : 'left' }, column.list),
                        parent : tr,
                    });
                });
            });
            return table;
        }

        if (node.type === 'form') {
            var form = fn.element.create({ tagName : 'div', style : Object.assign({ display : 'flex', flexDirection : 'column', gap : '10px', padding : '10px', border : '1px dashed #d9dce1', minWidth : '200px' }, node.style) });
            node.data.columns.forEach(function(column) {
                var field = fn.element.create({ tagName : 'div', style : { display : 'flex', flexDirection : 'column', gap : '4px' }, parent : form });
                fn.element.create({ tagName : 'label', text : fn.component._.columnLabel(column), style : { color : '#6b7280', fontSize : '13px' }, parent : field });
                var fieldForm = Object.assign({}, column.form);
                var tagName = fieldForm.tagName || 'input';
                delete fieldForm.tagName;
                fn.element.create({
                    tagName : tagName,
                    attribute : Object.assign(
                        tagName === 'input' ? { type : 'text', value : node.data.data[column.name] || '' } : {},
                        { readonly : 'true' },
                        fieldForm
                    ),
                    text : tagName === 'textarea' ? (node.data.data[column.name] || '') : undefined,
                    style : { padding : '6px 8px', background : '#ffffff', border : '1px solid #d9dce1', color : '#1f2328', font : 'inherit', pointerEvents : 'none' },
                    parent : field,
                });
            });
            return form;
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

    // Same "wrapper with its own .refresh()" shape as `stylesheets` above, but hand-rolled
    // rather than built on the `list` component -- each row's preview here is a full nested
    // render (see renderPreviewNode below), not a flat set of columns list's table-row model
    // can represent. What a saved screen actually is (the trees `builder`'s Save Screen button
    // writes via fn.component._.serializeComponent) is this tab's own concern to read back, not
    // fn.data's.
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
