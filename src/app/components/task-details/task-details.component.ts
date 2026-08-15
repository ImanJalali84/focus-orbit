import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Category, PlannerTask, PriorityBand } from '../../models/planner.models';

@Component({
  selector: 'app-task-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-details.component.html',
  styleUrl: './task-details.component.css'
})
export class TaskDetailsComponent {
  readonly task = input<PlannerTask | null>(null);
  readonly categories = input.required<Category[]>();
  readonly priorityBands = input.required<PriorityBand[]>();
  readonly closed = output<void>();
  readonly toggled = output<string>();
  readonly deleted = output<string>();

  category(id: string): Category | undefined { return this.categories().find((item) => item.id === id); }
  band(value: number): PriorityBand | undefined { return this.priorityBands().find((item) => value >= item.min && value <= item.max); }
}
