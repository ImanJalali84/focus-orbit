import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Category, PlannerTask, PriorityBand } from '../../models/planner.models';

@Component({
  selector: 'app-task-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent {
  readonly tasks = input.required<PlannerTask[]>();
  readonly categories = input.required<Category[]>();
  readonly priorityBands = input.required<PriorityBand[]>();
  readonly toggled = output<string>();
  readonly selected = output<PlannerTask>();
  readonly deleted = output<string>();
  readonly query = signal('');
  readonly mode = signal<'open' | 'done' | 'all'>('open');

  readonly visibleTasks = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.tasks().filter((task) => {
      const statusMatches = this.mode() === 'all' || (this.mode() === 'done' ? task.done : !task.done);
      const queryMatches = !q || `${task.title} ${task.description}`.toLowerCase().includes(q);
      return statusMatches && queryMatches;
    });
  });

  category(id: string): Category | undefined { return this.categories().find((item) => item.id === id); }
  band(value: number): PriorityBand | undefined { return this.priorityBands().find((item) => value >= item.min && value <= item.max); }
}
