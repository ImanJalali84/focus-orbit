import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PriorityMapComponent, PriorityMapTask } from '@iman_jalali/priority-map';
import { PlannerStore } from './core/planner.store';
import { PlannerTask } from './models/planner.models';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';
import { TaskDetailsComponent } from './components/task-details/task-details.component';

@Component({
  selector: 'app-root',
  imports: [
    PriorityMapComponent,
    TaskFormComponent,
    TaskListComponent,
    SettingsPanelComponent,
    TaskDetailsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly store = inject(PlannerStore);
  readonly selectedTask = signal<PlannerTask | null>(null);
  readonly showCompletedOnChart = signal(false);

  readonly completion = computed(() => {
    const all = this.store.tasks().length;
    return all ? Math.round((this.store.completedTasks().length / all) * 100) : 0;
  });

  readonly highestPriority = computed(() => {
    const open = this.store.openTasks();
    return open.length ? Math.max(...open.map((task) => task.priority)) : 0;
  });

  onChartTaskSelected(task: PriorityMapTask): void {
    this.selectedTask.set(
      this.store.tasks().find((item) => item.id === task.id) ?? null
    );
  }

  onDelete(id: string): void {
    this.store.deleteTask(id);
    if (this.selectedTask()?.id === id) this.selectedTask.set(null);
  }

  onToggle(id: string): void {
    this.store.toggleTask(id);
    const current = this.selectedTask();
    if (current?.id === id) {
      this.selectedTask.set(this.store.tasks().find((task) => task.id === id) ?? null);
    }
  }
}
