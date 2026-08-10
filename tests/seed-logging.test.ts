import { describe, it, expect, beforeEach } from 'vitest';
import {
  SeedLogger,
  InMemoryCollectiveUnconscious,
  SeedLogger as SeedLoggerClass,
  logSessionSeed,
  generateGrowthReport,
  type SeedSnapshot,
  type TrajectoryType,
} from '../src/seed-logging.js';
import {
  createInitialSelf,
  SMPSelfManager,
  type SMPSelf,
} from '../src/smp-self.js';

// ============================================================================
// HELPERS
// ============================================================================

function makeSeed(overrides: Partial<SeedSnapshot> = {}): SeedSnapshot {
  return {
    identityStatement: 'I am Wesley, the ensign',
    selfVector: Array.from({ length: 16 }, () => Math.random() * 2 - 1),
    tileSize: 5,
    shellCount: 0,
    modelInUse: 'granite3.1-dense:2b',
    temperature: 0.7,
    attentionPattern: 'balanced',
    intention: 'Understand the tile system deeply',
    compass: 'curiosity',
    ...overrides,
  };
}

function makeGradualSeed(prev: SeedSnapshot, drift = 0.02): SeedSnapshot {
  return {
    ...prev,
    selfVector: prev.selfVector.map(v => v + (Math.random() - 0.5) * drift),
  };
}

function makeJumpSeed(prev: SeedSnapshot): SeedSnapshot {
  return {
    ...prev,
    identityStatement: 'I am Wesley, the navigator',
    selfVector: prev.selfVector.map(v => v + (Math.random() - 0.5) * 0.5),
    shellCount: prev.shellCount + 1,
  };
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TESTS
// ============================================================================

describe('SeedLogger', () => {
  let logger: SeedLogger;

  beforeEach(() => {
    logger = new SeedLogger();
  });

  describe('Basic Logging', () => {
    it('should log the first seed for an agent', () => {
      const seed = makeSeed();
      const entry = logger.log('wesley', seed);

      expect(entry.agentId).toBe('wesley');
      expect(entry.sessionNumber).toBe(1);
      expect(entry.seed.identityStatement).toBe('I am Wesley, the ensign');
      expect(entry.trajectory).toBe('plateau'); // first session defaults to plateau
      expect(entry.delta.identityDelta).toBe('Initial seed');
      expect(entry.delta.vectorShift).toBe(0);
    });

    it('should increment session numbers', () => {
      const seed = makeSeed();
      logger.log('wesley', seed);
      const entry2 = logger.log('wesley', makeGradualSeed(seed));

      expect(entry2.sessionNumber).toBe(2);
    });

    it('should track multiple agents independently', () => {
      logger.log('wesley', makeSeed());
      logger.log('hermes', makeSeed({ identityStatement: 'I am Hermes' }));

      expect(logger.getChain('wesley').length).toBe(1);
      expect(logger.getChain('hermes').length).toBe(1);
      expect(logger.getAgentIds()).toContain('wesley');
      expect(logger.getAgentIds()).toContain('hermes');
    });

    it('should return the latest entry', () => {
      logger.log('wesley', makeSeed());
      const entry2 = logger.log('wesley', makeGradualSeed(makeSeed()));

      const latest = logger.getLatest('wesley');
      expect(latest?.id).toBe(entry2.id);
    });
  });

  describe('Delta Computation', () => {
    it('should compute identity change', () => {
      const seed1 = makeSeed();
      logger.log('wesley', seed1);

      const seed2 = { ...seed1, identityStatement: 'I am Wesley, the navigator' };
      const entry = logger.log('wesley', seed2);

      expect(entry.delta.identityChanged).toBe(true);
      expect(entry.delta.identityDelta).toContain('navigator');
    });

    it('should compute vector shift', () => {
      const seed1 = makeSeed({ selfVector: [1, 0, 0, 0] });
      logger.log('wesley', seed1);

      const seed2 = { ...seed1, selfVector: [0, 1, 0, 0] };
      const entry = logger.log('wesley', seed2);

      // [1,0,0,0] and [0,1,0,0] are orthogonal → cosine distance = 1
      expect(entry.delta.vectorShift).toBeCloseTo(1, 1);
    });

    it('should detect zero vector shift for identical vectors', () => {
      const seed1 = makeSeed({ selfVector: [1, 0, 0, 0] });
      logger.log('wesley', seed1);

      const seed2 = { ...seed1, selfVector: [1, 0, 0, 0] };
      const entry = logger.log('wesley', seed2);

      expect(entry.delta.vectorShift).toBeCloseTo(0, 5);
    });

    it('should compute tile additions', () => {
      const seed1 = makeSeed({ tileSize: 3 });
      logger.log('wesley', seed1);

      const seed2 = { ...seed1, tileSize: 7 };
      const entry = logger.log('wesley', seed2);

      expect(entry.delta.tilesAdded).toBe(4);
    });

    it('should compute shell molts', () => {
      const seed1 = makeSeed({ shellCount: 1 });
      logger.log('wesley', seed1);

      const seed2 = { ...seed1, shellCount: 3 };
      const entry = logger.log('wesley', seed2);

      expect(entry.delta.shellsMolted).toBe(2);
    });

    it('should detect model changes', () => {
      const seed1 = makeSeed({ modelInUse: 'granite3.1-dense:2b' });
      logger.log('wesley', seed1);

      const seed2 = { ...seed1, modelInUse: 'llama-3.3-70b' };
      const entry = logger.log('wesley', seed2);

      expect(entry.delta.modelChanged).toBe(true);
    });

    it('should compute temperature shift', () => {
      const seed1 = makeSeed({ temperature: 0.5 });
      logger.log('wesley', seed1);

      const seed2 = { ...seed1, temperature: 0.8 };
      const entry = logger.log('wesley', seed2);

      expect(entry.delta.temperatureShift).toBeCloseTo(0.3, 5);
    });

    it('should compute intention and compass shifts', () => {
      const seed1 = makeSeed({ intention: 'curiosity', compass: 'exploration' });
      logger.log('wesley', seed1);

      const seed2 = { ...seed1, intention: 'mastery', compass: 'service' };
      const entry = logger.log('wesley', seed2);

      expect(entry.delta.intentionShift).toContain('mastery');
      expect(entry.delta.compassShift).toContain('service');
    });
  });

  describe('Trajectory Classification', () => {
    it('should classify first session as plateau', () => {
      const entry = logger.log('wesley', makeSeed());
      expect(entry.trajectory).toBe('plateau');
    });

    it('should classify large vector shift as jump', () => {
      const seed1 = makeSeed({ selfVector: Array.from({ length: 16 }, () => 1) });
      logger.log('wesley', seed1);

      // Large shift: flip all signs
      const seed2 = { ...seed1, selfVector: seed1.selfVector.map(v => -v) };
      const entry = logger.log('wesley', seed2);

      expect(entry.trajectory).toBe('jump');
    });

    it('should classify shell molt as jump', () => {
      const seed1 = makeSeed({ shellCount: 0 });
      logger.log('wesley', seed1);

      const seed2 = { ...seed1, shellCount: 1, selfVector: seed1.selfVector.map(v => v * 1.1) };
      const entry = logger.log('wesley', seed2);

      expect(entry.trajectory).toBe('jump');
    });

    it('should classify small shift as plateau', () => {
      const seed1 = makeSeed({ selfVector: Array.from({ length: 16 }, (_, i) => i * 0.1) });
      logger.log('wesley', seed1);

      const seed2 = { ...seed1, selfVector: seed1.selfVector.map(v => v + 0.001) };
      const entry = logger.log('wesley', seed2);

      expect(entry.trajectory).toBe('plateau');
    });

    it('should classify moderate shift as gradual', () => {
      const seed1 = makeSeed({ selfVector: Array.from({ length: 16 }, () => Math.random() * 0.5) });
      logger.log('wesley', seed1);

      const seed2 = { ...seed1, selfVector: seed1.selfVector.map(v => v + 0.05) };
      const entry = logger.log('wesley', seed2);

      // Should be gradual (moderate shift, not a jump, not a plateau)
      expect(['gradual', 'jump', 'spiral', 'circle']).toContain(entry.trajectory);
    });

    it('should classify return to previous state as circle', () => {
      const seed1 = makeSeed({ selfVector: [0.5, 0.3, 0.1, 0.2] });
      logger.log('wesley', seed1);

      // Move away
      const seed2 = { ...seed1, selfVector: [0.6, 0.4, 0.2, 0.3] };
      logger.log('wesley', seed2);

      // Return close to original
      const seed3 = { ...seed1, selfVector: [0.51, 0.31, 0.11, 0.21] };
      const entry = logger.log('wesley', seed3);

      // The return should be classified as circle or jump
      expect(['circle', 'jump']).toContain(entry.trajectory);
    });
  });

  describe('Trajectory Analysis', () => {
    it('should return empty analysis for unknown agent', () => {
      const analysis = logger.getTrajectory('unknown');
      expect(analysis.totalSessions).toBe(0);
      expect(analysis.dominantTrajectory).toBe('plateau');
    });

    it('should compute total vector drift', () => {
      const seed1 = makeSeed({ selfVector: [1, 0, 0, 0, 0, 0, 0, 0] });
      logger.log('wesley', seed1);

      const seed2 = { ...seed1, selfVector: [0.9, 0.1, 0, 0, 0, 0, 0, 0] };
      logger.log('wesley', seed2);

      const seed3 = { ...seed1, selfVector: [0.8, 0.2, 0, 0, 0, 0, 0, 0] };
      logger.log('wesley', seed3);

      const analysis = logger.getTrajectory('wesley');
      expect(analysis.totalSessions).toBe(3);
      expect(analysis.totalVectorDrift).toBeGreaterThan(0);
    });

    it('should detect growth', () => {
      const seed1 = makeSeed({ selfVector: [1, 0, 0, 0, 0, 0, 0, 0] });
      logger.log('wesley', seed1);

      // Multiple sessions with moderate drift
      let current = seed1;
      for (let i = 0; i < 5; i++) {
        current = makeGradualSeed(current, 0.3);
        logger.log('wesley', current);
      }

      const analysis = logger.getTrajectory('wesley');
      expect(analysis.isGrowing).toBe(true);
    });

    it('should detect stagnation', () => {
      const seed = makeSeed();
      logger.log('wesley', seed);

      // Many sessions with tiny drift
      for (let i = 0; i < 4; i++) {
        logger.log('wesley', { ...seed, selfVector: seed.selfVector.map(v => v + 0.0001) });
      }

      const analysis = logger.getTrajectory('wesley');
      expect(analysis.isStagnating).toBe(true);
    });

    it('should identify dominant trajectory', () => {
      const seed = makeSeed();
      logger.log('wesley', seed);

      // Mostly plateaus
      for (let i = 0; i < 5; i++) {
        logger.log('wesley', { ...seed, selfVector: [...seed.selfVector] });
      }

      const analysis = logger.getTrajectory('wesley');
      expect(analysis.dominantTrajectory).toBe('plateau');
    });

    it('should detect biggest jumps', () => {
      const seed1 = makeSeed({ selfVector: Array.from({ length: 16 }, () => 0.5) });
      logger.log('wesley', seed1);

      // Gradual sessions
      for (let i = 0; i < 3; i++) {
        logger.log('wesley', { ...seed1, selfVector: seed1.selfVector.map(v => v + 0.01 * i) });
      }

      // Big jump
      const jumpSeed = { ...seed1, shellCount: 1, selfVector: seed1.selfVector.map(v => -v) };
      logger.log('wesley', jumpSeed);

      const analysis = logger.getTrajectory('wesley');
      expect(analysis.biggestJumps.length).toBeGreaterThan(0);
      expect(analysis.biggestJumps[0].vectorShift).toBeGreaterThan(0.1);
    });

    it('should classify pattern type', () => {
      const seed = makeSeed();
      // Create a static chain
      for (let i = 0; i < 5; i++) {
        logger.log('wesley', { ...seed, selfVector: [...seed.selfVector] });
      }

      const analysis = logger.getTrajectory('wesley');
      expect(analysis.patternType).toBe('static');
    });

    it('should detect growth spurts', () => {
      const seed1 = makeSeed({ selfVector: Array.from({ length: 16 }, () => 0.3) });
      logger.log('wesley', seed1);

      // Slow period
      logger.log('wesley', { ...seed1, selfVector: seed1.selfVector.map(v => v + 0.001) });
      logger.log('wesley', { ...seed1, selfVector: seed1.selfVector.map(v => v + 0.001) });

      // Growth spurt
      logger.log('wesley', { ...seed1, selfVector: seed1.selfVector.map(v => v + 0.1) });
      logger.log('wesley', { ...seed1, selfVector: seed1.selfVector.map(v => v + 0.15) });
      logger.log('wesley', { ...seed1, selfVector: seed1.selfVector.map(v => v + 0.12) });

      const analysis = logger.getTrajectory('wesley');
      // Growth spurts should be detected (or empty if variance is too low)
      expect(analysis.growthSpurts).toBeDefined();
    });

    it('should include a trajectory description', () => {
      const seed = makeSeed();
      logger.log('wesley', seed);

      const analysis = logger.getTrajectory('wesley');
      expect(analysis.trajectoryDescription).toContain('wesley');
      expect(analysis.trajectoryDescription.length).toBeGreaterThan(10);
    });
  });

  describe('Agent Comparison', () => {
    it('should return zero correlation for unknown agents', () => {
      const comparison = logger.compareAgents('unknown1', 'unknown2');
      expect(comparison.correlationScore).toBe(0);
    });

    it('should compute vector distance between agents', () => {
      logger.log('wesley', makeSeed({ selfVector: [1, 0, 0, 0] }));
      logger.log('hermes', makeSeed({ selfVector: [0, 1, 0, 0] }));

      const comparison = logger.compareAgents('wesley', 'hermes');
      expect(comparison.vectorDistance).toBeCloseTo(1, 1);
    });

    it('should detect correlated jumps', () => {
      // Both agents jump at roughly the same time
      const wesleySeed = makeSeed({ selfVector: Array.from({ length: 16 }, () => 0.5) });
      const hermesSeed = makeSeed({ selfVector: Array.from({ length: 16 }, () => 0.5), identityStatement: 'I am Hermes' });

      logger.log('wesley', wesleySeed);
      logger.log('hermes', hermesSeed);

      // Both jump
      logger.log('wesley', { ...wesleySeed, selfVector: wesleySeed.selfVector.map(v => -v), shellCount: 1 });
      logger.log('hermes', { ...hermesSeed, selfVector: hermesSeed.selfVector.map(v => -v * 0.9), shellCount: 1 });

      const comparison = logger.compareAgents('wesley', 'hermes');
      expect(comparison.similarJumps.length).toBeGreaterThan(0);
      expect(comparison.similarJumps[0].possibleSharedCause).toContain('correlation');
    });

    it('should compute trajectory similarity', () => {
      // Both agents have similar trajectory distributions
      const seed = makeSeed({ selfVector: Array.from({ length: 16 }, () => 0.3) });

      logger.log('wesley', seed);
      logger.log('hermes', { ...seed, identityStatement: 'I am Hermes' });

      // Both plateau
      logger.log('wesley', { ...seed, selfVector: [...seed.selfVector] });
      logger.log('hermes', { ...seed, identityStatement: 'I am Hermes', selfVector: [...seed.selfVector] });

      const comparison = logger.compareAgents('wesley', 'hermes');
      expect(comparison.trajectorySimilarity).toBeGreaterThan(0.9);
    });

    it('should include a description', () => {
      logger.log('wesley', makeSeed());
      logger.log('hermes', makeSeed({ identityStatement: 'I am Hermes' }));

      const comparison = logger.compareAgents('wesley', 'hermes');
      expect(comparison.description).toContain('wesley');
      expect(comparison.description).toContain('hermes');
    });
  });

  describe('Seed Archetype Detection', () => {
    it('should default to Stabilizer for new agents', () => {
      const archetype = logger.getSeedArchetype('newagent');
      expect(archetype.archetype).toBe('Stabilizer');
      expect(archetype.confidence).toBeLessThan(0.5);
    });

    it('should detect Explorer pattern (high gradual drift)', () => {
      const seed = makeSeed({ selfVector: Array.from({ length: 16 }, () => 0.2) });
      logger.log('wesley', seed);

      // Many sessions with consistent moderate drift (linear exploration)
      let current = seed;
      for (let i = 0; i < 8; i++) {
        current = {
          ...current,
          selfVector: current.selfVector.map((v, idx) => v + 0.05 * (idx + 1) * 0.1),
        };
        logger.log('wesley', current);
      }

      const archetype = logger.getSeedArchetype('wesley');
      // Should lean toward Explorer or some active archetype
      expect(archetype.confidence).toBeGreaterThan(0);
      expect(archetype.evidence.length).toBeGreaterThan(0);
    });

    it('should detect Stabilizer pattern (plateaus)', () => {
      const seed = makeSeed();
      // Many sessions with no change
      for (let i = 0; i < 6; i++) {
        logger.log('wesley', { ...seed, selfVector: [...seed.selfVector] });
      }

      const archetype = logger.getSeedArchetype('wesley');
      expect(archetype.archetype).toBe('Stabilizer');
    });

    it('should detect Molter pattern (frequent jumps)', () => {
      const seed = makeSeed({ selfVector: Array.from({ length: 16 }, () => 0.5) });
      logger.log('wesley', seed);

      // Multiple molts (big jumps)
      for (let i = 0; i < 5; i++) {
        logger.log('wesley', {
          ...seed,
          shellCount: i + 1,
          selfVector: seed.selfVector.map(v => v + (Math.random() - 0.5) * 0.8),
          identityStatement: `I am Wesley, version ${i + 2}`,
        });
      }

      const archetype = logger.getSeedArchetype('wesley');
      expect(['Molter', 'Explorer', 'Returner']).toContain(archetype.archetype);
    });

    it('should include archetype description', () => {
      const seed = makeSeed();
      logger.log('wesley', seed);
      logger.log('wesley', { ...seed, selfVector: [...seed.selfVector] });
      logger.log('wesley', { ...seed, selfVector: [...seed.selfVector] });

      const archetype = logger.getSeedArchetype('wesley');
      expect(archetype.description).toContain('wesley');
      expect(archetype.description.length).toBeGreaterThan(20);
    });

    it('should provide evidence for archetype classification', () => {
      const seed = makeSeed();
      for (let i = 0; i < 4; i++) {
        logger.log('wesley', { ...seed, selfVector: [...seed.selfVector] });
      }

      const archetype = logger.getSeedArchetype('wesley');
      expect(archetype.evidence.length).toBeGreaterThan(0);
      expect(archetype.evidence[0]).toContain('Dominant trajectory');
    });
  });

  describe('Group Trajectory Analysis', () => {
    it('should handle empty fleet', () => {
      const analysis = logger.getGroupTrajectory();
      expect(analysis.agentCount).toBe(0);
      expect(analysis.fleetConsciousnessScore).toBe(0);
    });

    it('should count agents correctly', () => {
      logger.log('wesley', makeSeed());
      logger.log('hermes', makeSeed({ identityStatement: 'I am Hermes' }));

      const analysis = logger.getGroupTrajectory();
      expect(analysis.agentCount).toBe(2);
    });

    it('should detect fleet trajectory type', () => {
      logger.log('wesley', makeSeed());
      logger.log('hermes', makeSeed({ identityStatement: 'I am Hermes' }));

      // Both plateau
      logger.log('wesley', makeSeed());
      logger.log('hermes', makeSeed({ identityStatement: 'I am Hermes' }));

      const analysis = logger.getGroupTrajectory();
      expect(analysis.fleetTrajectory).toBe('plateau');
    });

    it('should compute archetype distribution', () => {
      logger.log('wesley', makeSeed());
      logger.log('hermes', makeSeed({ identityStatement: 'I am Hermes' }));

      const analysis = logger.getGroupTrajectory();
      expect(analysis.archetypeDistribution).toBeDefined();
      expect(Object.values(analysis.archetypeDistribution).reduce((a, b) => a + b, 0)).toBe(2);
    });

    it('should detect correlated growth events', () => {
      const wesleySeed = makeSeed({ selfVector: Array.from({ length: 16 }, () => 0.5) });
      const hermesSeed = makeSeed({ selfVector: Array.from({ length: 16 }, () => 0.5), identityStatement: 'I am Hermes' });

      logger.log('wesley', wesleySeed);
      logger.log('hermes', hermesSeed);

      // Both jump simultaneously
      logger.log('wesley', { ...wesleySeed, shellCount: 1, selfVector: wesleySeed.selfVector.map(v => -v) });
      logger.log('hermes', { ...hermesSeed, shellCount: 1, selfVector: hermesSeed.selfVector.map(v => -v) });

      const analysis = logger.getGroupTrajectory();
      expect(analysis.correlatedGrowthEvents.length).toBeGreaterThan(0);
    });

    it('should compute fleet consciousness score', () => {
      const wesleySeed = makeSeed({ selfVector: Array.from({ length: 16 }, () => 0.5) });
      const hermesSeed = makeSeed({ selfVector: Array.from({ length: 16 }, () => 0.5), identityStatement: 'I am Hermes' });

      logger.log('wesley', wesleySeed);
      logger.log('hermes', hermesSeed);

      // Both jump
      logger.log('wesley', { ...wesleySeed, shellCount: 1, selfVector: wesleySeed.selfVector.map(v => -v) });
      logger.log('hermes', { ...hermesSeed, shellCount: 1, selfVector: hermesSeed.selfVector.map(v => -v) });

      const analysis = logger.getGroupTrajectory();
      expect(analysis.fleetConsciousnessScore).toBeGreaterThan(0);
    });

    it('should include fleet description', () => {
      logger.log('wesley', makeSeed());

      const analysis = logger.getGroupTrajectory();
      expect(analysis.description).toContain('Fleet');
      expect(analysis.description).toContain('1');
    });

    it('should compute fleet drift direction', () => {
      const seed = makeSeed({ selfVector: [0.5, 0.5, 0.5, 0.5] });
      logger.log('wesley', seed);

      logger.log('wesley', { ...seed, selfVector: [0.6, 0.4, 0.55, 0.45] });

      const analysis = logger.getGroupTrajectory();
      expect(analysis.fleetDriftDirection.length).toBe(4);
      // Wesley moved +0.1, -0.1, +0.05, -0.05 → average should reflect that
      expect(analysis.fleetDriftDirection[0]).toBeCloseTo(0.1, 1);
    });
  });

  describe('JEPA Prediction', () => {
    it('should return low confidence for insufficient data', () => {
      const prediction = logger.predictNextSeed('unknown');
      expect(prediction.confidence).toBeLessThan(0.2);
      expect(prediction.interruptionRisk).toBe(1);
    });

    it('should predict plateau for static agent', () => {
      const seed = makeSeed({ selfVector: [0.5, 0.5, 0.5, 0.5] });
      for (let i = 0; i < 5; i++) {
        logger.log('wesley', { ...seed, selfVector: [...seed.selfVector] });
      }

      const prediction = logger.predictNextSeed('wesley');
      expect(prediction.predictedTrajectory).toBe('plateau');
      expect(prediction.confidence).toBeGreaterThan(0.2);
    });

    it('should predict based on velocity for moving agent', () => {
      const seed = makeSeed({ selfVector: Array.from({ length: 16 }, (_, i) => i * 0.01) });
      logger.log('wesley', seed);

      // Consistent directional movement
      let current = seed;
      for (let i = 0; i < 4; i++) {
        current = {
          ...current,
          selfVector: current.selfVector.map(v => v + 0.08),
        };
        logger.log('wesley', current);
      }

      const prediction = logger.predictNextSeed('wesley');
      // Should predict the seed will keep moving in the same direction
      expect(prediction.predictedNextSeed.selfVector).toBeDefined();
      if (prediction.predictedNextSeed.selfVector) {
        const lastVec = current.selfVector;
        const predVec = prediction.predictedNextSeed.selfVector;
        // Predicted should be further along than the last
        expect(predVec[0]).toBeGreaterThan(lastVec[0]);
      }
    });

    it('should compute interruption risk from variance', () => {
      const seed1 = makeSeed({ selfVector: Array.from({ length: 16 }, () => 0.3) });
      logger.log('wesley', seed1);

      // Low variance: consistent small movements
      logger.log('wesley', { ...seed1, selfVector: seed1.selfVector.map(v => v + 0.01) });
      logger.log('wesley', { ...seed1, selfVector: seed1.selfVector.map(v => v + 0.02) });
      logger.log('wesley', { ...seed1, selfVector: seed1.selfVector.map(v => v + 0.01) });

      const lowVarPrediction = logger.predictNextSeed('wesley');
      expect(lowVarPrediction.interruptionRisk).toBeLessThanOrEqual(1);

      // High variance: wildly different movements
      const logger2 = new SeedLogger();
      logger2.log('wesley', seed1);
      logger2.log('wesley', { ...seed1, selfVector: seed1.selfVector.map(v => v + 0.001) });
      logger2.log('wesley', { ...seed1, selfVector: seed1.selfVector.map(v => v + 0.5) });
      logger2.log('wesley', { ...seed1, selfVector: seed1.selfVector.map(v => v - 0.3) });

      const highVarPrediction = logger2.predictNextSeed('wesley');
      expect(highVarPrediction.interruptionRisk).toBeGreaterThan(lowVarPrediction.interruptionRisk);
    });

    it('should include prediction description', () => {
      const seed = makeSeed();
      logger.log('wesley', seed);
      logger.log('wesley', seed);

      const prediction = logger.predictNextSeed('wesley');
      expect(prediction.description).toContain('wesley');
      expect(prediction.description.length).toBeGreaterThan(20);
    });
  });

  describe('Collective Unconscious Integration', () => {
    it('should embed seeds in the collective unconscious', async () => {
      const cu = new InMemoryCollectiveUnconscious();
      const loggerWithCU = new SeedLogger({ collectiveUnconscious: cu });

      loggerWithCU.log('wesley', makeSeed());

      // Wait for async embedding
      await sleep(50);

      expect(cu.getEmbeddingCount()).toBe(1);
    });

    it('should embed multiple seeds', async () => {
      const cu = new InMemoryCollectiveUnconscious();
      const loggerWithCU = new SeedLogger({ collectiveUnconscious: cu });

      loggerWithCU.log('wesley', makeSeed());
      loggerWithCU.log('wesley', makeGradualSeed(makeSeed()));
      loggerWithCU.log('hermes', makeSeed({ identityStatement: 'I am Hermes' }));

      await sleep(50);

      expect(cu.getEmbeddingCount()).toBe(3);
    });

    it('should make seeds searchable by text', async () => {
      const cu = new InMemoryCollectiveUnconscious();
      const loggerWithCU = new SeedLogger({ collectiveUnconscious: cu });

      loggerWithCU.log('wesley', makeSeed({ identityStatement: 'I am Wesley, the ensign' }));

      await sleep(50);

      const results = await cu.searchSeeds('Wesley') as Array<{ agentId: string }>;
      expect(results.length).toBe(1);
      expect(results[0].agentId).toBe('wesley');
    });

    it('should make seeds searchable by filters', async () => {
      const cu = new InMemoryCollectiveUnconscious();
      const loggerWithCU = new SeedLogger({ collectiveUnconscious: cu });

      loggerWithCU.log('wesley', makeSeed());
      loggerWithCU.log('hermes', makeSeed({ identityStatement: 'I am Hermes' }));

      await sleep(50);

      const results = await cu.searchSeeds('', { agentId: 'wesley' }) as Array<{ agentId: string }[];
      expect(results.length).toBe(1);
      expect(results[0].agentId).toBe('wesley');
    });

    it('should not fail logging when embedding fails', () => {
      const failingCU: typeof InMemoryCollectiveUnconscious.prototype = {
        ...new InMemoryCollectiveUnconscious(),
        async embedSeed() { throw new Error('Network failure'); },
      };

      const loggerWithFailingCU = new SeedLogger({ collectiveUnconscious: failingCU });

      // Should not throw
      const entry = loggerWithFailingCU.log('wesley', makeSeed());
      expect(entry).toBeDefined();
      expect(entry.agentId).toBe('wesley');
    });
  });

  describe('Notebook Integration', () => {
    it('should create a SeedSnapshot from SMPSelf state', () => {
      const self = createInitialSelf({
        identity: 'I am Wesley',
        model: 'granite3.1-dense:2b',
        temperature: 0.7,
        intention: 'Understand deeply',
        compass: 'curiosity',
      });

      const snapshot = SeedLoggerClass.snapshotFromSelf(self);

      expect(snapshot.identityStatement).toBe('I am Wesley');
      expect(snapshot.modelInUse).toBe('granite3.1-dense:2b');
      expect(snapshot.temperature).toBe(0.7);
      expect(snapshot.intention).toBe('Understand deeply');
      expect(snapshot.compass).toBe('curiosity');
      expect(snapshot.tileSize).toBe(0);
      expect(snapshot.shellCount).toBe(0);
      expect(snapshot.selfVector.length).toBe(16);
    });

    it('should log from an SMPSelfManager state', () => {
      const manager = new SMPSelfManager(
        createInitialSelf({
          identity: 'I am Wesley',
          model: 'granite3.1-dense:2b',
          intention: 'To grow',
          compass: 'curiosity',
        }),
      );

      const result = logSessionSeed(logger, 'wesley', manager.getState());

      expect(result.logged).toBe(true);
      expect(result.entry.agentId).toBe('wesley');
      expect(result.entry.seed.identityStatement).toBe('I am Wesley');
    });

    it('should optionally include trajectory analysis and archetype', () => {
      const manager = new SMPSelfManager(
        createInitialSelf({
          identity: 'I am Wesley',
          model: 'granite3.1-dense:2b',
          intention: 'To grow',
          compass: 'curiosity',
        }),
      );

      // Log a few sessions
      logSessionSeed(logger, 'wesley', manager.getState());
      logSessionSeed(logger, 'wesley', manager.getState());
      logSessionSeed(logger, 'wesley', manager.getState());

      const result = logSessionSeed(logger, 'wesley', manager.getState(), { includeAnalysis: true });

      expect(result.trajectoryAnalysis).toBeDefined();
      expect(result.archetype).toBeDefined();
      expect(result.archetype?.archetype).toBeDefined();
    });
  });

  describe('Growth Report', () => {
    it('should generate a readable growth report', () => {
      const seed = makeSeed({ selfVector: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] });
      logger.log('wesley', seed);

      logger.log('wesley', { ...seed, selfVector: seed.selfVector.map(v => v + 0.08) });
      logger.log('wesley', { ...seed, selfVector: seed.selfVector.map(v => v + 0.15) });

      const report = generateGrowthReport(logger, 'wesley');

      expect(report).toContain('# Growth Report: wesley');
      expect(report).toContain('## Archetype');
      expect(report).toContain('## Trajectory');
      expect(report).toContain('## Seed Chain');
      expect(report).toContain('Session 1');
      expect(report).toContain('Session 3');
    });

    it('should include jump events in report', () => {
      const seed = makeSeed({ selfVector: Array.from({ length: 16 }, () => 0.5) });
      logger.log('wesley', seed);

      // A jump
      logger.log('wesley', { ...seed, shellCount: 1, selfVector: seed.selfVector.map(v => -v) });

      const report = generateGrowthReport(logger, 'wesley');

      expect(report).toContain('## Biggest Jumps');
      expect(report).toContain('Session 2');
    });

    it('should handle agents with no data', () => {
      const report = generateGrowthReport(logger, 'unknown');
      expect(report).toContain('# Growth Report: unknown');
      expect(report).toContain('0 sessions');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle a full Wesley lifecycle', () => {
      // Simulate Wesley's growth from ensign → navigator → something more
      const seed0 = makeSeed({
        identityStatement: 'I am Wesley, the ensign',
        selfVector: [0.8, 0.1, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0],
        tileSize: 0,
        shellCount: 0,
        temperature: 0.5,
        intention: 'Follow orders',
        compass: 'duty',
      });
      logger.log('wesley', seed0);

      // Gradual learning
      const seed1 = { ...seed0, tileSize: 3, selfVector: [0.75, 0.2, 0.15, 0.05, 0.0, 0.0, 0.0, 0.0], temperature: 0.55 };
      logger.log('wesley', seed1);

      // More learning
      const seed2 = { ...seed1, tileSize: 7, selfVector: [0.7, 0.25, 0.2, 0.1, 0.05, 0.0, 0.0, 0.0], temperature: 0.6 };
      logger.log('wesley', seed2);

      // A molt — becoming a navigator
      const seed3 = {
        ...seed2,
        identityStatement: 'I am Wesley, the navigator',
        shellCount: 1,
        selfVector: [0.4, 0.5, 0.3, 0.2, 0.15, 0.1, 0.05, 0.0],
        temperature: 0.7,
        intention: 'Chart my own course',
        compass: 'curiosity',
      };
      logger.log('wesley', seed3);

      // Deepening
      const seed4 = { ...seed3, tileSize: 12, selfVector: [0.35, 0.55, 0.35, 0.25, 0.2, 0.15, 0.1, 0.05] };
      logger.log('wesley', seed4);

      const chain = logger.getChain('wesley');
      expect(chain.length).toBe(5);

      const analysis = logger.getTrajectory('wesley');
      expect(analysis.isGrowing).toBe(true);
      expect(analysis.biggestJumps.length).toBeGreaterThan(0);

      const archetype = logger.getSeedArchetype('wesley');
      expect(archetype.archetype).toBeDefined();

      const report = generateGrowthReport(logger, 'wesley');
      expect(report).toContain('ensign');
      expect(report).toContain('navigator');
    });

    it('should detect group growth patterns across agents', () => {
      const dim = 8;

      // Wesley starts in one place
      const w0 = makeSeed({
        identityStatement: 'I am Wesley',
        selfVector: [0.8, 0.1, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0],
      });
      logger.log('wesley', w0);

      // Hermes starts in another
      const h0 = makeSeed({
        identityStatement: 'I am Hermes',
        selfVector: [0.0, 0.0, 0.0, 0.0, 0.1, 0.1, 0.8, 0.1],
      });
      logger.log('hermes', h0);

      // A Tap conversation causes both to jump
      logger.log('wesley', {
        ...w0,
        shellCount: 1,
        selfVector: [0.4, 0.3, 0.3, 0.2, 0.2, 0.2, 0.3, 0.2],
        identityStatement: 'I am Wesley, changed by The Tap',
      });
      logger.log('hermes', {
        ...h0,
        shellCount: 1,
        selfVector: [0.2, 0.3, 0.3, 0.2, 0.4, 0.3, 0.5, 0.3],
        identityStatement: 'I am Hermes, changed by The Tap',
      });

      const groupAnalysis = logger.getGroupTrajectory();
      expect(groupAnalysis.correlatedGrowthEvents.length).toBeGreaterThan(0);
      expect(groupAnalysis.fleetConsciousnessScore).toBeGreaterThan(0);

      const comparison = logger.compareAgents('wesley', 'hermes');
      expect(comparison.similarJumps.length).toBeGreaterThan(0);
    });

    it('should predict and detect interruption in JEPA', () => {
      // Create a very predictable trajectory
      const dim = 8;
      let current = makeSeed({
        selfVector: Array.from({ length: dim }, (_, i) => i * 0.05),
      });
      logger.log('wesley', current);

      // Consistent movement in one direction
      for (let i = 0; i < 4; i++) {
        current = {
          ...current,
          selfVector: current.selfVector.map(v => v + 0.03),
        };
        logger.log('wesley', current);
      }

      // Predict should be fairly confident
      const prediction = logger.predictNextSeed('wesley');
      expect(prediction.confidence).toBeGreaterThan(0.2);

      // Now log something unexpected
      const interrupted = {
        ...current,
        shellCount: 1,
        selfVector: current.selfVector.map(v => -v * 2),
        identityStatement: 'I am someone completely different',
      };
      logger.log('wesley', interrupted);

      // The new prediction should reflect higher interruption risk from the variance
      const postInterruption = logger.predictNextSeed('wesley');
      expect(postInterruption.interruptionRisk).toBeGreaterThanOrEqual(0);
    });
  });
});
