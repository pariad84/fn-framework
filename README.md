# fn-framework

A drag-and-drop page builder, built on `fn.js` -- the same minimal framework
[mini-framework](https://github.com/pariad84/mini-framework)'s examples use
(see that project's README for the underlying seven essentials `fn.js`
itself provides). No build step, no dependencies: open `index.html` (serve
the directory, e.g. `npx serve .`) to use it.

## Three tabs

- **Builder** -- drag components (`text`, `span`, `div`, `popup`, `button`,
  `textarea`, `list`) from the left palette onto the canvas. Click one to see
  and edit its attributes on the right, including applying a saved
  stylesheet from a dropdown. Right-click one for a Delete option. Nest
  components inside a `div` or a `popup`'s content area freely. "Save
  Screen" stores the current canvas as a named screen.
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
