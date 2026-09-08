(function() {
    var fn = window.fn;

    // Same fn.data.select(...).length === 0 seeding guard every mini-framework example's app.js
    // already uses for its own sample data (crm's stages/contacts, idle-hunter's grounds, etc.)
    // -- one sample stylesheet per registered component, so the Stylesheets tab and
    // attributes-panel's style dropdown both already have something to show on a fresh install
    // instead of starting empty. Sourced by actually creating each component (detached, no
    // opt.parent) and reading back its own el._.opt.style -- the same field layout.js's
    // renderAttributeRows already reads to show a selected component's style rows -- rather than
    // hand-copying each style object a second time here, which would drift out of sync with the
    // component's real look the moment either copy changed without the other.
    if (fn.data.select({ key : 'stylesheets' }).length === 0) {
        [ 'text', 'span', 'h1', 'h2', 'h3', 'link', 'div', 'popup', 'image', 'button', 'input', 'textarea', 'checkbox', 'radio', 'list', 'form' ].forEach(function(name) {
            var sample = fn.component.create({ name : name });
            fn.data.insert({ key : 'stylesheets', data : { name : name, style : sample._.opt.style || {} } });
        });
    }

    fn.component.create({ name : 'shell', parent : document.body });
})();
