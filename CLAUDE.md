# fn-framework

A drag-and-drop page builder built directly on `fn.js`'s seven essentials (see
mini-framework's README/CLAUDE.md for what `fn.js` itself is). `fn.js` and
`fn.util.js` here started as copies of mini-framework's files but have since
diverged for this app's own needs -- treat this repo's copies as the source of
truth for this app, not kept in sync with mini-framework's.

## Structure

- `fn.js` -- core primitives, unchanged from mini-framework except one addition:
  `fn.component.create` stamps `el._.name` with the layout name that created
  each element. `layout.js`'s `serializeComponent` depends on this to tell a
  `'box'` from a `'text'` after the fact.
- `fn.util.js` -- shared CRUD/UI-wiring helpers, diverged from mini-framework:
  - `fn.util.route` gained `opt.style` (styles its own wrapper div), needed so
    a routed screen can flex-fill its container instead of sizing to content.
  - `fn.util.enableDrop({ el })` was added: wires `dragover`/`drop` so `el`
    accepts a dropped component by name. Shared by canvas/box/popup.
- `layout.js` -- everything else. Single file, ordered: `shell` -> content
  components (`text`/`box`/`popup`/`button`/`textarea`/`list`) ->
  `serializeComponent` -> `builder`/`palette`/`canvas`/`attributes-panel` ->
  `stylesheets` tab -> `renderPreviewNode` -> `screens` tab.
- `app.js` -- mounts `shell` into `document.body`. Nothing else.
- `index.html` -- just the four `<script>` tags in load order (fn.js,
  fn.util.js, layout.js, app.js). No inline markup.

## The app itself

Three tabs, real hash routes via `fn.util.route` (see `shell`): **Builder**
(`#/`), **Stylesheets** (`#/stylesheets`), **Screens** (`#/screens`).

- **Builder**: a palette (draggable component list) on the left, a canvas
  (drop target) in the middle, an attributes panel on the right. A toolbar
  above the canvas has "Save Screen", which serializes the canvas's component
  tree and stores it under `fn.data`'s `'screens'` key.
- **Stylesheets**: CRUD (name + a style object) stored under `fn.data`'s
  `'stylesheets'` key. Each row shows a live preview swatch with the style
  actually applied. `attributes-panel`'s own style-select reads this same key
  to apply one onto a selected Builder component.
- **Screens**: lists what Builder's Save Screen wrote, each with a read-only
  preview render and Delete. Loading a saved screen back into the Builder for
  further editing isn't built yet.

## Components (draggable canvas building blocks)

Each is a `fn.component.layout.set({ name, layout })` registration, marked
with class `.__component` so canvas's delegated click/contextmenu handlers
and `enableDrop`'s target-detection can find them regardless of nesting depth.

- `text`, `button` -- contenteditable div/button, edited directly on canvas.
- `textarea` -- a real `<textarea>`, edited via its own `.value` (not
  contenteditable -- a form control already has its own editing).
- `list` -- a `<table>`; every cell is its own contenteditable `td`/`th`.
- `box`, `popup` -- containers. Both set `el.content` to wherever their
  children/drops actually go (`box.content = box` itself; `popup.content` is
  an inner div, since popup's header isn't a drop target). **Any new
  container component must do the same** -- `serializeComponent`,
  `enableDrop`, and `renderPreviewNode` all key off `el.content`/
  `node.children` existing, not a hardcoded name list.

## When adding a new component

1. Register it via `fn.component.layout.set`, mark its root `.__component`.
2. Add it to `builder`'s default palette list (`opt.components || [...]`).
3. If it's a container: set `el.content` (see `box`/`popup`). If it's a leaf
   whose live value lives somewhere other than `.textContent` (like
   `textarea`'s `.value`), add a branch to `serializeComponent` -- skipping
   this silently saves stale/wrong data into a screen. (This already
   happened once: `button`'s label would've been lost before the box/leaf
   check in `serializeComponent`/`renderPreviewNode` was generalized around
   `el.content`/`node.children` instead of hardcoding `'box'`.)
4. If `renderPreviewNode` needs to render it as something other than "plain
   text" or "container with children" (see `list`'s table branch), add a
   branch there too.
5. `node --check layout.js`, then verify in a real browser via Playwright --
   drop it (and nest it, if it's a container), select it and check the
   attributes panel, save a screen containing it and check the Screens tab
   preview round-trips it correctly. This repo has no test suite; that's the
   only real verification available before pushing.

## Conventions carried over from mini-framework

Same `opt` single-parameter convention (`function(opt = {})`, read as
`opt.thing`). Same self-contained-component pattern: a button/handler finds
its own context via `.closest()`/`.querySelector()` (e.g. `canvas`'s
`click`/`contextmenu` handlers resolving `.closest('.__component')`,
`save-btn`-style buttons resolving `.closest('.__builder')`) rather than a
caller-injected callback. Same bar before adding something new: look at how
the existing, similar piece does it and match that shape -- don't let two
things that do conceptually the same job drift into different
implementations (see `stylesheets`/`screens`'s identical `list.refresh()`
shape, or `serializeComponent`/`renderPreviewNode` deliberately mirroring
each other's branching).

No CSS files or classes for styling -- everything inline via
`fn.element.create`'s `style` option. `.__component`/`.__canvas`/
`.__builder`/`.__attributes-panel`/`.__popup-title`/`.__context-menu` exist
only as lookup markers for `closest()`/`querySelector()`, never as styling
hooks.

## Look

Bright/light theme: white panels (`#ffffff`) on a light gray page/canvas
background (`#f4f5f7` page, `#eef0f3` canvas), dark text (`#1f2328`), muted
gray secondary text (`#6b7280`), light gray borders/separators (`#d9dce1` /
`#e8eaed`), blue accent for links and the selected-component outline
(`#2563eb`). Match these rather than introducing new ad hoc colors.
