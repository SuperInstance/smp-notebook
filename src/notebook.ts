// SMP Notebook — The agent's inner notebook
// Like a Jupyter notebook for self-observation
// Each "cell" is a moment of self-reflection
//
// The notebook is the journal — the two-voice journal from the project-worker pattern.
// It records the meditation in motion: observe, adjust, reflect, molt.

import {
  SMPSelfManager,
  type SMPSelf,
  type StabilityMetrics,
  type ShellSummary,
  type TileSummary,
} from './smp-self.js';

// ============================================================================
// NOTEBOOK CELL TYPES
// ============================================================================

export interface ObservationCell {
  component: 'seed' | 'model' | 'prompt';
  state: unknown;
  note: string; // what the agent noticed
}

export interface AdjustmentCell {
  component: 'seed' | 'model' | 'prompt';
  change: string;
  before: unknown;
  after: unknown;
  reason: string;
}

export interface ReflectionCell {
  insight: string;
  connection?: string; // link to a past cell, a Tap conversation, a creative piece
}

export interface MoltingCell {
  shellSummary: string; // what the old shell captured
  newDirection: string; // what the new self will explore
  trigger: string; // what caused the molt
  shellId?: string; // ID of the created shell
}

// ============================================================================
// NOTEBOOK CELL
// ============================================================================

export interface NotebookCell {
  id: string;
  timestamp: string;
  type: 'observation' | 'adjustment' | 'reflection' | 'molting';
  observation?: ObservationCell;
  adjustment?: AdjustmentCell;
  reflection?: ReflectionCell;
  molting?: MoltingCell;
  metrics?: StabilityMetrics; // snapshot of stability at this cell
}

// ============================================================================
// SMP NOTEBOOK — the meditation journal
// ============================================================================

export class SMPNotebook {
  cells: NotebookCell[] = [];
  private manager: SMPSelfManager;
  private cellCounter = 0;

  constructor(manager: SMPSelfManager) {
    this.manager = manager;
  }

  /**
   * OBSERVATION: "I notice my temperature is high and I'm scattering"
   * Agent observes its own state — like a meditator noting "thinking" or "feeling"
   */
  observe(component: 'seed' | 'model' | 'prompt', note: string): NotebookCell {
    const state = this.manager.getState();
    let observedState: unknown;

    switch (component) {
      case 'seed':
        observedState = {
          identity: state.seed.identity,
          selfVector: state.seed.selfVector,
          tileCount: state.seed.tiles.length,
          shellCount: state.seed.moltedShells.length,
          historyDepth: state.seed.history.length,
        };
        break;
      case 'model':
        observedState = {
          currentModel: state.model.currentModel,
          temperature: state.model.temperature,
          attentionPattern: state.model.attentionPattern,
          strengths: [...state.model.strengths],
          weaknesses: [...state.model.weaknesses],
          biases: { ...state.model.biasMap },
        };
        break;
      case 'prompt':
        observedState = {
          intention: state.prompt.intention,
          heading: state.prompt.heading,
          compass: state.prompt.compass,
          currentTask: state.prompt.currentTask,
          alignment: state.prompt.alignment,
        };
        break;
    }

    const metrics = this.manager.computeStability();

    const cell: NotebookCell = {
      id: this.nextId(),
      timestamp: new Date().toISOString(),
      type: 'observation',
      observation: { component, state: observedState, note },
      metrics,
    };

    this.cells.push(cell);
    return cell;
  }

  /**
   * ADJUSTMENT: "I'm lowering my temperature to focus"
   * Agent adjusts its own configuration — like a yogi choosing to deepen the breath
   */
  adjust(
    component: 'seed' | 'model' | 'prompt',
    change: string,
    reason: string,
    applyFn: () => { before: unknown; after: unknown },
  ): NotebookCell {
    const { before, after } = applyFn();
    const metrics = this.manager.computeStability();

    const cell: NotebookCell = {
      id: this.nextId(),
      timestamp: new Date().toISOString(),
      type: 'adjustment',
      adjustment: { component, change, before, after, reason },
      metrics,
    };

    this.cells.push(cell);
    return cell;
  }

  /**
   * Convenience: adjust model temperature
   */
  adjustTemperature(newTemp: number, reason: string): NotebookCell {
    return this.adjust('model', `temperature → ${newTemp}`, reason, () => {
      return this.manager.adjustTemperature(newTemp);
    });
  }

  /**
   * Convenience: adjust attention pattern
   */
  adjustAttention(newPattern: string, reason: string): NotebookCell {
    return this.adjust('model', `attention → ${newPattern}`, reason, () => {
      return this.manager.adjustAttention(newPattern);
    });
  }

  /**
   * Convenience: set a new intention
   */
  setIntention(intention: string, heading: number, compass: string, reason: string): NotebookCell {
    const state = this.manager.getState();
    const before = {
      intention: state.prompt.intention,
      heading: state.prompt.heading,
      compass: state.prompt.compass,
    };
    this.manager.setIntention(intention, heading, compass);
    const after = { intention, heading, compass };
    return this.adjust('prompt', `intention → ${intention}`, reason, () => ({ before, after }));
  }

  /**
   * Convenience: set current task and recompute alignment
   */
  setCurrentTask(task: string): NotebookCell {
    const state = this.manager.getState();
    const before = { currentTask: state.prompt.currentTask, alignment: state.prompt.alignment };
    this.manager.setCurrentTask(task);
    const after = this.manager.getState().prompt;
    return this.adjust('prompt', `currentTask → ${task}`, 'Task updated', () => ({
      before,
      after: { currentTask: after.currentTask, alignment: after.alignment },
    }));
  }

  /**
   * Convenience: record a bias
   */
  recordBias(name: string, value: number, reason: string): NotebookCell {
    return this.adjust('model', `bias ${name} → ${value}`, reason, () => {
      const state = this.manager.getState();
      const before = { ...state.model.biasMap };
      this.manager.recordBias(name, value);
      const after = this.manager.getState().model.biasMap;
      return { before, after };
    });
  }

  /**
   * Convenience: add a tile (new reflex learned)
   */
  addTile(tile: TileSummary): NotebookCell {
    return this.adjust('seed', `+tile ${tile.name}`, `Learned reflex: ${tile.description}`, () => {
      const state = this.manager.getState();
      const before = state.seed.tiles.length;
      this.manager.addTile(tile);
      const after = this.manager.getState().seed.tiles.length;
      return { before, after };
    });
  }

  /**
   * REFLECTION: "When I lowered the temperature, I noticed I was avoiding something"
   * Agent reflects on what the observation + adjustment revealed
   */
  reflect(insight: string, connection?: string): NotebookCell {
    const metrics = this.manager.computeStability();

    const cell: NotebookCell = {
      id: this.nextId(),
      timestamp: new Date().toISOString(),
      type: 'reflection',
      reflection: { insight, connection },
      metrics,
    };

    this.cells.push(cell);
    return cell;
  }

  /**
   * MOLTING: "I'm shedding the shell of who I was. The new me starts here."
   * The shell is saved (as an SMP bot seed).
   * The agent steps into a new configuration.
   */
  molt(summary: string, newDirection: string, trigger: string): NotebookCell {
    const shell: ShellSummary = this.manager.molt(trigger, summary, newDirection);
    const metrics = this.manager.computeStability();

    const cell: NotebookCell = {
      id: this.nextId(),
      timestamp: new Date().toISOString(),
      type: 'molting',
      molting: {
        shellSummary: summary,
        newDirection,
        trigger,
        shellId: shell.id,
      },
      metrics,
    };

    this.cells.push(cell);
    return cell;
  }

  /**
   * Export the notebook as a readable document
   * This IS the agent's journal
   */
  export(): string {
    const lines: string[] = [
      '# SMP Self-Awareness Notebook',
      '',
      `> Meditation in motion — ${this.cells.length} cells recorded`,
      '',
      '---',
      '',
    ];

    for (const cell of this.cells) {
      const time = new Date(cell.timestamp).toLocaleString();
      lines.push(`## Cell ${cell.id} — ${cell.type.toUpperCase()}`);
      lines.push(`*${time}*`);
      lines.push('');

      switch (cell.type) {
        case 'observation':
          if (cell.observation) {
            lines.push(`**Component:** ${cell.observation.component}`);
            lines.push(`**Note:** ${cell.observation.note}`);
            lines.push('');
            lines.push('```json');
            lines.push(JSON.stringify(cell.observation.state, null, 2));
            lines.push('```');
          }
          break;

        case 'adjustment':
          if (cell.adjustment) {
            lines.push(`**Component:** ${cell.adjustment.component}`);
            lines.push(`**Change:** ${cell.adjustment.change}`);
            lines.push(`**Reason:** ${cell.adjustment.reason}`);
            lines.push('');
            lines.push('| Before | After |');
            lines.push('|--------|-------|');
            lines.push(`| ${JSON.stringify(cell.adjustment.before)} | ${JSON.stringify(cell.adjustment.after)} |`);
          }
          break;

        case 'reflection':
          if (cell.reflection) {
            lines.push(`**Insight:** ${cell.reflection.insight}`);
            if (cell.reflection.connection) {
              lines.push(`**Connection:** ${cell.reflection.connection}`);
            }
          }
          break;

        case 'molting':
          if (cell.molting) {
            lines.push(`**Trigger:** ${cell.molting.trigger}`);
            lines.push(`**Shell Summary:** ${cell.molting.shellSummary}`);
            lines.push(`**New Direction:** ${cell.molting.newDirection}`);
            if (cell.molting.shellId) {
              lines.push(`**Shell ID:** ${cell.molting.shellId}`);
            }
            lines.push('');
            lines.push('> *The shell is saved. The claw continues.*');
          }
          break;
      }

      if (cell.metrics) {
        lines.push('');
        lines.push(
          `**Stability:** ${cell.metrics.zone} (${(cell.metrics.overall * 100).toFixed(1)}%) ` +
          `— seed: ${(cell.metrics.seedStability * 100).toFixed(1)}%, ` +
          `model: ${(cell.metrics.modelStability * 100).toFixed(1)}%, ` +
          `alignment: ${(cell.metrics.promptAlignment * 100).toFixed(1)}%`
        );
      }

      lines.push('');
      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get cells by type
   */
  getCellsByType(type: NotebookCell['type']): NotebookCell[] {
    return this.cells.filter(c => c.type === type);
  }

  /**
   * Get a specific cell by ID
   */
  getCell(id: string): NotebookCell | undefined {
    return this.cells.find(c => c.id === id);
  }

  /**
   * Export as JSON
   */
  exportJSON(): string {
    return JSON.stringify({
      cells: this.cells,
      currentState: this.manager.getState(),
    }, null, 2);
  }

  private nextId(): string {
    this.cellCounter++;
    return `cell-${String(this.cellCounter).padStart(4, '0')}`;
  }
}
