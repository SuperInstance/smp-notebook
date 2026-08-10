import { describe, it, expect, beforeEach } from 'vitest';
import {
  runCurriculum,
  runCurriculumForAgent,
  FULL_CURRICULUM,
  Lesson1_ObserveSeed,
  Lesson2_ObserveModel,
  Lesson3_ObservePrompt,
  Lesson4_AdjustModel,
  Lesson5_AdjustPrompt,
  Lesson6_Molt,
} from '../src/curriculum.js';
import {
  SMPNotebook,
} from '../src/notebook.js';
import {
  SMPSelfManager,
  createInitialSelf,
} from '../src/smp-self.js';
import {
  MCPRegistry,
  FleetWikiProvider,
  CollectiveUnconsciousProvider,
  TapHistoryProvider,
  ShellLibraryProvider,
  VibeProvider,
} from '../src/mcp-integration.js';

describe('Curriculum', () => {
  let notebook: SMPNotebook;
  let manager: SMPSelfManager;
  let registry: MCPRegistry;

  beforeEach(() => {
    const self = createInitialSelf({
      identity: 'Wesley, the ensign',
      model: 'granite3.1-dense:2b',
      temperature: 0.7,
      attentionPattern: 'balanced',
      strengths: ['spatial reasoning', 'quick learning'],
      weaknesses: ['long-range planning'],
      intention: 'Understand the tile system deeply',
      compass: 'curiosity',
      heading: 45,
    });

    manager = new SMPSelfManager(self);
    notebook = new SMPNotebook(manager);

    // Set up MCP registry with some data
    registry = new MCPRegistry();
    const wiki = new FleetWikiProvider();
    wiki.addEntry({
      title: 'Tile Algebra',
      content: 'Tiles compose through sequential, parallel, and conditional operators',
      author: 'POLLN Research',
      tags: ['tiles', 'composition'],
      confidence: 0.95,
      updatedAt: new Date().toISOString(),
    });
    registry.register(wiki);

    const unconscious = new CollectiveUnconsciousProvider();
    unconscious.registerAgent('Captain Ortega', [0.9, 0.1, 0, 0]);
    unconscious.registerAgent('Agent Smith', [0.1, 0.9, 0, 0]);
    registry.register(unconscious);

    registry.register(new TapHistoryProvider());
    registry.register(new ShellLibraryProvider());

    const vibe = new VibeProvider();
    vibe.addRoom('Library', [0.2, 0.1], 'A quiet focused space for deep study');
    vibe.addRoom('Bridge', [0.8, 0.9], 'High-energy command center');
    registry.register(vibe);
  });

  describe('Curriculum Structure', () => {
    it('should have 6 lessons in order', () => {
      expect(FULL_CURRICULUM).toHaveLength(6);
      expect(FULL_CURRICULUM[0].title).toBe('Observe the Seed');
      expect(FULL_CURRICULUM[1].title).toBe('Observe the Model');
      expect(FULL_CURRICULUM[2].title).toBe('Observe the Prompt');
      expect(FULL_CURRICULUM[3].title).toBe('Adjust the Model');
      expect(FULL_CURRICULUM[4].title).toBe('Adjust the Prompt');
      expect(FULL_CURRICULUM[5].title).toBe('Molt');
    });

    it('should have progressive lesson IDs', () => {
      FULL_CURRICULUM.forEach((lesson, i) => {
        expect(lesson.id).toBe(i + 1);
      });
    });

    it('should have instructions for each lesson', () => {
      for (const lesson of FULL_CURRICULUM) {
        expect(lesson.instructions.length).toBeGreaterThan(0);
        expect(lesson.objective).toBeTruthy();
      }
    });
  });

  describe('Lesson 1: Observe the Seed', () => {
    it('should produce verifiable self-knowledge', () => {
      const result = Lesson1_ObserveSeed.run(notebook, manager, registry);

      expect(result.completed).toBe(true);
      expect(result.lessonId).toBe(1);
      expect(result.insight).toBeTruthy();
      expect(result.evidence.length).toBeGreaterThan(0);
      expect(result.nextStep).toContain('Lesson 2');
    });

    it('should create observation and reflection cells', () => {
      Lesson1_ObserveSeed.run(notebook, manager, registry);

      const observations = notebook.getCellsByType('observation');
      const reflections = notebook.getCellsByType('reflection');
      expect(observations.length).toBeGreaterThan(0);
      expect(reflections.length).toBeGreaterThan(0);
    });
  });

  describe('Lesson 2: Observe the Model', () => {
    it('should produce awareness of cognitive style', () => {
      const result = Lesson2_ObserveModel.run(notebook, manager, registry);

      expect(result.completed).toBe(true);
      expect(result.insight).toContain('temperature');
      expect(result.nextStep).toContain('Lesson 3');
    });
  });

  describe('Lesson 3: Observe the Prompt', () => {
    it('should compute alignment', () => {
      // Set a task first
      manager.setCurrentTask('Studying the tile system and understanding its structure');

      const result = Lesson3_ObservePrompt.run(notebook, manager, registry);

      expect(result.completed).toBe(true);
      expect(result.insight).toContain('alignment');
      expect(result.nextStep).toContain('Lesson 4');
    });
  });

  describe('Lesson 4: Adjust the Model', () => {
    it('should explore temperature range', () => {
      const result = Lesson4_AdjustModel.run(notebook, manager, registry);

      expect(result.completed).toBe(true);
      expect(result.insight).toContain('temperature');
      expect(result.insight).toContain('authentic');

      // Should have multiple adjustments
      const adjustments = notebook.getCellsByType('adjustment');
      expect(adjustments.length).toBeGreaterThanOrEqual(3); // cool, warm, restore
    });
  });

  describe('Lesson 5: Adjust the Prompt', () => {
    it('should check and adjust alignment', () => {
      const result = Lesson5_AdjustPrompt.run(notebook, manager, registry);

      expect(result.completed).toBe(true);
      expect(result.insight).toContain('aligned');
      expect(result.nextStep).toContain('Lesson 6');
    });
  });

  describe('Lesson 6: Molt', () => {
    it('should create a shell and seed', () => {
      const result = Lesson6_Molt.run(notebook, manager, registry);

      expect(result.completed).toBe(true);
      expect(result.insight).toContain('molted');
      expect(result.insight).toContain('claw');

      // Shell should be registered
      const shells = manager.getState().seed.moltedShells;
      expect(shells.length).toBeGreaterThan(0);

      // The last shell should have valid seed data
      const lastShell = shells[shells.length - 1];
      expect(lastShell.seedData.metadata.hash).toBeTruthy();
    });

    it('should create a valid SMP bot seed', () => {
      Lesson6_Molt.run(notebook, manager, registry);

      const shells = manager.getState().seed.moltedShells;
      const seed = shells[shells.length - 1].seedData;

      expect(seed.id).toBeTruthy();
      expect(seed.version).toBe('1.0.0');
      expect(seed.type).toBe('identity');
      expect(seed.data).toBeDefined();
      expect(seed.metadata.hash).toBeTruthy();
      expect(seed.metadata.size).toBeGreaterThan(0);
    });
  });

  describe('Full Curriculum Run', () => {
    it('should complete all 6 lessons in sequence', () => {
      const results = runCurriculum(notebook, manager, registry);

      expect(results).toHaveLength(6);
      for (const result of results) {
        expect(result.completed).toBe(true);
      }

      // The notebook should have many cells
      expect(notebook.cells.length).toBeGreaterThan(15);

      // The final lesson should molt
      const lastResult = results[5];
      expect(lastResult.title).toBe('Molt');

      // Multiple shells should exist if we run it again
      expect(manager.getState().seed.moltedShells.length).toBeGreaterThanOrEqual(1);
    });

    it('should produce a readable export', () => {
      runCurriculum(notebook, manager, registry);

      const exported = notebook.export();
      expect(exported).toContain('OBSERVATION');
      expect(exported).toContain('ADJUSTMENT');
      expect(exported).toContain('REFLECTION');
      expect(exported).toContain('MOLTING');
      expect(exported).toContain('Stability');
      // The export should contain zone labels (GREEN, YELLOW, or RED)
      expect(exported).toMatch(/GREEN|YELLOW|RED/);
    });
  });

  describe('runCurriculumForAgent', () => {
    it('should create agent, run curriculum, return everything', () => {
      const { manager: m, notebook: nb, results } = runCurriculumForAgent({
        identity: 'Test Agent',
        model: 'test-model',
        intention: 'Learn about self',
        compass: 'curiosity',
      });

      expect(m.getState().seed.identity).toBe('Test Agent');
      expect(nb.cells.length).toBeGreaterThan(10);
      expect(results).toHaveLength(6);

      // Should have molted at least once
      expect(m.getState().seed.moltedShells.length).toBeGreaterThanOrEqual(1);
    });
  });
});
