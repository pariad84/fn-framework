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
  `'div'` from a `'text'` after the fact.
- `fn.util.js` -- shared CRUD/UI-wiring helpers, diverged from mini-framework:
  - `fn.util.route` gained `opt.style` (styles its own wrapper div), needed so
    a routed screen can flex-fill its container instead of sizing to content.
  - `fn.util.enableDrop({ el, dropOutline })` was added: wires `dragover`/`drop`
    so `el` accepts a dropped component by name. Shared by canvas/div/popup.
    While a drag is over `el`, it's highlighted with `dropOutline` (a CSS
    outline value, e.g. `'3px dashed #2563eb'`) -- the value itself is passed
    in by the caller rather than hardcoded here, the same `opt.style`-is-the
    -caller's-business pattern `fn.util.route`/`fn.util.newButton` already
    use, since this file holds no styling of its own (see its own top
    comment). Only the innermost target under the cursor ever highlights
    (dragover's own `stopPropagation` below already gave it that targeting).
    Whatever outline `el` already had (e.g. layout.js's own selection
    outline on a currently-selected container) is saved and restored rather
    than assumed empty, and cleared unconditionally on `dragend` -- including
    a palette-started drag, which never calls `enableDrag` -- so a drag
    cancelled outside any drop target never leaves a stale highlight.
  - `fn.util.enableDrag({ el })` was added: marks `el` as a drag source for
    repositioning itself. `enableDrop` checks `fn.component._.draggedComponent`
    (set/cleared here) to tell "move this existing element" from "create a new
    one" on drop.
- `layout.js` -- everything else. Single file, ordered: `shell` -> content
  components (`text`/`span`/`div`/`popup`/`button`/`textarea`/`list`/`form`) ->
  `serializeComponent` -> `builder`/`palette`/`canvas`/`attributes-panel` ->
  `stylesheets` tab -> `renderPreviewNode` -> `screens` tab.
- `app.js` -- seeds one sample stylesheet per registered component (see "The app itself" below),
  then mounts `shell` into `document.body`.
- `index.html` -- just the four `<script>` tags in load order (fn.js,
  fn.util.js, layout.js, app.js). No inline markup.

## The app itself

Three tabs, real hash routes via `fn.util.route` (see `shell`): **Builder**
(`#/`), **Stylesheets** (`#/stylesheets`), **Screens** (`#/screens`).

- **Builder**: a palette (draggable component list) on the left, a canvas
  (drop target) in the middle, an attributes panel on the right. A toolbar
  above the canvas has "Save Screen", which serializes the canvas's component
  tree and stores it under `fn.data`'s `'screens'` key. Any component already
  on the canvas is itself draggable, so it can be repositioned -- moved to a
  different container, or back out to the canvas -- the same way a new one
  from the palette is placed. A selected component's label (for `text`/
  `span`/`button`/`popup`) is edited via a text field in the attributes panel,
  not on canvas -- see "Components" below for why.
- **Stylesheets**: exactly one row per registered component (name + a style
  object), seeded once by `app.js` before mounting `shell` (guarded by
  `fn.data.select({ key : ... }).length === 0`, the same way every
  mini-framework example's `app.js` already seeds its own sample data) and
  never added to or deleted from afterward -- only a row's `style` is
  editable here, via a Save button per row; `name` is shown read-only, since
  it has to stay exactly its component type's name for the matching below to
  keep working. Each seed's `style` is read back from `sample._.opt.style`
  on a component actually created for this (detached, no `opt.parent`)
  rather than a second hand-typed copy of that component's style object, so
  it can't drift out of sync with the component's real look -- the same
  field `renderAttributeRows` already reads to show a selected component's
  style rows. Every Builder component automatically applies its own
  type-matching stylesheet by name at creation, and resyncs to whatever that
  stylesheet currently holds on every reselection (see
  `fn.component._.applyTypeStylesheet` and `selectComponent` in
  `layout.js`) -- no per-component picking any more, and nothing to
  remember, since the match is implicit in the component's own type. This
  tab's own row list is rendered through the app's own `list` component with
  `opt.skipStylesheet: true`, so that particular `list` instance doesn't
  apply the 'list' stylesheet to itself (see the `list` layout's own comment
  for why that would otherwise be a real, visible bug).
- **Screens**: lists what Builder's Save Screen wrote, each with a read-only
  preview render and Delete. Hand-rolled rather than `list` -- each row's
  preview is a full nested render (`renderPreviewNode`'s output), not a flat
  set of columns `list`'s table-row model can represent. Loading a saved
  screen back into the Builder for further editing isn't built yet.

## Components (draggable canvas building blocks)

Each is a `fn.component.layout.set({ name, layout })` registration, marked
with class `.__component` so canvas's delegated click/contextmenu handlers
and `enableDrop`'s target-detection can find them regardless of nesting depth.

- `text`, `span`, `button` -- a plain div/span/button; the label is `el.textContent`,
  edited via attributes-panel's text field (see below), not directly on
  canvas (`text` block-level, `span` inline).
- `textarea` -- a real `<textarea>`, edited via its own `.value`.
- `list` -- a `<table>` built from `opt.datas`, a row-per-object array (e.g.
  `[{ column1: 'a', column2: 'b' }, ...]` -- the same shape `fn.util.selectFlat`
  returns elsewhere in this codebase), and optionally `opt.columns`
  (`[{ name, label, list, form, render }, ...]`): `name` indexes into each
  `datas` row, `label` is the header text (`fn.component._.columnLabel` falls
  back to `name` only when `label` is actually missing, not just falsy -- an
  intentionally blank `''` header stays blank), `list` is extra style merged
  onto that column's `th`/`td` (e.g. `{ width: '160px' }`), and `form` rides
  along unused here -- it's `form`'s own field below. `column.render(data)`,
  when given, replaces a cell's default plain-text rendering with whatever
  DOM node it returns (see Stylesheets' own list for a live style-preview
  swatch and an editable Style field); since it's a function, it never
  survives `fn.data`'s JSON storage, so only use it on a list built fresh
  from live app code, never one meant to be dropped onto the canvas and
  saved as a screen. Without `opt.columns`, columns default to the first
  row's own keys. Cell content is otherwise fixed at drop time (no on-canvas
  or attributes-panel editing -- see the `list` layout's own comment for
  why); the resolved `datas`/`columns` are stashed directly on the table
  element (`el.datas`/`el.columns`) rather than reconstructed from the
  rendered header/cell text, since `label` and `name` can now differ.
  `opt.skipStylesheet: true` skips applying the 'list' stylesheet to this
  particular instance -- Stylesheets' own row list passes it, since it
  renders through this same layout and would otherwise pick up whatever the
  'list' stylesheet holds onto its own chrome (see `fn.component._.applyTypeStylesheet`).
- `form` -- `list`'s single-record counterpart: same `opt.columns` shape,
  but `opt.data` is one plain object (not an array) and each field reads
  `column.form` instead of `column.list` (a row-per-object array's per-cell
  style has no meaning laid out top-to-bottom). `column.form.tagName`
  overrides the field's own element (defaults to `<input>`, `attribute.type`
  from `column.form` defaulting to `'text'`; `'textarea'` gets a multi-line
  field instead, its value read/written as text content rather than a
  `value` attribute -- see Stylesheets' own "Style (JSON)" field). Readonly
  and `pointer-events: none` by default -- an `<input>`/`<textarea>` is
  natively focusable/selectable the same way `contenteditable` was (see
  below), so without that it would reopen the exact drag-vs-select conflict
  removing `contenteditable` was fixing. Pass `opt.editable: true` to opt out
  of both and get a real, typable form instead; a canvas-dropped form never
  should, so that stays the default. No current caller in this app uses
  `opt.editable` (Stylesheets' own "add a stylesheet" row, its one past use,
  was removed once every component got a fixed one-per-type stylesheet
  instead -- see "The app itself" above), but it's kept as a real, working
  capability rather than stripped out along with that one caller. An
  editable form's typed values would live only in its own DOM (each field
  carries `attribute.name = column.name`; read them back via
  `formEl.querySelector('[name="..."]').value`) -- `el.data` stays whatever
  `opt.data` was at creation, so `serializeComponent` would save stale data
  for a form saved mid-edit; out of scope since nothing drags an editable
  form onto the canvas. `el.data`/`el.columns` are stashed on the element
  the same way `list` stashes `el.datas`/`el.columns`.
- `div`, `popup` -- containers. Both set `el.content` to wherever their
  children/drops actually go (`div.content = div` itself; `popup.content` is
  an inner div, since popup's header isn't a drop target). **Any new
  container component must do the same** -- `serializeComponent`,
  `enableDrop`, and `renderPreviewNode` all key off `el.content`/
  `node.children` existing, not a hardcoded name list. `popup` also has a
  label of its own (`.__popup-title`, distinct from its children).

None of these are `contenteditable` any more. They used to be (`text`/`span`/
`button` directly, `popup` on its title), but a real user's mousedown on the
visible label was ambiguous between "select this text" (native browser
behavior) and "drag this component" (`fn.util.enableDrag`) -- confirmed with
real mouse-drag Playwright tests (not just synthetic `DragEvent`s) to fail
unpredictably depending on exactly where the drag started and whether the
element had already been focused once. Editing moved to attributes-panel's
own text field instead of adding a separate drag handle, since this app is
for arranging components, not for typing into them on canvas -- see
`renderAttributeRows`'s `textTarget` in `layout.js` for the one place that
decides which element's text a selected component's field edits (`el` itself
for a leaf, `el.querySelector('.__popup-title')` for `popup`, nothing for
`list`/`form`/`textarea`/`div`).

## When adding a new component

1. Register it via `fn.component.layout.set`, mark its root `.__component`,
   and call `fn.util.enableDrag({ el })` on that same root so it can be
   repositioned by drag like every other component.
2. Add it to `builder`'s default palette list (`opt.components || [...]`).
3. If it's a container: set `el.content` (see `div`/`popup`). If it's a leaf
   whose live value lives somewhere other than `.textContent` (like
   `textarea`'s `.value`), add a branch to `serializeComponent` -- skipping
   this silently saves stale/wrong data into a screen. (This already
   happened once: `button`'s label would've been lost before the div/leaf
   check in `serializeComponent`/`renderPreviewNode` was generalized around
   `el.content`/`node.children` instead of hardcoding `'div'`.)
4. If `renderPreviewNode` needs to render it as something other than "plain
   text" or "container with children" (see `list`'s table branch), add a
   branch there too.
   If it's a leaf whose whole content is one editable string in `.textContent`
   (like `text`/`span`/`button`), it's already covered by `renderAttributeRows`'s
   `textTarget` fallback (`!el.content && el._.name !== 'list' && el._.name !==
   'form' && el._.name !== 'textarea'`) -- no extra wiring needed. If it keeps
   that string somewhere else (like `popup`'s title), add a case to
   `textTarget` instead. Do **not** make it `contenteditable` to edit it on
   canvas instead -- see "Components" above for why that conflicts with
   `enableDrag`.
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
implementations (see `serializeComponent`/`renderPreviewNode` deliberately
mirroring each other's branching). `stylesheets` and `screens` both still
have their own `<wrapper>.refresh()` (rebuild children, re-run on CRUD),
but `stylesheets` renders its rows through the app's own `list` component
now while `screens` doesn't -- a deliberate difference, not drift, since a
screens row's content (a full nested preview render) doesn't fit `list`'s
flat-columns model the way a name/swatch/style-editor row does.

No CSS files or classes for styling -- everything inline via
`fn.element.create`'s `style` option. `.__component`/`.__canvas`/
`.__builder`/`.__attributes-panel`/`.__popup-title`/`.__context-menu` exist
only as lookup markers for `closest()`/`querySelector()`, never as styling
hooks.

## Look

Bright/light theme: white panels (`#ffffff`) on a light gray page/canvas
background (`#f4f5f7` page, `#eef0f3` canvas), dark text (`#1f2328`), muted
gray secondary text (`#6b7280`), light gray borders/separators (`#d9dce1` /
`#e8eaed`), blue accent for links, the selected-component outline
(`solid 2px #2563eb`), and the active-drop-target outline while dragging
(`dashed 3px #2563eb`, passed as `fn.util.enableDrop`'s `dropOutline` from
canvas/div/popup in `layout.js` -- dashed specifically so it reads
differently from a solid selection outline when both could apply to the
same element at once, e.g. dragging something over an already-selected
container). Match these rather than introducing new ad hoc colors.
