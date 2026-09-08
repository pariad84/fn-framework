# fn-framework

A drag-and-drop page builder, built on `fn.js` -- the same minimal framework
[mini-framework](https://github.com/pariad84/mini-framework)'s examples use
(see that project's README for the underlying seven essentials `fn.js`
itself provides). No build step, no dependencies: open `index.html` (serve
the directory, e.g. `npx serve .`) to use it.

## Three tabs

- **Builder** -- drag components (`text`, `span`, `h1`, `h2`, `h3`, `link`,
  `div`, `popup`, `image`, `button`, `input`, `textarea`, `checkbox`,
  `radio`, `list`, `form`) from the left palette onto the canvas. Whatever you're currently dragging over -- the canvas, a
  `div`, or a `popup`'s content area -- highlights with a dashed blue
  outline, so it's always clear where a drop will land. Every component
  automatically looks like its
  own type's stylesheet (edited on the Stylesheets tab) and re-syncs to it
  each time it's reselected, no picking required. Click one to see and edit
  its attributes on the right -- including its text label, for components
  that have one. Right-click one for a Delete option. Nest components inside
  a `div` or a `popup`'s content area freely, and drag any component already
  on the canvas to reposition it. Ctrl/Cmd+click multi-selects components;
  Delete/Backspace, Ctrl/Cmd+C, Ctrl/Cmd+V, and Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z
  work on the current selection. Undo/Redo step back and forward through
  drops, repositions, deletes, and text edits. "Save Screen" stores the
  current canvas as a named screen, asking to confirm before overwriting one
  that already has that name.
- **Stylesheets** -- exactly one row per Builder component (its style, as
  JSON). Edit and Save a row to change how every instance of that component
  looks; rows can't be added or deleted, and a row's name is fixed to its
  component's, since the two have to match.
- **Screens** -- every screen saved from Builder, each with a live preview
  render, Load (rebuilds it as live, editable components back on the Builder
  canvas), and Delete (with a confirmation prompt).

## Design history

- Started from `fn.js`/`fn.util.js` copied out of mini-framework (see that
  repo for how the framework itself works); this app's own needs have since
  diverged both files a little further (see CLAUDE.md).
- `text` and `div` were the first two components. `div` needing to accept
  drops itself -- so a `text`/`div` can nest inside another `div` -- led to
  extracting `fn.util.enableDrop` into the shared util file: wiring an
  element to accept a dropped component by name has no reason to differ
  between apps the way a component's own styling does.
- Saving the canvas as a "screen" needed to know which layout produced each
  live element -- fixed by having `fn.js`'s `fn.component.create` stamp
  `el._.name`, a small, real gap rather than something guessed at up front.
- `popup` needed the same drop-target behavior `div` has, but into an inner
  content div rather than its own header. Generalized `div`/`popup` around
  an `el.content` convention instead of hardcoding `'div'` in the save/
  preview logic, so any future container component gets nesting and
  save/preview support for free just by setting its own `.content`.
- `button`'s label lives in `.textContent` like `text`'s does, but
  `textarea`'s live value lives in `.value` instead -- each needed its own
  branch in the save logic once a real saved-screen-with-one case would
  otherwise have silently lost the typed content.
- Repositioning an existing canvas component reuses the exact same drop
  targets (`enableDrop`) a palette drag already lands on -- adding
  `fn.util.enableDrag` and one shared flag (which element, if any, is
  currently being dragged for a move) let `enableDrop` tell "move this" from
  "create a new one" apart, instead of needing a second, parallel set of
  drop zones just for repositioning.
- `text`/`span`/`button` started out `contenteditable`, edited directly on
  canvas, with `popup`'s title the same way. Once repositioning (above) made
  every component draggable too, a real user's mousedown on the visible
  label became ambiguous between "select this text" and "drag this
  component" -- confirmed with actual mouse-drag Playwright tests (not just
  synthetic `DragEvent`s) to fail unpredictably depending on click position
  and focus history. Removed `contenteditable` entirely and moved editing
  into a text field on the attributes panel instead of adding a separate
  drag handle, since this app is for arranging components on a screen, not
  for typing into them in place.
- `list` originally took `opt.data.rows` (a header row + data rows, all as
  plain arrays). Switched to `opt.datas`, a row-per-object array with column
  names read from the first row's own keys, matching the shape
  `fn.util.selectFlat` already returns everywhere else in this codebase --
  one row-shape convention instead of two.
- Added `opt.columns` to `list`, separating a column's display label and
  per-column style (`{ name, label, list, form }`) from its data key. Once
  label could differ from name, the header text a saved screen's `list` node
  used to be reconstructed from stopped being a reliable stand-in for the
  data key -- fixed by having the `list` layout stash its resolved
  `datas`/`columns` directly on the table element for `serializeComponent`
  to read back, the same way `div`/`popup` already stash `.content`, instead
  of scraping the rendered table.
- Added `form`, `list`'s single-record counterpart: same `opt.columns` shape
  but `opt.data` is one object instead of an array, and each field reads
  `column.form` instead of `column.list`. Rendering each field as a real
  `<input>` for visual fidelity reopened the exact contenteditable-vs-drag
  conflict removing `contenteditable` had just fixed, since a focusable
  input is just as ambiguous a drag-start point as a contenteditable div was
  -- fixed with `readonly` plus `pointer-events: none`, so a drag starting
  inside a field always reaches the form's own `enableDrag` instead of the
  browser's native text-selection handling.
- The Stylesheets tab hand-rolled its own row list (name + a live style swatch
  + Delete) before `list` existed. Once `list` did, that duplicated exactly
  what it already does -- so it was rebuilt on top of `list` itself, adding
  `column.render(data)` (a per-cell override returning a DOM node) as the one
  piece a flat column model couldn't already express: the swatch preview and
  the Delete button. `list`'s own empty-state fallback (a placeholder sample,
  right for a freshly-dropped canvas component) would be wrong for a real
  CRUD list, so Stylesheets still checks for zero rows itself rather than
  handing that case to `list`. Screens' own row list stayed hand-rolled --
  each row's content there is a full nested preview render, not a flat row
  of columns, so `list` genuinely doesn't fit it the way it fits Stylesheets'.
- Fixed `column.label || column.name` (in both `list` and `form`) treating an
  intentionally blank `label: ''` -- exactly what Stylesheets' Delete column
  above needs, having no header text of its own -- as if label had been
  omitted entirely, silently showing the data key instead. Extracted the
  now-shared `fn.component._.columnLabel` to check for `undefined`
  specifically, so both callers (and their `renderPreviewNode` counterparts)
  respect an explicit empty label the same way.
- Stylesheets' own "add a stylesheet" row hand-rolled a name `<input>` and a
  style `<textarea>` before `form` existed. Once `form` did, `readonly` +
  `pointer-events: none` (needed so a canvas-dropped form's fields don't
  reopen the drag-vs-select conflict) made it unusable as a real input --
  added `opt.editable: true` to opt out of both for exactly this case, and
  `column.form.tagName` so a field can be a `<textarea>` instead of the
  default `<input>` (Stylesheets' own JSON field needs the multi-line entry
  a single-line input can't give it). A canvas-dropped form never passes
  `opt.editable`, so it keeps the safe (readonly) default; an editable
  form's typed values are read back from its own DOM by each field's
  `name` attribute, the same way any other real form control would be.
- `builder`'s toolbar ("Save Screen") originally sat above the whole
  palette/canvas/attributes-panel row, spanning the full width. Moved it
  into its own flex column wrapping just the canvas, so palette and
  attributes-panel now run the full height right below the nav bar instead
  of starting below an empty strip of toolbar that was never over them to
  begin with.
- The Stylesheets tab and attributes-panel's style dropdown started out
  empty on a fresh install, with nothing to select until a user manually
  typed one in. `app.js` now seeds one sample stylesheet per registered
  component, the same `fn.data.select(...).length === 0` guard every
  mini-framework example's `app.js` already seeds its own sample data with.
  Rather than hand-copying each component's style object a second time
  (which would drift the moment either copy changed without the other),
  each seed is read back from an actually-created instance of that
  component's own `el._.opt.style` -- the same field the attributes panel
  itself already reads to show a selected component's style rows.
- Dragging a component gave no visual sign of where it would actually land
  -- canvas/div/popup all accepted drops identically, but nothing showed
  which one was about to receive it. `fn.util.enableDrop` now takes an
  optional `dropOutline` and applies it to `opt.el` for as long as a drag is
  over it, the color/style itself passed in by the caller (canvas/div/popup
  in `layout.js`) rather than hardcoded in `fn.util.js`, matching how
  `opt.style` already works on `fn.util.newButton`/`fn.util.route` -- this
  file holds no styling of its own. Dashed rather than the selected-outline's
  solid, since the two can legitimately apply to the same element at once
  (dragging over an already-selected container) and needed to read as
  different states; the previous outline is saved and restored rather than
  assumed blank, so that case doesn't lose the selection outline once the
  drag ends. Highlighting only the innermost target under the cursor (not
  also its ancestor canvas/div) came for free from `dragover`'s own
  `stopPropagation`, already there for the same reason `drop` needed it.
  Cleared unconditionally on `dragend` -- which a palette-started drag fires
  too, even though it never calls `enableDrag` -- so a drag cancelled
  outside any drop target, or outside the window, never leaves a stale
  highlight.
- Applying a stylesheet from attributes-panel's dropdown always merged its
  style onto the selected component correctly, but the dropdown itself had
  no memory -- reselecting that exact same component later always showed
  "Apply a stylesheet..." again, with no way to tell which one (if any) was
  actually applied. The applied stylesheet's id was saved onto
  `el._.opt.styleId` alongside the merged style, and the dropdown was set to
  it when the attributes panel re-rendered, so it reflected what was
  currently linked -- but only as a one-time copy, not a live binding:
  editing a stylesheet afterward didn't retroactively update components
  that had already applied it.
- The dropdown-and-remember fix above was still solving a problem the
  Stylesheets tab's own shape had already made unnecessary: eight component
  types, one Stylesheets row already seeded per type by name. Picking one by
  hand per canvas component had nothing left to actually decide once the
  match was implicit in the type. Replaced the dropdown entirely with
  `fn.component._.applyTypeStylesheet(el, typeName)`, called once at
  creation (so a freshly-dropped component looks right immediately) and
  again on selection (so reselecting after an edit resyncs it -- "always
  latest," without needing to push updates out to every instance on canvas
  the moment a stylesheet is edited). `typeName` is passed explicitly rather
  than read from `el._.name`, since `fn.component.create` (`fn.js`) only
  stamps that *after* a layout function returns; each of the eight layouts
  already knows its own name statically. Stylesheets rows are now fixed at
  exactly one per type -- no Add, no Delete, only an editable style per row
  (a row's name has to keep matching its type's name for the lookup to
  keep working, so it's shown read-only) -- which retired `form`'s
  `opt.editable: true` "add a stylesheet" row from this app entirely
  (`form` keeps the capability itself, just with no current caller). Doing
  this surfaced a real self-reference bug before it shipped: Stylesheets'
  own row list is itself built on the `list` component, which would
  otherwise have applied the 'list' stylesheet to that very table, letting
  an edited 'list' stylesheet visibly distort the Stylesheets tab's own
  chrome -- fixed with `opt.skipStylesheet` on `list`, passed only by that
  one internal usage.
- Added `h1`/`h2`/`h3` as their own components, real heading tags rather
  than reusing `text`'s `<div>` with a bigger font -- they needed to show up
  as their own rows in Stylesheets (one per component type, per the fix
  above), and a real page mockup calling something a "title" should
  actually be a heading, not a div dressed up as one. Otherwise the exact
  same plain text-leaf shape as `text`/`span`: no new branches needed
  anywhere else in `layout.js` (`serializeComponent`'s plain-textContent
  fallback, `renderPreviewNode`'s same fallback, and
  `renderAttributeRows`'s `textTarget` all already generalize over "any
  leaf that isn't list/form/textarea/popup", which a new heading type falls
  into for free) -- confirming that generalization was worth doing the
  first time a genuinely new leaf component showed up. `margin: '0'` on
  each overrides the browser's own default heading margin, so dropping one
  doesn't introduce whitespace none of this app's other components have.
- Added a Load button per Screens row, rebuilding a saved tree as live,
  editable canvas components via `fn.component._.deserializeComponent`, the
  structural inverse of `serializeComponent`.
- Palette-dropped `form` rendered as an empty bordered box (no data/columns
  of its own to show fields for) -- fixed the same way `list` already
  handles the same case, falling back to a two-field sample instead of
  nothing.
- Added `link`, `image`, `input`, `checkbox`, `radio` -- the app had no basic
  web-page building blocks beyond text/containers/`button`. `link` and
  `image` needed their own real tag (`<a>`, `<img>`) the same reason `h1`-`h3`
  needed real heading tags rather than a styled div; `link` fell into the
  same plain-text-leaf shape `text`/`span`/headings already share (just with
  a fixed `href="#"` and a `preventDefault` so selecting one doesn't jump the
  page), while `image` needed its own `serializeComponent`/`renderPreviewNode`/
  `deserializeComponent` branches since its state is `src`/`alt`, not text.
  `input` reopened the exact readonly/`pointer-events: none` need `form`'s
  fields already have, but as a bare field with no form wrapping it -- since
  `pointer-events: none` on an element also stops it receiving the mousedown
  that would start its own drag, `input` wraps the real `<input>` in its own
  div and puts `enableDrag` on that wrapper instead, the same trick `form`
  already uses one level up. `checkbox`/`radio` needed the same
  `pointer-events: none` fix for a different reason -- they ignore `readonly`
  entirely per the HTML spec -- and needed their own `.__option-label` span
  (like `popup`'s `.__popup-title`) since their label text can't just be the
  wrapper's `textContent` without also swallowing the checkbox/radio input
  itself; wrapped in a plain `div` rather than a real `<label>` so selecting
  one doesn't also trigger a browser's own implicit label-click-toggle.
- Added Undo/Redo. Reused `serializeComponent`/`deserializeComponent` as the
  snapshot/restore mechanism instead of cloning raw DOM, since a DOM clone
  would lose every component's own JS-attached listeners (`enableDrag`'s
  drag handlers, `link`'s click) that only `fn.component.create` re-wires.
  `enableDrop` (`fn.util.js`) gained an optional `opt.onChange`, fired right
  before a drop actually mutates anything, so canvas/div/popup's own
  `enableDrop` calls can all snapshot pre-drop state at the one canvas-level
  history this app keeps, even for a drop landing on a nested container --
  passing in a hook the caller decides what to do with is the same pattern
  `dropOutline` already uses on the same function. A text edit only snapshots
  once, on its field's first keystroke (a local closure flag, not a DOM
  attribute), so undo restores to before a whole editing session rather than
  costing one step per character typed, and merely focusing a field without
  typing doesn't cost a step either.
- Added multi-select (Ctrl/Cmd+click), copy/paste, and keyboard shortcuts.
  Multi-select is a separate `canvas._.multiSelected` Set, deliberately
  mutually exclusive with the existing single-select rather than layered on
  top of it -- a plain click or right-click always clears it first -- so
  there's still only one selection model to reason about at a time; the
  attributes panel just shows a count while it's non-empty, since
  `renderAttributeRows` only ever renders one component's own attributes.
  Copy/paste uses a plain in-memory `fn.component._.clipboard` array of
  `serializeComponent` trees rather than the real OS clipboard API, since
  there's no server or other tab this app could share one with -- pasting
  reuses `deserializeComponent` the same way Load/undo already do. The
  keyboard listener is attached once at module scope rather than per canvas
  mount (which would leak a new one on every route navigation), looking up
  the current canvas fresh on every keypress instead, and bails out entirely
  while focus is in a real text input/textarea so it never hijacks normal
  typing or a real copy/paste inside one of those fields.
- Screens' own Delete deleted immediately on click, with no way back --
  added a `confirm()` guard, the same plain-dialog convention Save Screen's
  `prompt()`/`alert()` already use.
- Save Screen took a name via `prompt()` and always `fn.data.insert`ed a new
  row, even when one by that name already existed -- silently building up
  duplicates with no way to update a screen in place. Now checks
  `fn.util.selectFlat({ key: 'screens' })` for an existing row with the same
  name; if found, confirms before `fn.data.update`ing that row instead of
  inserting a second one, the same insert-or-update-by-name shape a real
  save would need.
