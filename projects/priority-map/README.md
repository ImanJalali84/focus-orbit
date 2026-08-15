# @iman_jalali/priority-map

`@iman_jalali/priority-map` is a reusable Angular 22 standalone component for visualizing tasks by **category** and **numeric priority** on a radial map.

Each category owns a sector of the circle. Priority levels create concentric radial bands. Tasks are rendered as interactive points, with higher numeric priorities positioned closer to the center.

The package is used by the Focus Orbit application, but it has no dependency on the app's store, task dialog, forms, or application models.

## Highlights

- Standalone Angular component.
- Strongly typed public models.
- SVG-based rendering with no charting dependency.
- Configurable category colors.
- Configurable numeric priority bands.
- Exact priority score controls radial distance.
- Deterministic angular distribution reduces point overlap without changing radial meaning.
- Pointer tooltip with task metadata.
- Click and keyboard task selection.
- Optional completed-task rendering.
- Responsive layout.
- CSS custom properties for visual customization.
- Packaged with `ng-packagr`.

## Package name

```text
@iman_jalali/priority-map
```

Current source package version:

```text
0.1.0
```

## Workspace usage

Inside the Focus Orbit workspace, `tsconfig.json` maps the package name directly to the library public API:

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

Import it like a normal package:

```ts
import {
  PriorityMapComponent,
  PriorityMapBand,
  PriorityMapCategory,
  PriorityMapTask
} from '@iman_jalali/priority-map';
```

Because the component is standalone, add it directly to the host component's `imports` array:

```ts
import { Component } from '@angular/core';
import { PriorityMapComponent } from '@iman_jalali/priority-map';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [PriorityMapComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {}
```

## Basic example

```ts
import {
  PriorityMapBand,
  PriorityMapCategory,
  PriorityMapTask
} from '@iman_jalali/priority-map';

export class DashboardComponent {
  categories: PriorityMapCategory[] = [
    { id: 'product', name: 'Product', color: '#7c5cff' },
    { id: 'engineering', name: 'Engineering', color: '#20c7b7' },
    { id: 'growth', name: 'Growth', color: '#ff9f43' }
  ];

  priorityBands: PriorityMapBand[] = [
    { id: 'low', name: 'Low', min: 1, max: 10 },
    { id: 'medium', name: 'Medium', min: 11, max: 20 },
    { id: 'high', name: 'High', min: 21, max: 30 }
  ];

  tasks: PriorityMapTask[] = [
    {
      id: 'task-1',
      title: 'Fix payment retry issue',
      categoryId: 'engineering',
      priority: 29
    },
    {
      id: 'task-2',
      title: 'Review onboarding copy',
      categoryId: 'product',
      priority: 16
    }
  ];

  openTask(task: PriorityMapTask): void {
    console.log(task);
  }
}
```

```html
<fo-priority-map
  [categories]="categories"
  [priorityBands]="priorityBands"
  [tasks]="tasks"
  [showCompleted]="false"
  title="Priority map"
  subtitle="Higher priority tasks sit closer to the center."
  centerLabel="FOCUS"
  centerHint="HIGH"
  ariaLabel="Team task priority map"
  (taskSelected)="openTask($event)" />
```

## Public models

The library exports its own minimal data contracts from `priority-map.models.ts`.

### `PriorityMapCategory`

```ts
export interface PriorityMapCategory {
  id: string;
  name: string;
  color: string;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Stable category identifier used by tasks. |
| `name` | `string` | Human-readable category label shown around the map. |
| `color` | `string` | Any CSS-compatible color used for the sector and task points. |

### `PriorityMapBand`

```ts
export interface PriorityMapBand {
  id: string;
  name: string;
  min: number;
  max: number;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Stable identifier for the priority level. |
| `name` | `string` | Label shown in the level chips and tooltip. |
| `min` | `number` | Inclusive minimum score. |
| `max` | `number` | Inclusive maximum score. |

Priority bands should be non-overlapping. The component sorts them by `min` before rendering.

### `PriorityMapTask`

```ts
export interface PriorityMapTask {
  id: string;
  title: string;
  categoryId: string;
  priority: number;
  done?: boolean;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Stable task identifier. It also seeds deterministic angular placement. |
| `title` | `string` | Task title shown in the tooltip and accessibility label. |
| `categoryId` | `string` | Must match a category `id` to be rendered. |
| `priority` | `number` | Numeric priority score used for radial placement. |
| `done` | `boolean \| undefined` | Optional completion state. Completed tasks can be hidden or rendered with reduced opacity. |

## Component API

Selector:

```text
fo-priority-map
```

### Inputs

| Input | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `categories` | `PriorityMapCategory[]` | Yes | — | Categories and their display colors. |
| `priorityBands` | `PriorityMapBand[]` | Yes | — | Inclusive numeric ranges that define radial levels. |
| `tasks` | `PriorityMapTask[]` | Yes | — | Tasks to render. |
| `showCompleted` | `boolean` | No | `false` | Include tasks whose `done` value is truthy. |
| `title` | `string` | No | `Priority map` | Heading above the visualization. |
| `subtitle` | `string` | No | `Higher priority tasks sit closer to the center.` | Supporting copy below the heading. |
| `centerLabel` | `string` | No | `FOCUS` | Primary label in the center core. |
| `centerHint` | `string` | No | `HIGH` | Secondary center label. |
| `ariaLabel` | `string` | No | `Task priority map` | Accessible label applied to the SVG map. |

### Output

| Output | Payload | Description |
| --- | --- | --- |
| `taskSelected` | `PriorityMapTask` | Emitted when a task point is clicked or activated with Enter/Space. |

## Placement behavior

The component uses a fixed internal `500 × 500` SVG coordinate system and scales responsively in CSS.

### Category placement

Categories are assigned equal angular sectors around the circle based on their array order.

For `N` categories, every category receives:

```text
360° / N
```

Task IDs are hashed to produce a stable angular offset inside the category sector. This means a task stays in roughly the same angular position between renders as long as its ID and category remain unchanged.

### Priority placement

Priority bands are sorted from the lowest `min` value to the highest. The visual radial order is reversed so the highest priority band sits closest to the center.

Within the matched band, the exact numeric score is normalized between `min` and `max`. A higher score moves further inward.

This preserves the central rule:

> Higher numeric priority = smaller radial distance = closer to the center.

There is no random radial jitter. Radial position remains meaningful.

### Tasks that are not rendered

A task is skipped when:

- its `categoryId` does not match any provided category;
- its `priority` does not fall inside any provided priority band; or
- it is completed and `showCompleted` is `false`.

## Tooltip behavior

Pointer tooltips are rendered as fixed-position HTML outside the SVG instead of inside the chart. This prevents clipping by SVG bounds and makes viewport-safe positioning easier.

The tooltip shows:

- task title;
- category name;
- priority band name;
- exact priority score.

Keyboard focus also displays the tooltip near the focused SVG task point.

## Accessibility

Each task point is rendered as a focusable SVG group with:

- `role="button"`;
- `tabindex="0"`;
- an ARIA label containing the task title and priority;
- Enter activation;
- Space activation;
- focus tooltip support.

The root SVG uses `role="img"` and the configurable `ariaLabel` input.

## Styling

The component ships with its own CSS and can be themed from the host by overriding CSS custom properties on `fo-priority-map`.

Available variables:

```css
fo-priority-map {
  --fo-map-text: #f5f7fb;
  --fo-map-muted: #8c93a3;
  --fo-map-muted-2: #656c7b;
  --fo-map-line: #242730;
  --fo-map-core: #151822;
  --fo-map-accent: #7c6cf2;
}
```

Example:

```css
fo-priority-map {
  --fo-map-text: #111827;
  --fo-map-muted: #6b7280;
  --fo-map-muted-2: #9ca3af;
  --fo-map-line: #e5e7eb;
  --fo-map-core: #ffffff;
  --fo-map-accent: #4f46e5;
}
```

Category sector and task-point colors still come from each category's `color` value.

## Sizing

The host element uses `height: 100%`. The chart itself is square and responsive:

```css
.chart-wrap {
  width: min(100%, 600px);
  aspect-ratio: 1;
}
```

For predictable layout, give the host or its parent enough vertical space when embedding it in dashboards.

## Empty state

If `categories` or `priorityBands` is empty, the component does not attempt to draw the map. It displays:

```text
Add a category and a priority level to start mapping tasks.
```

## Building the library

From the Focus Orbit workspace root:

```bash
npm install
npm run build:priority-map
```

The built Angular package is written to:

```text
dist/priority-map
```

The library build uses `ng-packagr` through the Angular workspace configuration.

## Creating an installable package archive

From the workspace root:

```bash
npm run pack:priority-map
```

That script runs the library build and then executes:

```bash
npm pack ./dist/priority-map
```

The resulting `.tgz` can be installed into another local Angular project with npm.

## Package metadata

The library declares Angular as peer dependencies and `tslib` as a runtime dependency:

```json
{
  "peerDependencies": {
    "@angular/common": "^22.0.0",
    "@angular/core": "^22.0.0"
  },
  "dependencies": {
    "tslib": "^2.8.0"
  },
  "sideEffects": false
}
```

## Public entry point

`src/public-api.ts` exports:

```ts
export * from './lib/priority-map.component';
export * from './lib/priority-map.models';
```

Consumers should import only from:

```ts
@iman_jalali/priority-map
```

rather than reaching into internal source paths.

## Design constraints

The package intentionally focuses on one job: mapping categorized tasks by numeric priority. It does not manage:

- task persistence;
- task creation or editing;
- category editing;
- priority-band validation;
- dialogs;
- routing;
- backend communication.

Those concerns belong to the host application. Keeping the package narrow makes it easier to reuse in other Angular dashboards.

## Publishing to npm

The package is configured for the npm user scope `@iman_jalali`. Before publishing, sign in and verify the active npm account:

```bash
npm login
npm whoami
```

`npm whoami` should print:

```text
iman_jalali
```

From the Focus Orbit workspace root, build the library:

```bash
npm run build:priority-map
```

Review the exact package contents before publishing:

```bash
cd dist/priority-map
npm pack --dry-run
```

For the first public release of this scoped package:

```bash
npm publish --access public
```

After publishing, consumers can install it with:

```bash
npm install @iman_jalali/priority-map
```

For later releases, increment the package version in `projects/priority-map/package.json` before rebuilding and publishing. npm will not allow the same package name and version to be published twice.

