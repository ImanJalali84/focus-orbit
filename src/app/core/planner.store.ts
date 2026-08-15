import { Injectable, computed, effect, signal } from '@angular/core';
import { Category, PlannerState, PlannerTask, PriorityBand } from '../models/planner.models';

const STORAGE_KEY = 'focus-orbit-workspace';
const LEGACY_STORAGE_KEYS = ['focus-orbit-workspace-v1'] as const;

const DEFAULT_STATE: PlannerState = {
  categories: [
    { id: 'product', name: 'Product', color: '#7c5cff' },
    { id: 'engineering', name: 'Engineering', color: '#20c7b7' },
    { id: 'growth', name: 'Growth', color: '#ff9f43' },
    { id: 'operations', name: 'Operations', color: '#5f8cff' }
  ],
  priorityBands: [
    { id: 'low', name: 'Low', min: 1, max: 10 },
    { id: 'medium', name: 'Medium', min: 11, max: 20 },
    { id: 'high', name: 'High', min: 21, max: 30 }
  ],
  tasks: [
    {
      id: 't1', title: 'Finalize onboarding flow',
      description: 'Review the latest onboarding screens with Product and hand off the approved states to Engineering.',
      categoryId: 'product', priority: 27, done: false, createdAt: new Date().toISOString(), dueDate: ''
    },
    {
      id: 't2', title: 'Resolve checkout retry issue',
      description: 'Reproduce the failed payment retry case, patch the state transition, and add regression coverage.',
      categoryId: 'engineering', priority: 29, done: false, createdAt: new Date().toISOString(), dueDate: ''
    },
    {
      id: 't3', title: 'Prepare weekly metrics review',
      description: 'Pull activation, conversion, and retention numbers and add notes for any material week-over-week changes.',
      categoryId: 'operations', priority: 18, done: false, createdAt: new Date().toISOString(), dueDate: ''
    },
    {
      id: 't4', title: 'Launch lifecycle email experiment',
      description: 'Ship the updated day-three activation email to the test cohort and confirm analytics events are firing.',
      categoryId: 'growth', priority: 23, done: false, createdAt: new Date().toISOString(), dueDate: ''
    },
    {
      id: 't5', title: 'Audit analytics event names',
      description: 'Remove duplicate event names and align the remaining properties with the current tracking plan.',
      categoryId: 'engineering', priority: 14, done: true, createdAt: new Date().toISOString(), dueDate: ''
    },
    {
      id: 't6', title: 'Review pricing page copy',
      description: 'Check plan descriptions, feature labels, and upgrade messaging before the next release.',
      categoryId: 'product', priority: 9, done: false, createdAt: new Date().toISOString(), dueDate: ''
    }
  ]
};

@Injectable({ providedIn: 'root' })
export class PlannerStore {
  private readonly state = signal<PlannerState>(this.load());

  readonly categories = computed(() => this.state().categories);
  readonly priorityBands = computed(() => [...this.state().priorityBands].sort((a, b) => a.min - b.min));
  readonly tasks = computed(() => this.state().tasks);
  readonly openTasks = computed(() => this.tasks().filter((task) => !task.done));
  readonly completedTasks = computed(() => this.tasks().filter((task) => task.done));

  constructor() {
    effect(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
      }
    });
  }

  addTask(input: Omit<PlannerTask, 'id' | 'createdAt' | 'done'>): void {
    const task: PlannerTask = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      done: false
    };
    this.patch({ tasks: [task, ...this.tasks()] });
  }

  updateTask(task: PlannerTask): void {
    this.patch({ tasks: this.tasks().map((item) => item.id === task.id ? task : item) });
  }

  toggleTask(id: string): void {
    this.patch({
      tasks: this.tasks().map((task) => task.id === id ? { ...task, done: !task.done } : task)
    });
  }

  deleteTask(id: string): void {
    this.patch({ tasks: this.tasks().filter((task) => task.id !== id) });
  }

  setCategories(categories: Category[]): void {
    const allowed = new Set(categories.map((category) => category.id));
    const fallback = categories[0]?.id;
    this.patch({
      categories,
      tasks: fallback
        ? this.tasks().map((task) => allowed.has(task.categoryId) ? task : { ...task, categoryId: fallback })
        : []
    });
  }

  setPriorityBands(priorityBands: PriorityBand[]): void {
    this.patch({ priorityBands: [...priorityBands].sort((a, b) => a.min - b.min) });
  }

  resetDemo(): void {
    this.state.set(structuredClone(DEFAULT_STATE));
  }

  private patch(patch: Partial<PlannerState>): void {
    this.state.update((current) => ({ ...current, ...patch }));
  }

  private load(): PlannerState {
    if (typeof localStorage === 'undefined') return structuredClone(DEFAULT_STATE);

    try {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current) return JSON.parse(current) as PlannerState;

      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacy = localStorage.getItem(legacyKey);
        if (!legacy) continue;

        const state = JSON.parse(legacy) as PlannerState;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        localStorage.removeItem(legacyKey);
        return state;
      }

      return structuredClone(DEFAULT_STATE);
    } catch {
      return structuredClone(DEFAULT_STATE);
    }
  }
}
