# fn-framework

A drag-and-drop page builder, built on `fn.js` -- the same minimal framework
[mini-framework](https://github.com/pariad84/mini-framework)'s examples use
(see that project's README for the underlying seven essentials `fn.js`
itself provides). No build step, no dependencies: open `index.html` (serve
the directory, e.g. `npx serve .`) to use it.

## Three tabs

- **Builder** -- drag components (`text`, `span`, `div`, `popup`, `button`,
  `textarea`, `list`, `form`) from the left palette onto the canvas. Click one to see
  and edit its attributes on the right -- including its text label, for
  components that have one -- and to apply a saved stylesheet from a
  dropdown. Right-click one for a Delete option. Nest components inside a
  `div` or a `popup`'s content area freely, and drag any component already
  on the canvas to reposition it. "Save Screen" stores the current canvas as
  a named screen.
- **Stylesheets** -- name a set of style properties (as JSON) and reuse it
  against any Builder component via the attributes panel.
- **Screens** -- every screen saved from Builder, each with a live preview
  render. (Loading one back into the Builder for further editing isn't
  built yet.)

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
