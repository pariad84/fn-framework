// Shared logic every example needs identically, unlike fn.component.layout.js (which is a
// reference *visual* implementation examples are meant to diverge from). This file holds no
// styling and no layout registrations of its own -- just the pure CRUD/UI-wiring logic that was
// getting copy-pasted verbatim into every example's app.js/layout.js, which is exactly where the
// framework/app split calls for a shared helper (see "Structural consistency" in CLAUDE.md).
(function() {
    var fn = window.fn;
    fn.util = {};

    // Was duplicated as contactDatas()/dealDatas()/folderDatas()/fileDatas()/noteDatas() (etc.)
    // in every example's app.js -- fn.data.select returns {id, data} rows; every list/form
    // needs the flattened {id, ...data} shape instead.
    fn.util.selectFlat = function(opt) {
        return fn.data.select({ key : opt.key }).map(function(row) {
            return Object.assign({ id : row.id }, row.data);
        });
    };

    // Was duplicated as newButton() in every example's app.js -- opens a popup with a blank
    // form + save-btn for the given resource. opt.style is the one thing that's expected to
    // differ per example's visual theme; everything else about "open an add form" is identical.
    fn.util.newButton = function(opt) {
        return fn.element.create({
            tagName : 'button',
            attribute : { type : 'button' },
            text : opt.text,
            style : opt.style,
            parent : opt.parent,
            event : {
                click : function() {
                    fn.component.create({
                        name : 'popup',
                        title : opt.title,
                        caller : opt.caller,
                        render : function(popupEl) {
                            fn.component.create({ name : 'form', resource : opt.resource, data : {}, parent : popupEl.content });
                            fn.component.create({ name : 'save-btn', parent : popupEl.content });
                        },
                    });
                }
            },
        });
    };

    // Was duplicated inside every example's own save-btn layout -- calls the popup's .__form's
    // own .save() (insert-or-update is the form's business, since it's the form that knows its
    // resource/data -- see the `form` layout in any example's layout.js), then refreshes the
    // caller. Only "how the popup/window/screen closes" is expected to differ per example's
    // chrome, so that part stays a callback (opt.onSaved), not something this helper decides.
    fn.util.saveForm = function(opt) {
        var popup = opt.popup;
        var form = popup.querySelector('.__form');
        form.save();
        if (popup._.caller) {
            popup._.caller.refresh();
        }
        if (opt.onSaved) {
            opt.onSaved(popup);
        }
    };

    // Was hand-written as crm/'s own 'router' layout (the first example that cared whether the
    // browser back button worked); now shared once a second app (signal-lost's scene/editor
    // navigation) needed the identical mechanism -- read location.hash, look up or resolve which
    // layout that hash means, refresh it into opt.parent, and do it again on every hashchange (a
    // browser back/forward press fires hashchange like any other navigation, which is the whole
    // point: routes are real history entries, so the back button steps through them instead of
    // leaving the app). opt.routes is a flat {hash: layoutName} map for apps with a fixed small
    // set of screens (crm's two pages, idle-hunter's four tabs); opt.resolve(hash) is a function
    // instead, for apps whose hash carries a variable id/key (signal-lost's '#/scene/<key>',
    // team-chat's '#/channel/<id>') and so can't be a finite lookup table. Only one of the two is
    // expected per call. What to do about hash values that don't matter for navigation at all --
    // a per-item edit popup, a "New X" form -- is answered by never routing them in the first
    // place, the same way none of the examples put a modal's state in the URL: popups stay exactly
    // what they already were, transient DOM the caller.refresh() convention cleans up, not a route.
    // The returned element's own .refresh() re-runs the same resolve-and-render step without
    // requiring a hash change first, for updates that affect what the current route displays but
    // aren't a navigation (signal-lost's language switch, a live simulation tick) -- the same
    // "refresh in place" shape as a `list` element, and reusable directly as a caller. opt.style
    // (optional) styles this wrapper itself, for a caller whose content area needs the routed
    // screen to participate in its own layout (e.g. flex-filling remaining height) rather than
    // just sitting there sized to its content.
    fn.util.route = function(opt) {
        var el = fn.element.create({ tagName : 'div', style : opt.style, parent : opt.parent });
        el.refresh = function() {
            var name = opt.resolve ? opt.resolve(location.hash) : (opt.routes[location.hash] || opt.routes[opt.defaultHash || '#/']);
            fn.component.refresh({ name : name, parent : el });
            if (opt.onRoute) {
                opt.onRoute(location.hash);
            }
        };
        window.addEventListener('hashchange', el.refresh);
        el.refresh();
        return el;
    };

    // Marks el as a drag source for repositioning itself, as opposed to a palette drag (which
    // creates a brand new component, carrying its name in text/plain -- see enableDrop below).
    // fn.component._.draggedComponent is the one piece of state the two share: set here on
    // dragstart, read there on drop, cleared on dragend regardless of whether the drop landed
    // on a valid target (so a cancelled drag -- dropped outside any drop zone, or Esc -- never
    // leaves a stale reference around). Moving an existing element on drop rather than creating
    // a new one has no reason to differ between apps any more than accepting a drop does, so
    // this lives here alongside enableDrop rather than in layout.js.
    fn.util.enableDrag = function(opt) {
        opt.el.setAttribute('draggable', 'true');
        opt.el.addEventListener('dragstart', function(e) {
            e.stopPropagation();
            fn.component._.draggedComponent = opt.el;
        });
        opt.el.addEventListener('dragend', function() {
            fn.component._.draggedComponent = null;
        });
    };

    // Highlights whichever drop target a drag is currently over, opt.dropOutline (the actual
    // outline value, e.g. '3px dashed #2563eb') is the one thing expected to differ per app's
    // visual theme the way opt.style already is elsewhere in this file, so it's passed in by the
    // caller (canvas/div/popup in layout.js) rather than hardcoded here. dragover's own
    // stopPropagation below means only the innermost target under the cursor ever highlights at
    // once -- hovering a div nested in canvas only lights up the div, not canvas underneath it,
    // the same targeting dragover/drop already had. Saves and restores whatever outline the
    // target already had (e.g. layout.js's own selection outline on a currently-selected
    // container) instead of assuming none, and clears unconditionally on dragend regardless of
    // which element started the drag (a palette item never calls enableDrag) so a drag cancelled
    // outside any drop target, or outside the window entirely, never leaves a stale highlight.
    var dropTarget = null;
    var dropTargetOutline = '';
    function clearDropHighlight() {
        if (dropTarget) {
            dropTarget.style.outline = dropTargetOutline;
            dropTarget = null;
        }
    }
    document.addEventListener('dragend', clearDropHighlight);

    // Was written as the page builder's own fn.component._.enableDrop, for both its `canvas`
    // and its `div` (a div needing to accept drops itself, the same way the canvas does, is what
    // makes text/div nestable inside a div at all). Wiring an element to accept a dropped
    // component by name has no reason to differ between apps the way a canvas's/div's own
    // styling does, so it belongs here rather than in layout.js -- opt.el ends up owning
    // whatever's dropped on it, same as opt.parent elsewhere in this file. drop stops
    // propagation so a drop on a nested drop target (a div inside a div) is only ever inserted
    // once, into the innermost one under the cursor, instead of also bubbling up to an ancestor.
    // If fn.component._.draggedComponent is set (see enableDrag above), this is a reposition --
    // move that existing element here instead of creating a new one, unless the drop target is
    // the dragged element itself or one of its own descendants (moving something into its own
    // child isn't meaningful, and .appendChild would throw). opt.onChange, when given, fires
    // right before either mutation actually happens (so a caller can snapshot pre-drop state,
    // e.g. for undo) -- only right before a drop that's actually going to do something, not on
    // every drop event, so a drop that turns out invalid (bad name, dropping onto itself) never
    // fires it for nothing.
    fn.util.enableDrop = function(opt) {
        opt.el.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (dropTarget !== opt.el) {
                clearDropHighlight();
                dropTargetOutline = opt.el.style.outline;
                opt.el.style.outline = opt.dropOutline || '';
                dropTarget = opt.el;
            }
        });
        opt.el.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            clearDropHighlight();
            var dragged = fn.component._.draggedComponent;
            if (dragged) {
                if (dragged !== opt.el && !dragged.contains(opt.el)) {
                    if (opt.onChange) {
                        opt.onChange();
                    }
                    opt.el.appendChild(dragged);
                }
                return;
            }
            var name = e.dataTransfer.getData('text/plain');
            if (fn.component.layout.get({ name : name })) {
                if (opt.onChange) {
                    opt.onChange();
                }
                fn.component.create({ name : name, parent : opt.el });
            }
        });
    };
})();
