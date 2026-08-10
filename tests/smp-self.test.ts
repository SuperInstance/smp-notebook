import { describe, it, expect, beforeEach } from 'vitest';
import {
  SMPSelfManager,
  createInitialSelf,
  cosineDistance,
  type SMPSelf,
} from '../src/smp-self.js';

describe('SMPSelfManager', () => {
  let manager: SMPSelfManager;

  beforeEach(() => {
    manager = new SMPSelfManager(
      createInitialSelf({
        identity: 'Wesley, the ensign',
        model: 'granite3.1-dense:2b',
        temperature: 0.7,
        attentionPattern: 'balanced',
        strengths: ['spatial reasoning', 'quick learning'],
        weaknesses: ['long-range planning'],
        intention: 'Understand the tile system deeply',
        compass: 'curiosity',
        heading: 45,
      }),
    );
  });

  describe('SelfSeed', () => {
    it('should initialize with identity and self-vector', () => {
      const state = manager.getState();
      expect(state.seed.identity).toBe('Wesley, the ensign');
      expect(state.seed.selfVector.length).toBe(16);
      expect(state.seed.history).toHaveLength(1);
      expect(state.seed.history[0].context).toBe('Initial state');
    });

    it('should track identity drift through snapshots', () => {
      manager.snapshotIdentity('Starting work', 0.9);
      manager.snapshotIdentity('After learning', 0.85);

      const state = manager.getState();
      expect(state.seed.history).toHaveLength(3); // initial + 2 snapshots
    });

    it('should compute drift from origin', () => {
      // With same vector, drift should be 0
      const drift = manager.computeDrift();
      expect(drift).toBeGreaterThanOrEqual(0);
      expect(drift).toBeLessThanOrEqual(2);
    });

    it('should accumulate tiles as reflexes', () => {
      manager.addTile({
        name: 'fish-id-chinook',
        description: 'Identify Chinook salmon from camera footage',
        confidence: 0.92,
        deadbandCoverage: 0.8,
        invocations: 142,
        createdAt: new Date().toISOString(),
        level: 'reflex',
      });

      const state = manager.getState();
      expect(state.seed.tiles).toHaveLength(1);
      expect(state.seed.tiles[0].name).toBe('fish-id-chinook');
      expect(state.seed.tiles[0].level).toBe('reflex');
    });

    it('should track molted shells', () => {
      const shell = manager.molt(
        'Curriculum complete',
        'I was focused on learning. Now I explore.',
        'Completed self-awareness training',
      );

      const state = manager.getState();
      expect(state.seed.moltedShells).toHaveLength(1);
      expect(shell.identity).toBe('Wesley, the ensign');
      expect(shell.seedData.type).toBe('identity');
      expect(shell.seedData.metadata.hash).toBeTruthy();
    });
  });

  describe('SelfModel', () => {
    it('should initialize with correct model configuration', () => {
      const state = manager.getState();
      expect(state.model.currentModel).toBe('granite3.1-dense:2b');
      expect(state.model.temperature).toBe(0.7);
      expect(state.model.attentionPattern).toBe('balanced');
      expect(state.model.strengths).toContain('spatial reasoning');
      expect(state.model.weaknesses).toContain('long-range planning');
    });

    it('should adjust temperature within bounds', () => {
      const { before, after } = manager.adjustTemperature(0.3);
      expect(before).toBe(0.7);
      expect(after).toBe(0.3);

      const clamped = manager.adjustTemperature(-0.5);
      expect(clamped.after).toBe(0);

      const clampedHigh = manager.adjustTemperature(1.5);
      expect(clampedHigh.after).toBe(1);
    });

    it('should adjust attention pattern', () => {
      const { before, after } = manager.adjustAttention('hyper-focused');
      expect(before).toBe('balanced');
      expect(after).toBe('hyper-focused');
    });

    it('should record biases', () => {
      manager.recordBias('optimism', 0.7);
      manager.recordBias('caution', 0.3);

      const state = manager.getState();
      expect(state.model.biasMap.optimism).toBe(0.7);
      expect(state.model.biasMap.caution).toBe(0.3);
    });
  });

  describe('SelfPrompt', () => {
    it('should initialize with intention and compass', () => {
      const state = manager.getState();
      expect(state.prompt.intention).toBe('Understand the tile system deeply');
      expect(state.prompt.compass).toBe('curiosity');
      expect(state.prompt.heading).toBe(45);
      expect(state.prompt.alignment).toBe(0);
    });

    it('should compute alignment between task and intention', () => {
      // Set a task that overlaps with the intention
      manager.setCurrentTask('Study the tile system and understand its algebra');
      const state = manager.getState();
      expect(state.prompt.alignment).toBeGreaterThan(0);
    });

    it('should show low alignment for unrelated tasks', () => {
      manager.setCurrentTask('Watch cat videos');
      const state = manager.getState();
      expect(state.prompt.alignment).toBeLessThan(0.3);
    });

    it('should set new intention', () => {
      manager.setIntention('Master the vibe system', 180, 'mastery');
      const state = manager.getState();
      expect(state.prompt.intention).toBe('Master the vibe system');
      expect(state.prompt.heading).toBe(180);
      expect(state.prompt.compass).toBe('mastery');
    });
  });

  describe('Stability Metrics', () => {
    it('should compute stability metrics', () => {
      const metrics = manager.computeStability();
      expect(metrics.overall).toBeGreaterThanOrEqual(0);
      expect(metrics.overall).toBeLessThanOrEqual(1);
      expect(['GREEN', 'YELLOW', 'RED']).toContain(metrics.zone);
    });

    it('should track metrics history', () => {
      manager.computeStability();
      manager.computeStability();
      const history = manager.getMetricsHistory();
      expect(history).toHaveLength(2);
    });

    it('should report correct zone for stability', () => {
      // Fresh state with no drift should be reasonably stable
      const metrics = manager.computeStability();
      expect(metrics.seedStability).toBeGreaterThan(0.9); // no drift yet
    });
  });

  describe('Molting', () => {
    it('should create a valid SMP bot seed on molting', () => {
      manager.addTile({
        name: 'test-tile',
        description: 'Test reflex',
        confidence: 0.9,
        deadbandCoverage: 0.5,
        invocations: 10,
        createdAt: new Date().toISOString(),
        level: 'reflex',
      });

      const shell = manager.molt(
        'Test molt',
        'Who I was',
        'Where I am going',
        'Testing',
      );

      expect(shell.seedData).toBeDefined();
      expect(shell.seedData.id).toBeTruthy();
      expect(shell.seedData.version).toBe('1.0.0');
      expect(shell.seedData.type).toBe('identity');
      expect(shell.seedData.metadata.hash).toBeTruthy();
      expect(shell.seedData.metadata.size).toBeGreaterThan(0);

      // The shell should be saved in moltedShells
      const state = manager.getState();
      expect(state.seed.moltedShells).toHaveLength(1);
      expect(state.seed.moltedShells[0].id).toBe(shell.id);
    });

    it('should preserve identity but add post-molt snapshot', () => {
      const historyBefore = manager.getState().seed.history.length;
      manager.molt('trigger', 'summary', 'direction');
      const historyAfter = manager.getState().seed.history.length;
      expect(historyAfter).toBe(historyBefore + 1);
    });
  });
});

describe('cosineDistance', () => {
  it('should return 0 for identical vectors', () => {
    const v = [1, 2, 3];
    expect(cosineDistance(v, v)).toBeCloseTo(0, 5);
  });

  it('should return positive for different vectors', () => {
    expect(cosineDistance([1, 0, 0], [0, 1, 0])).toBeCloseTo(1, 5);
  });

  it('should handle empty vectors', () => {
    expect(cosineDistance([], [])).toBe(1);
  });
});

describe('createInitialSelf', () => {
  it('should create a complete SMP self', () => {
    const self: SMPSelf = createInitialSelf({
      identity: 'Test Agent',
      model: 'test-model',
      intention: 'Test intention',
      compass: 'curiosity',
    });

    expect(self.seed.identity).toBe('Test Agent');
    expect(self.seed.selfVector.length).toBe(16);
    expect(self.seed.history).toHaveLength(1);
    expect(self.model.currentModel).toBe('test-model');
    expect(self.model.temperature).toBe(0.7);
    expect(self.prompt.intention).toBe('Test intention');
    expect(self.prompt.compass).toBe('curiosity');
  });
});
