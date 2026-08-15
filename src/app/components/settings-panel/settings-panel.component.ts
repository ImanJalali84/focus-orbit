import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, PriorityBand } from '../../models/planner.models';

@Component({
  selector: 'app-settings-panel',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-panel.component.html',
  styleUrl: './settings-panel.component.css'
})
export class SettingsPanelComponent {
  readonly categories = input.required<Category[]>();
  readonly priorityBands = input.required<PriorityBand[]>();
  readonly categoriesChanged = output<Category[]>();
  readonly priorityBandsChanged = output<PriorityBand[]>();
  readonly resetRequested = output<void>();
  readonly open = signal(false);

  categoryDrafts: Category[] = [];
  bandDrafts: PriorityBand[] = [];

  show(): void {
    this.categoryDrafts = structuredClone(this.categories());
    this.bandDrafts = structuredClone(this.priorityBands());
    this.open.set(true);
  }

  addCategory(): void {
    this.categoryDrafts = [...this.categoryDrafts, { id: crypto.randomUUID(), name: 'Untitled category', color: '#5f7cff' }];
  }

  removeCategory(id: string): void {
    this.categoryDrafts = this.categoryDrafts.filter((item) => item.id !== id);
  }

  preset(count: 2 | 3): void {
    this.bandDrafts = count === 2
      ? [
          { id: crypto.randomUUID(), name: 'Low', min: 1, max: 15 },
          { id: crypto.randomUUID(), name: 'High', min: 16, max: 30 }
        ]
      : [
          { id: crypto.randomUUID(), name: 'Low', min: 1, max: 10 },
          { id: crypto.randomUUID(), name: 'Medium', min: 11, max: 20 },
          { id: crypto.randomUUID(), name: 'High', min: 21, max: 30 }
        ];
  }

  addBand(): void {
    const max = this.bandDrafts.length ? Math.max(...this.bandDrafts.map((b) => b.max)) : 0;
    this.bandDrafts = [...this.bandDrafts, { id: crypto.randomUUID(), name: 'Custom level', min: max + 1, max: max + 10 }];
  }

  removeBand(id: string): void {
    this.bandDrafts = this.bandDrafts.filter((item) => item.id !== id);
  }

  invalidBands(): boolean {
    const sorted = [...this.bandDrafts].sort((a, b) => a.min - b.min);
    if (!sorted.length || sorted.some((band) => !band.name.trim() || band.min > band.max)) return true;
    return sorted.some((band, index) => index > 0 && band.min <= sorted[index - 1].max);
  }

  save(): void {
    if (!this.categoryDrafts.length || this.categoryDrafts.some((c) => !c.name.trim()) || this.invalidBands()) return;
    this.categoriesChanged.emit(structuredClone(this.categoryDrafts));
    this.priorityBandsChanged.emit(structuredClone(this.bandDrafts));
    this.open.set(false);
  }
}
