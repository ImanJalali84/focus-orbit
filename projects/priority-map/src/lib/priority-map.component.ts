import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  input,
  output,
  signal
} from '@angular/core';
import { PriorityMapBand, PriorityMapCategory, PriorityMapTask } from './priority-map.models';

interface Point {
  x: number;
  y: number;
}

interface SectorCell {
  key: string;
  path: string;
  color: string;
  opacity: number;
}

interface TaskPoint extends Point {
  task: PriorityMapTask;
  color: string;
}

interface LabelPoint extends Point {
  text: string;
  color: string;
}

interface TooltipState {
  task: PriorityMapTask;
  categoryName: string;
  priorityName: string;
  color: string;
  x: number;
  y: number;
}

@Component({
  selector: 'fo-priority-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './priority-map.component.html',
  styleUrl: './priority-map.component.css'
})
export class PriorityMapComponent {
  readonly categories = input.required<PriorityMapCategory[]>();
  readonly priorityBands = input.required<PriorityMapBand[]>();
  readonly tasks = input.required<PriorityMapTask[]>();
  readonly showCompleted = input(false);

  readonly title = input('Priority map');
  readonly subtitle = input('Higher priority tasks sit closer to the center.');
  readonly centerLabel = input('FOCUS');
  readonly centerHint = input('HIGH');
  readonly ariaLabel = input('Task priority map');

  readonly taskSelected = output<PriorityMapTask>();
  readonly tooltip = signal<TooltipState | null>(null);

  @ViewChild('priorityMapSvg') private priorityMapSvg?: ElementRef<SVGSVGElement>;

  private readonly cx = 250;
  private readonly cy = 250;
  private readonly innerRadius = 42;
  private readonly outerRadius = 188;

  readonly orderedBands = computed(() =>
    [...this.priorityBands()].sort((a, b) => a.min - b.min)
  );

  readonly cells = computed<SectorCell[]>(() => {
    const categories = this.categories();
    const bands = this.orderedBands();
    if (!categories.length || !bands.length) return [];

    const sectorAngle = 360 / categories.length;
    const bandWidth = (this.outerRadius - this.innerRadius) / bands.length;
    const cells: SectorCell[] = [];

    categories.forEach((category, categoryIndex) => {
      bands.forEach((_, bandIndex) => {
        const startAngle = categoryIndex * sectorAngle - 90;
        const endAngle = startAngle + sectorAngle;
        const radialBandIndex = bands.length - 1 - bandIndex;
        const r0 = this.innerRadius + radialBandIndex * bandWidth;
        const r1 = r0 + bandWidth;

        cells.push({
          key: `${category.id}-${bandIndex}`,
          path: this.annularSectorPath(this.cx, this.cy, r0, r1, startAngle, endAngle),
          color: category.color,
          opacity: 0.30 + (bandIndex / Math.max(1, bands.length - 1)) * 0.44
        });
      });
    });

    return cells;
  });

  readonly labels = computed<LabelPoint[]>(() => {
    const categories = this.categories();
    if (!categories.length) return [];

    const sectorAngle = 360 / categories.length;
    const radius = this.outerRadius + 32;

    return categories.map((category, index) => {
      const angle = index * sectorAngle + sectorAngle / 2 - 90;
      return {
        ...this.polar(this.cx, this.cy, radius, angle),
        text: category.name,
        color: category.color
      };
    });
  });

  readonly points = computed<TaskPoint[]>(() => {
    const categories = this.categories();
    const bands = this.orderedBands();
    if (!categories.length || !bands.length) return [];

    const categoryIndex = new Map(categories.map((category, index) => [category.id, index]));
    const sectorAngle = 360 / categories.length;
    const bandWidth = (this.outerRadius - this.innerRadius) / bands.length;

    return this.tasks()
      .filter((task) => this.showCompleted() || !task.done)
      .flatMap((task) => {
        const cIndex = categoryIndex.get(task.categoryId);
        const bandIndex = bands.findIndex(
          (band) => task.priority >= band.min && task.priority <= band.max
        );

        if (cIndex === undefined || bandIndex < 0) return [];

        const band = bands[bandIndex];
        const ratio = band.max === band.min
          ? 0.5
          : (task.priority - band.min) / (band.max - band.min);
        const hash = this.hash(task.id);
        const angularJitter = ((hash % 1000) / 1000 - 0.5) * sectorAngle * 0.62;
        const angle = cIndex * sectorAngle + sectorAngle / 2 - 90 + angularJitter;

        // Higher numeric priorities always move inward. Jitter is angular only,
        // so radial distance remains a truthful representation of priority.
        const radialBandIndex = bands.length - 1 - bandIndex;
        const bandInnerRadius = this.innerRadius + radialBandIndex * bandWidth;
        const bandOuterRadius = bandInnerRadius + bandWidth;
        const radius = bandOuterRadius - bandWidth * (0.2 + ratio * 0.6);
        const category = categories[cIndex];

        return [{
          ...this.polar(this.cx, this.cy, radius, angle),
          task,
          color: category.color
        }];
      });
  });

  readonly rings = computed(() => {
    const bands = this.orderedBands();
    if (!bands.length) return [];

    const bandWidth = (this.outerRadius - this.innerRadius) / bands.length;
    return bands.map((_, index) => ({
      radius: this.innerRadius + (index + 1) * bandWidth,
      label: bands[bands.length - 1 - index].name
    }));
  });

  select(task: PriorityMapTask): void {
    this.tooltip.set(null);
    this.taskSelected.emit(task);
  }

  showPointerTooltip(event: PointerEvent, point: TaskPoint): void {
    this.setTooltip(point, event.clientX, event.clientY);
  }

  movePointerTooltip(event: PointerEvent): void {
    const current = this.tooltip();
    if (!current) return;

    const position = this.safeTooltipPosition(event.clientX, event.clientY);
    this.tooltip.set({ ...current, ...position });
  }

  showFocusTooltip(point: TaskPoint): void {
    const svg = this.priorityMapSvg?.nativeElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = rect.left + (point.x / 500) * rect.width;
    const y = rect.top + (point.y / 500) * rect.height;
    this.setTooltip(point, x, y);
  }

  hideTooltip(): void {
    this.tooltip.set(null);
  }

  selectWithSpace(event: Event, task: PriorityMapTask): void {
    event.preventDefault();
    this.select(task);
  }

  private setTooltip(point: TaskPoint, x: number, y: number): void {
    const category = this.categories().find((item) => item.id === point.task.categoryId);
    const band = this.orderedBands().find(
      (item) => point.task.priority >= item.min && point.task.priority <= item.max
    );
    const position = this.safeTooltipPosition(x, y);

    this.tooltip.set({
      task: point.task,
      categoryName: category?.name ?? 'Unknown category',
      priorityName: band?.name ?? 'Out of range',
      color: point.color,
      ...position
    });
  }

  private safeTooltipPosition(x: number, y: number): Point {
    if (typeof window === 'undefined') return { x, y };

    const horizontalPadding = 140;
    return {
      x: Math.min(
        Math.max(x, horizontalPadding),
        Math.max(horizontalPadding, window.innerWidth - horizontalPadding)
      ),
      y: Math.max(y, 92)
    };
  }

  private polar(cx: number, cy: number, radius: number, angleDegrees: number): Point {
    const angle = angleDegrees * Math.PI / 180;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  }

  private annularSectorPath(
    cx: number,
    cy: number,
    r0: number,
    r1: number,
    start: number,
    end: number
  ): string {
    const p1 = this.polar(cx, cy, r1, start);
    const p2 = this.polar(cx, cy, r1, end);
    const p3 = this.polar(cx, cy, r0, end);
    const p4 = this.polar(cx, cy, r0, start);
    const largeArc = end - start > 180 ? 1 : 0;

    return [
      `M ${p1.x} ${p1.y}`,
      `A ${r1} ${r1} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${r0} ${r0} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
      'Z'
    ].join(' ');
  }

  private hash(value: string): number {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash >>> 0);
  }
}
