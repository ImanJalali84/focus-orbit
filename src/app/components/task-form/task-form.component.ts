import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category, PlannerTask, PriorityBand } from '../../models/planner.models';

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.css'
})
export class TaskFormComponent {
  readonly categories = input.required<Category[]>();
  readonly priorityBands = input.required<PriorityBand[]>();
  readonly taskCreated = output<Omit<PlannerTask, 'id' | 'createdAt' | 'done'>>();

  readonly minPriority = computed(() => this.priorityBands().length ? Math.min(...this.priorityBands().map((b) => b.min)) : 1);
  readonly maxPriority = computed(() => this.priorityBands().length ? Math.max(...this.priorityBands().map((b) => b.max)) : 100);

  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(90)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    categoryId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    priority: new FormControl(1, { nonNullable: true, validators: [Validators.required] }),
    dueDate: new FormControl('', { nonNullable: true })
  });

  priorityLabel(value: number): string {
    return this.priorityBands().find((band) => value >= band.min && value <= band.max)?.name ?? 'Out of range';
  }

  submit(): void {
    const categories = this.categories();
    if (!this.form.controls.categoryId.value && categories[0]) {
      this.form.controls.categoryId.setValue(categories[0].id);
    }
    this.form.controls.priority.setValidators([
      Validators.required,
      Validators.min(this.minPriority()),
      Validators.max(this.maxPriority())
    ]);
    this.form.controls.priority.updateValueAndValidity();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.taskCreated.emit({ ...value, dueDate: value.dueDate || undefined });
    this.form.reset({ title: '', description: '', categoryId: categories[0]?.id ?? '', priority: this.minPriority(), dueDate: '' });
  }
}
