# Focus Orbit

Focus Orbit is a visual priority planner built with Angular 22. It turns a normal task list into a spatial priority map: tasks are grouped by category, placed inside configurable priority ranges, and drawn closer to the center as their numeric priority increases.

The repository is an Angular workspace with two projects:

- **`focus-orbit`** — the end-user task planning application.
- **`@iman_jalali/priority-map`** — a reusable Angular library that renders the radial priority visualization used by the app.

## What Focus Orbit is for

A long task list is easy to scan but often poor at showing what deserves attention first. Focus Orbit keeps the familiar task workflow while adding a visual model:

- **Angle / sector** represents the task category.
- **Distance from the center** represents priority.
- **Color** represents the category.
- **A point** represents a task.
- **Closer to the center means higher priority.**

The result is a lightweight planning view that helps you see urgent work without replacing the normal task list.

## Features

### Task planning

- Create tasks with a title, optional notes, category, priority score, and due date.
- Mark tasks as complete or reopen them.
- Delete tasks.
- Search tasks by title or notes.
- Filter the list by **Open**, **Done**, or **All**.
- Open task details in a centered modal dialog.
- Optionally show completed tasks on the priority map.

### Workspace configuration

- Create and remove categories.
- Assign a custom color to each category.
- Define any number of numeric priority levels.
- Use built-in two-level and three-level presets.
- Prevent overlapping priority ranges.
- Reassign tasks to the first available category if a category is removed.

### Priority visualization

- Tasks are displayed as interactive points on a radial map.
- Higher numeric priority values are placed closer to the center.
- Hovering a task point shows a floating tooltip with its title, category, level, and score.
- Clicking or pressing Enter/Space on a point emits the selected task and opens its details in the host app.
- Category sectors use the configured category colors.
- Priority levels are shown as concentric radial bands.
- The map is responsive and keyboard accessible.

### Persistence

Workspace state is stored locally in the browser under:

```text
focus-orbit-workspace
```

The app automatically migrates data from the previous key:

```text
focus-orbit-workspace-v1
```

After a successful migration, the legacy key is removed.

## Technology

- Angular 22
- Standalone components
- Angular Signals
- Reactive Forms and FormsModule
- TypeScript 6
- SVG for the priority map
- `ng-packagr` for the reusable Angular library
- Browser LocalStorage for persistence
- No third-party charting library


## npm package

The reusable chart library is published under the npm user scope:

```text
@iman_jalali/priority-map
```

Build it from the workspace root:

```bash
npm run build:priority-map
```

Then publish from the generated package directory:

```bash
cd dist/priority-map
npm pack --dry-run
npm publish --access public
```

Install it in another Angular project with:

```bash
npm install @iman_jalali/priority-map
```

See `projects/priority-map/README.md` for the complete library API and publishing guide.

## Repository structure

```text
focus-orbit/
├── public/
│   ├── favicon.svg
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── settings-panel/
│   │   │   ├── task-details/
│   │   │   ├── task-form/
│   │   │   └── task-list/
│   │   ├── core/
│   │   │   └── planner.store.ts
│   │   ├── models/
│   │   │   └── planner.models.ts
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   └── app.component.css
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── projects/
│   └── priority-map/
│       ├── src/
│       │   ├── lib/
│       │   │   ├── priority-map.component.ts
│       │   │   ├── priority-map.component.html
│       │   │   ├── priority-map.component.css
│       │   │   └── priority-map.models.ts
│       │   └── public-api.ts
│       ├── README.md
│       ├── ng-package.json
│       ├── package.json
│       └── tsconfig.lib.json
├── angular.json
├── package.json
├── tsconfig.app.json
└── tsconfig.json
```

## Getting started

### Requirements

Use a Node.js version supported by your installed Angular 22 toolchain, then install dependencies from the workspace root.

### Install

```bash
npm install
```

### Start the application

```bash
npm start
```

The script runs the `focus-orbit` Angular application through the Angular development server.

### Production build

```bash
npm run build
```

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Run the Focus Orbit development server. |
| `npm run build` | Build the application. |
| `npm run watch` | Build the application in development watch mode. |
| `npm run build:priority-map` | Build only the reusable priority map library. |
| `npm run build:all` | Build the library first, then build the app. |
| `npm run pack:priority-map` | Build the library and create an installable npm archive from `dist/priority-map`. |

## How the priority model works

Priority ranges are numeric and configurable. A default workspace uses:

```text
Low      1–10
Medium  11–20
High    21–30
```

The map first finds the priority band that contains a task score. The band determines the task's radial region. Inside that band, the exact score determines the task's distance from the center.

For example, with the default ranges:

- Priority `29` appears very close to the center.
- Priority `22` is still in the High band, but farther out than `29`.
- Priority `15` appears in the Medium band.
- Priority `4` appears in the outer Low band.

Task IDs are hashed only to add deterministic **angular** variation inside a category sector. Radial jitter is intentionally not used, so distance from the center remains a truthful representation of priority.

## Application data model

The app works with three main concepts.

### Category

```ts
interface Category {
  id: string;
  name: string;
  color: string;
}
```

### Priority band

```ts
interface PriorityBand {
  id: string;
  name: string;
  min: number;
  max: number;
}
```

### Task

```ts
interface PlannerTask {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  priority: number;
  done: boolean;
  createdAt: string;
  dueDate?: string;
}
```

## Using the priority map package inside the app

The application consumes the chart through the library's public package API instead of importing a component by a relative path.

```ts
import {
  PriorityMapComponent,
  PriorityMapTask
} from '@iman_jalali/priority-map';
```

The workspace path alias is configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@iman_jalali/priority-map": [
        "./projects/priority-map/src/public-api.ts"
      ]
    }
  }
}
```

Example template usage:

```html
<fo-priority-map
  [categories]="store.categories()"
  [priorityBands]="store.priorityBands()"
  [tasks]="store.tasks()"
  [showCompleted]="showCompletedOnChart()"
  title="Priority orbit"
  subtitle="The closer a task is to the center, the more attention it needs."
  centerLabel="NOW"
  centerHint="HIGH"
  ariaLabel="Focus Orbit task priority map"
  (taskSelected)="onChartTaskSelected($event)" />
```

For the full library API, styling variables, data contracts, and packaging instructions, see [`projects/priority-map/README.md`](projects/priority-map/README.md).

## Building the priority map library

```bash
npm run build:priority-map
```

The generated Angular package is written to:

```text
dist/priority-map
```

To build both projects:

```bash
npm run build:all
```

To create an installable package archive:

```bash
npm run pack:priority-map
```

## LocalStorage behavior

`PlannerStore` owns persistence. Every state change is written to `focus-orbit-workspace` as JSON.

If the current key is missing, the store checks known legacy keys and migrates the first valid value it finds. If stored data cannot be parsed, the application falls back to the default sample workspace.

To completely reset local data manually, remove the `focus-orbit-workspace` key from the browser's Local Storage, then reload the page. You can also use **Settings → Reset sample data** inside the application.

## Favicon

The project includes a custom Focus Orbit favicon in `public/favicon.svg` with an `.ico` fallback. The icon uses an orbit-and-core motif that matches the application's radial priority model.

Both files are referenced from `src/index.html` and are copied as static assets through the Angular `public` asset configuration.

## UI and accessibility notes

- The application uses a responsive dark interface.
- Task points on the SVG map are keyboard focusable.
- Enter and Space select a focused task point.
- The map exposes an ARIA label and task point labels.
- Hover/focus tooltips remain outside the SVG so they are not clipped by the chart viewport.
- Task details are displayed in a modal-style dialog with a backdrop.
- Category colors are used as supporting signals; task titles and numeric priority values remain available as text.

## Customizing the product

Common places to start:

- **Default categories, priority bands, and sample tasks:** `src/app/core/planner.store.ts`
- **Global colors and layout tokens:** `src/styles.css`
- **Main dashboard composition:** `src/app/app.component.html`
- **Priority map rendering behavior:** `projects/priority-map/src/lib/priority-map.component.ts`
- **Priority map visual tokens:** `projects/priority-map/src/lib/priority-map.component.css`
- **Browser title, metadata, and favicon links:** `src/index.html`

## Notes for production use

This version intentionally uses browser LocalStorage and has no authentication or backend. For multi-device sync, collaboration, permissions, or server-side persistence, replace or wrap `PlannerStore` with an API-backed data layer while keeping the UI and priority map package independent.
