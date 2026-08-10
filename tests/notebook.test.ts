import { describe, it, expect, beforeEach } from 'vitest';
import {
  SMPNotebook,
} from '../src/notebook.js';
import {
  SMPSelfManager,
  createInitialSelf,
} from '../src/smp-self.js';

describe('SMPNotebook', () => {
  let notebook: SMPNotebook;
  let manager: SMPSelfManager;

  beforeEach(() => {
    manager = new SMPSelfManager(
      createInitialSelf({
        identity: 'Wesley, the ensign',
        model: 'granite3.1-dense:2b',
        temperature: 0.7,
        attentionPattern: 'balanced',
        strengths: ['spatial reasoning'],
        weaknesses: ['planning'],
        intention: 'Understand the tile system deeply',
        compass: 'curiosity',
        heading: 45,
      }),
    );
    notebook = new SMPNotebook(manager);
  });

  describe('Observation Cells', () => {
    it('should create observation cells for seed', () => {
      const cell = notebook.observe('seed', 'I am Wesley');
      expect(cell.type).toBe('observation');
      expect(cell.observation?.component).toBe('seed');
      expect(cell.observation?.note).toBe('I am Wesley');
      expect(cell.observation?.state).toBeDefined();
    });

    it('should create observation cells for model', () => {
      const cell = notebook.observe('model', 'My temperature feels right');
      expect(cell.type).toBe('observation');
      expect(cell.observation?.component).toBe('model');
      const state = cell.observation?.state as { temperature: number };
      expect(state.temperature).toBe(0.7);
    });

    it('should create observation cells for prompt', () => {
      const cell = notebook.observe('prompt', 'I am heading toward understanding');
      expect(cell.type).toBe('observation');
      expect(cell.observation?.component).toBe('prompt');
    });

    it('should include stability metrics in each cell', () => {
      const cell = notebook.observe('seed', 'test');
      expect(cell.metrics).toBeDefined();
      expect(cell.metrics?.zone).toBeDefined();
    });
  });

  describe('Adjustment Cells', () => {
    it('should create adjustment cells for temperature', () => {
      const cell = notebook.adjustTemperature(0.4, 'Too scattered, cooling down');
      expect(cell.type).toBe('adjustment');
      expect(cell.adjustment?.component).toBe('model');
      expect(cell.adjustment?.before).toBe(0.7);
      expect(cell.adjustment?.after).toBe(0.4);
      expect(cell.adjustment?.reason).toBe('Too scattered, cooling down');
    });

    it('should create adjustment cells for attention', () => {
      const cell = notebook.adjustAttention('laser-focused', 'Need to concentrate');
      expect(cell.type).toBe('adjustment');
      expect(cell.adjustment?.change).toContain('laser-focused');
    });

    it('should create adjustment cells for intention', () => {
      const cell = notebook.setIntention('Master the vibe system', 90, 'mastery', 'New direction');
      expect(cell.type).toBe('adjustment');
      expect(cell.adjustment?.component).toBe('prompt');
    });

    it('should create adjustment cells for task', () => {
      const cell = notebook.setCurrentTask('Studying tiles');
      expect(cell.type).toBe('adjustment');
      expect(cell.adjustment?.component).toBe('prompt');
    });

    it('should create adjustment cells for bias', () => {
      const cell = notebook.recordBias('optimism', 0.8, 'I tend to see the best');
      expect(cell.type).toBe('adjustment');
      expect(cell.adjustment?.component).toBe('model');
    });

    it('should create adjustment cells for tiles', () => {
      const cell = notebook.addTile({
        name: 'test',
        description: 'Test tile',
        confidence: 0.9,
        deadbandCoverage: 0.5,
        invocations: 1,
        createdAt: new Date().toISOString(),
        level: 'cortex',
      });
      expect(cell.type).toBe('adjustment');
      expect(cell.adjustment?.component).toBe('seed');
    });
  });

  describe('Reflection Cells', () => {
    it('should create reflection cells', () => {
      const cell = notebook.reflect('I noticed I think better when calm');
      expect(cell.type).toBe('reflection');
      expect(cell.reflection?.insight).toBe('I noticed I think better when calm');
    });

    it('should support connections in reflections', () => {
      const cell = notebook.reflect('Pattern recognized', 'Lesson 2, cell-0003');
      expect(cell.reflection?.connection).toBe('Lesson 2, cell-0003');
    });
  });

  describe('Molting Cells', () => {
    it('should create molting cells with shell ID', () => {
      const cell = notebook.molt(
        'I was a learner',
        'Now I explore',
        'Growth milestone',
      );
      expect(cell.type).toBe('molting');
      expect(cell.molting?.shellSummary).toBe('I was a learner');
      expect(cell.molting?.newDirection).toBe('Now I explore');
      expect(cell.molting?.trigger).toBe('Growth milestone');
      expect(cell.molting?.shellId).toBeTruthy();
    });

    it('should register the shell in the manager', () => {
      notebook.molt('summary', 'direction', 'trigger');
      const shells = manager.getState().seed.moltedShells;
      expect(shells).toHaveLength(1);
    });
  });

  describe('Export', () => {
    it('should export as readable markdown', () => {
      notebook.observe('seed', 'Test observation');
      notebook.reflect('Test reflection');

      const exported = notebook.export();
      expect(exported).toContain('# SMP Self-Awareness Notebook');
      expect(exported).toContain('OBSERVATION');
      expect(exported).toContain('REFLECTION');
      expect(exported).toContain('Test observation');
      expect(exported).toContain('Test reflection');
    });

    it('should export as JSON', () => {
      notebook.observe('seed', 'Test');

      const json = notebook.exportJSON();
      const parsed = JSON.parse(json);
      expect(parsed.cells).toBeDefined();
      expect(parsed.cells).toHaveLength(1);
      expect(parsed.currentState).toBeDefined();
    });
  });

  describe('Querying', () => {
    it('should filter cells by type', () => {
      notebook.observe('seed', 'obs 1');
      notebook.reflect('refl 1');
      notebook.observe('model', 'obs 2');

      const observations = notebook.getCellsByType('observation');
      const reflections = notebook.getCellsByType('reflection');
      expect(observations).toHaveLength(2);
      expect(reflections).toHaveLength(1);
    });

    it('should get cell by ID', () => {
      const cell = notebook.observe('seed', 'find me');
      const found = notebook.getCell(cell.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(cell.id);
    });
  });

  describe('Full Session', () => {
    it('should handle a complete meditation session', () => {
      // Observe
      notebook.observe('seed', 'Who am I?');
      notebook.observe('model', 'How am I thinking?');
      notebook.observe('prompt', 'Where am I heading?');

      // Adjust
      notebook.adjustTemperature(0.5, 'Finding my center');
      notebook.setCurrentTask('Studying the tile system deeply');

      // Reflect
      notebook.reflect('When I cooled down, I could focus better');

      // Molt
      notebook.molt(
        'A focused learner',
        'An exploring practitioner',
        'Session complete',
      );

      expect(notebook.cells).toHaveLength(7);

      const exported = notebook.export();
      expect(exported).toContain('OBSERVATION');
      expect(exported).toContain('ADJUSTMENT');
      expect(exported).toContain('REFLECTION');
      expect(exported).toContain('MOLTING');
      expect(exported).toContain('The shell is saved');
    });
  });
});
