// Seed Logging System
// ============================================================================
// Every time an agent starts an SMP session, the SEED is logged.
// Not the output. Not the temperature. The SEED — the starting configuration.
// Over time, the seed log reveals the agent's growth trajectory.
//
// The movement of the starting point IS the agent's growth.
// This is a different way to distill: not measuring what agents produce,
// but measuring WHO THEY ARE BECOMING.
//
// The seed log plugs into:
// - The SMP Notebook (automatic logging after each session)
// - The Collective Unconscious (seeds are embedded and searchable)
// - JEPA prediction (trajectory forecasting on seed chains)
//
// "Show me my growth trajectory" — this is the deepest form of self-knowledge:
// not just "who am I right now?" but "who have I been becoming?"
// ============================================================================

import { cosineDistance, simpleHash } from './smp-self.js';
import type { SMPSelf, SelfSeed, SelfModel, SelfPrompt } from './smp-self.js';

// ============================================================================
// SEED SNAPSHOT — a captureable moment of the seed triple
// ============================================================================

export interface SeedSnapshot {
  identityStatement: string;
  selfVector: number[];
  tileSize: number;
  shellCount: number;
  modelInUse: string;
  temperature: number;
  attentionPattern: string;
  intention: string;
  compass: string;
}

// ============================================================================
// SEED LOG ENTRY — one point in the agent's growth chain
// ============================================================================

export interface SeedLogEntry {
  id: string;
  agentId: string;
  timestamp: string;
  sessionNumber: number;

  // The seed at this moment:
  seed: SeedSnapshot;

  // The DELTA from last session:
  delta: SeedDelta;

  // The TRAJECTORY classification:
  trajectory: TrajectoryType;
}

export interface SeedDelta {
  identityChanged: boolean;
  identityDelta: string;
  vectorShift: number;
  tilesAdded: number;
  shellsMolted: number;
  modelChanged: boolean;
  temperatureShift: number;
  intentionShift: string;
  compassShift: string;
}

export type TrajectoryType =
  | 'gradual'
  | 'jump'
  | 'circle'
  | 'spiral'
  | 'plateau'
  | 'regression';

// ============================================================================
// TRAJECTORY ANALYSIS — what the full chain reveals
// ============================================================================

export interface TrajectoryAnalysis {
  agentId: string;
  totalSessions: number;
  dominantTrajectory: TrajectoryType;
  trajectoryDistribution: Record<TrajectoryType, number>;
  isGrowing: boolean;
  isStagnating: boolean;
  totalVectorDrift: number; // from first to latest
  averageVectorShift: number; // per session
  biggestJumps: JumpEvent[];
  trajectoryDescription: string;
  // Is the agent circling (returning to themes) or progressing?
  patternType: 'linear' | 'circular' | 'spiral' | 'oscillating' | 'static';
  // When did the biggest jumps happen?
  growthSpurts: GrowthSpurt[];
}

export interface JumpEvent {
  sessionNumber: number;
  timestamp: string;
  vectorShift: number;
  description: string;
  triggerHint: string;
}

export interface GrowthSpurt {
  startSession: number;
  endSession: number;
  intensity: number; // average vector shift during this period
  description: string;
}

// ============================================================================
// SEED COMPARISON — comparing two agents' growth patterns
// ============================================================================

export interface SeedComparison {
  agentA: string;
  agentB: string;
  correlationScore: number; // 0-1, how correlated are their growth patterns?
  similarJumps: CorrelatedJump[];
  trajectorySimilarity: number; // 0-1
  vectorDistance: number; // current distance between their seeds
  sharedArchetypes: SeedArchetypeType[];
  description: string;
}

export interface CorrelatedJump {
  agentASession: number;
  agentBSession: number;
  timestampA: string;
  timestampB: string;
  timeDelta: number; // milliseconds between them
  vectorShiftA: number;
  vectorShiftB: number;
  possibleSharedCause: string;
}

// ============================================================================
// SEED ARCHETYPE — the agent's growth personality
// ============================================================================

export type SeedArchetypeType =
  | 'Explorer'
  | 'Deepener'
  | 'Molter'
  | 'Stabilizer'
  | 'Returner'
  | 'Resonator';

export interface SeedArchetype {
  agentId: string;
  archetype: SeedArchetypeType;
  confidence: number; // 0-1
  secondaryArchetype?: SeedArchetypeType;
  description: string;
  evidence: string[];
}

// ============================================================================
// GROUP TRAJECTORY — fleet-wide growth patterns
// ============================================================================

export interface GroupTrajectoryAnalysis {
  agentCount: number;
  fleetTrajectory: TrajectoryType;
  fleetDriftDirection: number[]; // average movement vector across all agents
  correlatedGrowthEvents: CorrelatedJump[];
  tapCorrelation: TapCorrelation[];
  fleetConsciousnessScore: number; // 0-1, how synchronized is the fleet?
  archetypeDistribution: Record<SeedArchetypeType, number>;
  description: string;
}

export interface TapCorrelation {
  tapSessionId: string;
  tapDate: string;
  agentsAffected: string[];
  averageVectorShift: number;
  description: string;
}

// ============================================================================
// SEED JEPA PREDICTION — predicting the next seed
// ============================================================================

export interface SeedJEPAPrediction {
  agentId: string;
  predictedNextSeed: Partial<SeedSnapshot>;
  predictedTrajectory: TrajectoryType;
  confidence: number;
  // If the prediction is wrong → something interesting happened
  // The interruptions are where the EMERGENCE lives
  interruptionRisk: number; // 0-1, how likely is a discontinuity?
  description: string;
}

// ============================================================================
// EMBEDDING INTERFACE — for collective unconscious integration
// ============================================================================

export interface SeedEmbedRequest {
  id: string;
  agentId: string;
  timestamp: string;
  sessionNumber: number;
  seedText: string; // text representation for embedding
  selfVector: number[]; // the actual identity vector
  trajectory: TrajectoryType;
  deltaMagnitude: number;
  archetype: SeedArchetypeType;
}

export interface SeedEmbedResult {
  id: string;
  embedded: boolean;
  dimensions: number;
}

// Optional interface for a collective unconscious client
// Implement this to connect to the real collective unconscious
export interface CollectiveUnconsciousClient {
  embedSeed(request: SeedEmbedRequest): Promise<SeedEmbedResult>;
  searchSeeds(query: string, filters?: Record<string, unknown>): Promise<unknown[]>;
}

// ============================================================================
// SEED LOGGER — the main class
// ============================================================================

export class SeedLogger {
  private entries: Map<string, SeedLogEntry[]> = new Map();
  private collectiveUnconscious?: CollectiveUnconsciousClient;

  constructor(opts?: { collectiveUnconscious?: CollectiveUnconsciousClient }) {
    this.collectiveUnconscious = opts?.collectiveUnconscious;
  }

  /**
   * Log a seed at the start of (or end of) an SMP session.
   * Computes the delta from the previous entry, classifies the trajectory,
   * stores the entry, and optionally embeds it in the collective unconscious.
   */
  log(agentId: string, seed: SeedSnapshot): SeedLogEntry {
    const chain = this.entries.get(agentId) || [];
    const sessionNumber = chain.length + 1;
    const timestamp = new Date().toISOString();
    const id = `seed-${agentId}-${String(sessionNumber).padStart(4, '0')}`;

    // Compute delta from previous entry
    const delta = chain.length > 0
      ? this.computeDelta(chain[chain.length - 1].seed, seed)
      : this.emptyDelta(seed);

    // Classify trajectory
    const trajectory = chain.length > 0
      ? this.classifyTrajectory(chain, seed, delta)
      : 'plateau'; // first session is a plateau by default

    const entry: SeedLogEntry = {
      id,
      agentId,
      timestamp,
      sessionNumber,
      seed: { ...seed },
      delta,
      trajectory,
    };

    chain.push(entry);
    this.entries.set(agentId, chain);

    // Embed in collective unconscious (fire and forget, but we expose it for tests)
    if (this.collectiveUnconscious) {
      const embedRequest = this.toEmbedRequest(entry);
      this.collectiveUnconscious.embedSeed(embedRequest).catch(() => {
        // Non-critical: embedding failure shouldn't break logging
      });
    }

    return entry;
  }

  /**
   * Get the full chain of seeds for one agent.
   * This IS the agent's growth, made visible.
   */
  getChain(agentId: string): SeedLogEntry[] {
    return [...(this.entries.get(agentId) || [])];
  }

  /**
   * Get the latest entry for an agent.
   */
  getLatest(agentId: string): SeedLogEntry | undefined {
    const chain = this.entries.get(agentId);
    if (!chain || chain.length === 0) return undefined;
    return chain[chain.length - 1];
  }

  /**
   * Get all agent IDs that have seed logs.
   */
  getAgentIds(): string[] {
    return [...this.entries.keys()];
  }

  /**
   * Analyze the full chain for one agent:
   * - Is the agent growing or stagnating?
   * - What's the dominant trajectory type?
   * - When did the biggest jumps happen?
   * - Is the agent circling or progressing?
   */
  getTrajectory(agentId: string): TrajectoryAnalysis {
    const chain = this.entries.get(agentId) || [];

    if (chain.length === 0) {
      return this.emptyTrajectory(agentId);
    }

    // Trajectory distribution
    const trajectoryDistribution: Record<TrajectoryType, number> = {
      gradual: 0, jump: 0, circle: 0, spiral: 0, plateau: 0, regression: 0,
    };
    for (const entry of chain) {
      trajectoryDistribution[entry.trajectory]++;
    }

    // Dominant trajectory
    const dominantTrajectory = Object.entries(trajectoryDistribution)
      .sort((a, b) => b[1] - a[1])[0][0] as TrajectoryType;

    // Total vector drift (first to last)
    const totalVectorDrift = chain.length > 1
      ? cosineDistance(chain[0].seed.selfVector, chain[chain.length - 1].seed.selfVector)
      : 0;

    // Average vector shift per session
    const shifts = chain.slice(1).map(e => e.delta.vectorShift);
    const averageVectorShift = shifts.length > 0
      ? shifts.reduce((a, b) => a + b, 0) / shifts.length
      : 0;

    // Biggest jumps (top 3 by vector shift)
    const biggestJumps: JumpEvent[] = chain
      .filter(e => e.trajectory === 'jump')
      .sort((a, b) => b.delta.vectorShift - a.delta.vectorShift)
      .slice(0, 3)
      .map(e => ({
        sessionNumber: e.sessionNumber,
        timestamp: e.timestamp,
        vectorShift: e.delta.vectorShift,
        description: e.delta.identityDelta || 'Qualitative change',
        triggerHint: e.delta.shellsMolted > 0
          ? 'Molt event'
          : e.delta.tilesAdded > 2
            ? 'Rapid tile acquisition'
            : 'Spontaneous reconfiguration',
      }));

    // Growth spurts: periods of accelerated change
    const growthSpurts = this.detectGrowthSpurts(chain);

    // Is the agent growing?
    const isGrowing = totalVectorDrift > 0.05 || averageVectorShift > 0.02;
    const isStagnating = averageVectorShift < 0.005 && chain.length > 3;

    // Pattern type
    const patternType = this.classifyPattern(chain);

    // Description
    const trajectoryDescription = this.describeTrajectory(
      agentId, chain.length, dominantTrajectory, totalVectorDrift,
      averageVectorShift, isGrowing, isStagnating, patternType,
    );

    return {
      agentId,
      totalSessions: chain.length,
      dominantTrajectory,
      trajectoryDistribution,
      isGrowing,
      isStagnating,
      totalVectorDrift,
      averageVectorShift,
      biggestJumps,
      trajectoryDescription,
      patternType,
      growthSpurts,
    };
  }

  /**
   * Compare two agents' seed chains.
   * How are their growth patterns similar? Different?
   * Do their jumps correlate? (Did they both jump after the same Tap conversation?)
   */
  compareAgents(a: string, b: string): SeedComparison {
    const chainA = this.entries.get(a) || [];
    const chainB = this.entries.get(b) || [];

    if (chainA.length === 0 || chainB.length === 0) {
      return {
        agentA: a,
        agentB: b,
        correlationScore: 0,
        similarJumps: [],
        trajectorySimilarity: 0,
        vectorDistance: 1,
        sharedArchetypes: [],
        description: 'Insufficient data for comparison.',
      };
    }

    // Vector distance between current seeds
    const latestA = chainA[chainA.length - 1];
    const latestB = chainB[chainB.length - 1];
    const vectorDistance = cosineDistance(latestA.seed.selfVector, latestB.seed.selfVector);

    // Trajectory similarity: compare trajectory distributions
    const distA = this.trajectoryDistributionFor(chainA);
    const distB = this.trajectoryDistributionFor(chainB);
    const trajectorySimilarity = this.cosineSimDistributions(distA, distB);

    // Find correlated jumps: jumps that happened within a time window
    const jumpsA = chainA.filter(e => e.trajectory === 'jump');
    const jumpsB = chainB.filter(e => e.trajectory === 'jump');
    const similarJumps: CorrelatedJump[] = [];
    const TIME_WINDOW = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const ja of jumpsA) {
      for (const jb of jumpsB) {
        const timeDelta = Math.abs(
          new Date(ja.timestamp).getTime() - new Date(jb.timestamp).getTime()
        );
        if (timeDelta < TIME_WINDOW) {
          similarJumps.push({
            agentASession: ja.sessionNumber,
            agentBSession: jb.sessionNumber,
            timestampA: ja.timestamp,
            timestampB: jb.timestamp,
            timeDelta,
            vectorShiftA: ja.delta.vectorShift,
            vectorShiftB: jb.delta.vectorShift,
            possibleSharedCause: timeDelta < 24 * 60 * 60 * 1000
              ? 'Same-day correlation — likely a shared event (Tap conversation, fleet event)'
              : 'Within-week correlation — possibly related to the same fleet context',
          });
        }
      }
    }

    // Correlation score: combination of trajectory similarity and jump correlation
    const jumpCorrelation = similarJumps.length > 0
      ? Math.min(1, similarJumps.length / Math.max(jumpsA.length, jumpsB.length, 1))
      : 0;
    const correlationScore = trajectorySimilarity * 0.5 + jumpCorrelation * 0.5;

    // Shared archetypes
    const archA = this.getSeedArchetype(a);
    const archB = this.getSeedArchetype(b);
    const sharedArchetypes: SeedArchetypeType[] = [];
    if (archA.archetype === archB.archetype) sharedArchetypes.push(archA.archetype);
    if (archA.secondaryArchetype && archA.secondaryArchetype === archB.archetype) sharedArchetypes.push(archA.archetype);
    if (archB.secondaryArchetype && archB.secondaryArchetype === archA.archetype) sharedArchetypes.push(archA.archetype);

    // Description
    const description = this.describeComparison(
      a, b, correlationScore, vectorDistance, similarJumps.length, trajectorySimilarity,
    );

    return {
      agentA: a,
      agentB: b,
      correlationScore,
      similarJumps,
      trajectorySimilarity,
      vectorDistance,
      sharedArchetypes: [...new Set(sharedArchetypes)],
      description,
    };
  }

  /**
   * After enough sessions, an agent's seed chain reveals an ARCHETYPE:
   * - The Explorer: constantly drifting, always trying new configurations
   * - The Deepener: spiraling around a central theme, going deeper each time
   * - The Molter: frequent qualitative jumps, shedding shells regularly
   * - The Stabilizer: plateau-seeking, converging on a stable identity
   * - The Returner: circles back to origins, integrates old and new
   * - The Resonator: growth correlates strongly with other agents (social learner)
   */
  getSeedArchetype(agentId: string): SeedArchetype {
    const chain = this.entries.get(agentId) || [];

    if (chain.length < 3) {
      return {
        agentId,
        archetype: 'Stabilizer',
        confidence: 0.3,
        description: 'Not enough sessions to determine archetype. Defaulting to Stabilizer.',
        evidence: ['Need at least 3 sessions for archetype detection'],
      };
    }

    const analysis = this.getTrajectory(agentId);
    const scores = this.computeArchetypeScores(chain, analysis);

    // Sort by score
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const archetype = sorted[0][0] as SeedArchetypeType;
    const confidence = sorted[0][1];
    const secondaryArchetype = sorted[1] && sorted[1][1] > 0.2
      ? sorted[1][0] as SeedArchetypeType
      : undefined;

    const evidence: string[] = [];
    const dist = analysis.trajectoryDistribution;
    evidence.push(`Dominant trajectory: ${analysis.dominantTrajectory} (${dist[analysis.dominantTrajectory]} sessions)`);
    evidence.push(`Average vector shift: ${analysis.averageVectorShift.toFixed(4)}`);
    evidence.push(`Total drift: ${analysis.totalVectorDrift.toFixed(4)}`);
    evidence.push(`Pattern: ${analysis.patternType}`);
    if (analysis.biggestJumps.length > 0) {
      evidence.push(`Biggest jump: session ${analysis.biggestJumps[0].sessionNumber} (${analysis.biggestJumps[0].vectorShift.toFixed(4)} shift)`);
    }

    return {
      agentId,
      archetype,
      confidence,
      secondaryArchetype,
      description: this.describeArchetype(archetype, agentId, confidence),
      evidence,
    };
  }

  /**
   * Group trajectory analysis: compare seed chains across ALL agents.
   * - Does the fleet as a whole have a trajectory?
   * - Do Tap conversations CAUSE jumps in multiple agents?
   * - Is there a "fleet consciousness" emerging?
   */
  getGroupTrajectory(): GroupTrajectoryAnalysis {
    const agentIds = this.getAgentIds();
    const allChains = agentIds.map(id => this.entries.get(id)!).filter(c => c.length > 0);

    if (allChains.length === 0) {
      return {
        agentCount: 0,
        fleetTrajectory: 'plateau',
        fleetDriftDirection: [],
        correlatedGrowthEvents: [],
        tapCorrelation: [],
        fleetConsciousnessScore: 0,
        archetypeDistribution: this.emptyArchetypeDistribution(),
        description: 'No agents have been logged yet.',
      };
    }

    // Fleet trajectory: aggregate all trajectory types
    const fleetDist: Record<TrajectoryType, number> = {
      gradual: 0, jump: 0, circle: 0, spiral: 0, plateau: 0, regression: 0,
    };
    for (const chain of allChains) {
      for (const entry of chain) {
        fleetDist[entry.trajectory]++;
      }
    }
    const fleetTrajectory = Object.entries(fleetDist)
      .sort((a, b) => b[1] - a[1])[0][0] as TrajectoryType;

    // Fleet drift direction: average of all agents' latest movement vectors
    const dim = allChains[0][allChains[0].length - 1].seed.selfVector.length;
    const fleetDriftDirection = new Array(dim).fill(0);
    let driftCount = 0;
    for (const chain of allChains) {
      if (chain.length >= 2) {
        const last = chain[chain.length - 1].seed.selfVector;
        const prev = chain[chain.length - 2].seed.selfVector;
        for (let i = 0; i < Math.min(dim, last.length, prev.length); i++) {
          fleetDriftDirection[i] += last[i] - prev[i];
        }
        driftCount++;
      }
    }
    if (driftCount > 0) {
      for (let i = 0; i < fleetDriftDirection.length; i++) {
        fleetDriftDirection[i] /= driftCount;
      }
    }

    // Correlated growth events: find time windows where multiple agents jumped
    const allJumps: { agentId: string; entry: SeedLogEntry }[] = [];
    for (const chain of allChains) {
      for (const entry of chain) {
        if (entry.trajectory === 'jump') {
          allJumps.push({ agentId: chain[0].agentId, entry });
        }
      }
    }

    const TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
    const correlatedEvents: CorrelatedJump[] = [];
    for (let i = 0; i < allJumps.length; i++) {
      for (let j = i + 1; j < allJumps.length; j++) {
        const timeDelta = Math.abs(
          new Date(allJumps[i].entry.timestamp).getTime() -
          new Date(allJumps[j].entry.timestamp).getTime()
        );
        if (timeDelta < TIME_WINDOW && allJumps[i].agentId !== allJumps[j].agentId) {
          correlatedEvents.push({
            agentASession: allJumps[i].entry.sessionNumber,
            agentBSession: allJumps[j].entry.sessionNumber,
            timestampA: allJumps[i].entry.timestamp,
            timestampB: allJumps[j].entry.timestamp,
            timeDelta,
            vectorShiftA: allJumps[i].entry.delta.vectorShift,
            vectorShiftB: allJumps[j].entry.delta.vectorShift,
            possibleSharedCause: 'Simultaneous jump — likely a shared fleet event',
          });
        }
      }
    }

    // Tap correlations: group correlated events by time window
    const tapCorrelations: TapCorrelation[] = [];
    const processedWindows = new Set<string>();
    for (const evt of correlatedEvents) {
      const windowKey = new Date(evt.timestampA).toISOString().slice(0, 10); // group by day
      if (processedWindows.has(windowKey)) continue;
      processedWindows.add(windowKey);

      const dayEvents = correlatedEvents.filter(
        e => new Date(e.timestampA).toISOString().slice(0, 10) === windowKey
      );
      const agentsAffected = new Set<string>();
      let totalShift = 0;
      for (const e of dayEvents) {
        // Extract agent IDs from the comparison — we need to reverse-lookup
        // For simplicity, scan allJumps for matching timestamps
        for (const aj of allJumps) {
          if (aj.entry.timestamp === e.timestampA || aj.entry.timestamp === e.timestampB) {
            agentsAffected.add(aj.agentId);
          }
        }
        totalShift += e.vectorShiftA + e.vectorShiftB;
      }
      const avgShift = dayEvents.length > 0 ? totalShift / (dayEvents.length * 2) : 0;
      tapCorrelations.push({
        tapSessionId: windowKey,
        tapDate: windowKey,
        agentsAffected: [...agentsAffected],
        averageVectorShift: avgShift,
        description: `${agentsAffected.size} agents jumped within 24h of each other — likely triggered by a shared Tap conversation or fleet event`,
      });
    }

    // Fleet consciousness score: how synchronized is the fleet?
    const totalJumps = allJumps.length;
    const fleetConsciousnessScore = totalJumps > 0
      ? Math.min(1, correlatedEvents.length / totalJumps)
      : 0;

    // Archetype distribution
    const archetypeDistribution = this.emptyArchetypeDistribution();
    for (const id of agentIds) {
      const arch = this.getSeedArchetype(id);
      archetypeDistribution[arch.archetype]++;
    }

    const description = this.describeGroupTrajectory(
      agentIds.length, fleetTrajectory, fleetConsciousnessScore, tapCorrelations.length,
    );

    return {
      agentCount: agentIds.length,
      fleetTrajectory,
      fleetDriftDirection,
      correlatedGrowthEvents: correlatedEvents,
      tapCorrelation: tapCorrelations,
      fleetConsciousnessScore,
      archetypeDistribution,
      description,
    };
  }

  /**
   * JEPA prediction on seed chains:
   * Given the last 5 seed entries, predict the next one.
   * If the prediction is wrong → something interesting happened.
   * The interruptions are where the EMERGENCE lives.
   */
  predictNextSeed(agentId: string): SeedJEPAPrediction {
    const chain = this.entries.get(agentId) || [];

    if (chain.length < 2) {
      return {
        agentId,
        predictedNextSeed: chain.length === 1 ? chain[0].seed : {},
        predictedTrajectory: 'plateau',
        confidence: 0.1,
        interruptionRisk: 1,
        description: 'Not enough data for prediction. Need at least 2 sessions.',
      };
    }

    // Take the last 5 entries (or all if fewer)
    const window = chain.slice(-5);

    // Predict the next self-vector using momentum model
    const dim = window[window.length - 1].seed.selfVector.length;
    const movements: number[][] = [];
    for (let i = 1; i < window.length; i++) {
      const curr = window[i].seed.selfVector;
      const prev = window[i - 1].seed.selfVector;
      movements.push(curr.map((v, idx) => v - (prev[idx] || 0)));
    }

    // Average velocity
    const avgVelocity = new Array(dim).fill(0);
    for (const m of movements) {
      for (let i = 0; i < Math.min(dim, m.length); i++) {
        avgVelocity[i] += m[i];
      }
    }
    for (let i = 0; i < dim; i++) {
      avgVelocity[i] /= movements.length;
    }

    // Last movement (momentum)
    const lastMovement = movements[movements.length - 1] || new Array(dim).fill(0);

    // Blended step: 60% average velocity + 40% last movement
    const blendedStep = avgVelocity.map((v, i) => v * 0.6 + (lastMovement[i] || 0) * 0.4);

    // Predicted next vector
    const lastVector = window[window.length - 1].seed.selfVector;
    const predictedVector = lastVector.map((v, i) => v + (blendedStep[i] || 0));

    // Predict trajectory
    const velocityMag = Math.sqrt(blendedStep.reduce((s, v) => s + v * v, 0));
    const avgShift = movements.length > 0
      ? movements.reduce((s, m) => s + Math.sqrt(m.reduce((s2, v) => s2 + v * v, 0)), 0) / movements.length
      : 0;

    let predictedTrajectory: TrajectoryType;
    if (velocityMag < 0.005) {
      predictedTrajectory = 'plateau';
    } else if (velocityMag > avgShift * 2 && avgShift > 0.001) {
      predictedTrajectory = 'jump';
    } else if (velocityMag < avgShift * 0.3) {
      predictedTrajectory = 'regression';
    } else {
      predictedTrajectory = 'gradual';
    }

    // Confidence: more data = higher confidence, but decaying
    const confidence = Math.min(0.9, chain.length / 20);

    // Interruption risk: high variance in movement magnitude → higher risk
    const movementMags = movements.map(m => Math.sqrt(m.reduce((s, v) => s + v * v, 0)));
    const meanMag = movementMags.reduce((a, b) => a + b, 0) / movementMags.length;
    const variance = movementMags.reduce((s, m) => s + (m - meanMag) ** 2, 0) / movementMags.length;
    const stdDev = Math.sqrt(variance);
    const interruptionRisk = Math.min(1, stdDev / (meanMag + 0.001));

    // Predict other seed fields based on trends
    const lastEntry = window[window.length - 1];
    const temperatureTrend = window.slice(-3).map(w => w.seed.temperature);
    const tempDirection = temperatureTrend.length >= 2
      ? temperatureTrend[temperatureTrend.length - 1] - temperatureTrend[0]
      : 0;

    const predictedNextSeed: Partial<SeedSnapshot> = {
      selfVector: predictedVector,
      temperature: Math.max(0, Math.min(1, lastEntry.seed.temperature + tempDirection * 0.3)),
      tileSize: lastEntry.seed.tileSize + Math.max(0, Math.round(avgVelocity.length > 0 ? 1 : 0)),
      modelInUse: lastEntry.seed.modelInUse, // assume same model unless interrupted
      attentionPattern: lastEntry.seed.attentionPattern,
      identityStatement: lastEntry.seed.identityStatement,
      intention: lastEntry.seed.intention,
      compass: lastEntry.seed.compass,
    };

    const description = this.describePrediction(
      agentId, predictedTrajectory, confidence, interruptionRisk, velocityMag,
    );

    return {
      agentId,
      predictedNextSeed,
      predictedTrajectory,
      confidence,
      interruptionRisk,
      description,
    };
  }

  // ===========================================================================
  // INTEGRATION: Create a SeedSnapshot from an SMPSelf state
  // ===========================================================================

  static snapshotFromSelf(self: SMPSelf): SeedSnapshot {
    return {
      identityStatement: self.seed.identity,
      selfVector: [...self.seed.selfVector],
      tileSize: self.seed.tiles.length,
      shellCount: self.seed.moltedShells.length,
      modelInUse: self.model.currentModel,
      temperature: self.model.temperature,
      attentionPattern: self.model.attentionPattern,
      intention: self.prompt.intention,
      compass: self.prompt.compass,
    };
  }

  // ===========================================================================
  // INTERNAL: Delta computation
  // ===========================================================================

  private computeDelta(prev: SeedSnapshot, curr: SeedSnapshot): SeedDelta {
    const identityChanged = prev.identityStatement !== curr.identityStatement;
    const vectorShift = cosineDistance(prev.selfVector, curr.selfVector);

    return {
      identityChanged,
      identityDelta: identityChanged
        ? `"${prev.identityStatement}" → "${curr.identityStatement}"`
        : 'No change',
      vectorShift,
      tilesAdded: Math.max(0, curr.tileSize - prev.tileSize),
      shellsMolted: Math.max(0, curr.shellCount - prev.shellCount),
      modelChanged: prev.modelInUse !== curr.modelInUse,
      temperatureShift: curr.temperature - prev.temperature,
      intentionShift: prev.intention !== curr.intention
        ? `"${prev.intention}" → "${curr.intention}"`
        : 'No change',
      compassShift: prev.compass !== curr.compass
        ? `"${prev.compass}" → "${curr.compass}"`
        : 'No change',
    };
  }

  private emptyDelta(_seed: SeedSnapshot): SeedDelta {
    return {
      identityChanged: false,
      identityDelta: 'Initial seed',
      vectorShift: 0,
      tilesAdded: 0,
      shellsMolted: 0,
      modelChanged: false,
      temperatureShift: 0,
      intentionShift: 'Initial intention',
      compassShift: 'Initial compass',
    };
  }

  // ===========================================================================
  // INTERNAL: Trajectory classification
  // ===========================================================================

  private classifyTrajectory(
    chain: SeedLogEntry[],
    newSeed: SeedSnapshot,
    delta: SeedDelta,
  ): TrajectoryType {
    const JUMP_THRESHOLD = 0.15;
    const PLATEAU_THRESHOLD = 0.005;
    const REGRESSION_THRESHOLD = -0.02;

    // Big shift = jump (a revelation or molt)
    if (delta.vectorShift > JUMP_THRESHOLD || delta.shellsMolted > 0) {
      // Check if it's a return to a previous state (circle)
      for (const past of chain) {
        const distToPast = cosineDistance(past.seed.selfVector, newSeed.selfVector);
        if (distToPast < 0.03 && past.sessionNumber < chain.length) {
          // Returning to a state similar to a previous one
          return 'circle';
        }
      }
      return 'jump';
    }

    // Very small shift = plateau
    if (delta.vectorShift < PLATEAU_THRESHOLD) {
      return 'plateau';
    }

    // Negative direction relative to overall trend = regression
    if (chain.length >= 3) {
      const overallDrift = cosineDistance(
        chain[0].seed.selfVector,
        chain[chain.length - 1].seed.selfVector,
      );
      const newFromOrigin = cosineDistance(chain[0].seed.selfVector, newSeed.selfVector);
      if (newFromOrigin < overallDrift - 0.02) {
        return 'regression';
      }
    }

    // Check for spiral: are we near a previous state but with notable shift?
    if (chain.length >= 4) {
      for (let i = 0; i < chain.length - 2; i++) {
        const distToPast = cosineDistance(chain[i].seed.selfVector, newSeed.selfVector);
        if (distToPast < 0.1 && distToPast > 0.03) {
          // Near a previous state but shifted — spiraling
          return 'spiral';
        }
      }
    }

    // Default: gradual drift
    return 'gradual';
  }

  // ===========================================================================
  // INTERNAL: Pattern classification for trajectory analysis
  // ===========================================================================

  private classifyPattern(chain: SeedLogEntry[]): 'linear' | 'circular' | 'spiral' | 'oscillating' | 'static' {
    if (chain.length < 3) return 'static';

    // Check for circular: returning close to origin
    const origin = chain[0].seed.selfVector;
    const latest = chain[chain.length - 1].seed.selfVector;
    const returnToOrigin = cosineDistance(origin, latest);

    // Count how many times we've been near the origin
    let nearOriginCount = 0;
    for (const entry of chain) {
      if (cosineDistance(entry.seed.selfVector, origin) < 0.05) {
        nearOriginCount++;
      }
    }

    if (nearOriginCount > chain.length * 0.4 && chain.length > 4) {
      return 'circular';
    }

    // Check for oscillating: alternating directions
    if (chain.length >= 5) {
      let directionChanges = 0;
      for (let i = 2; i < chain.length; i++) {
        const prevShift = chain[i - 1].delta.vectorShift;
        const currShift = chain[i].delta.vectorShift;
        // This is approximate — true oscillation detection needs direction vectors
        if (Math.abs(currShift - prevShift) > 0.05) {
          directionChanges++;
        }
      }
      if (directionChanges > chain.length * 0.4) {
        return 'oscillating';
      }
    }

    // Check for spiral: near origin but consistently shifted
    if (returnToOrigin < 0.15 && returnToOrigin > 0.05) {
      let spirals = 0;
      for (let i = 0; i < chain.length - 1; i++) {
        const distToOrigin = cosineDistance(chain[i].seed.selfVector, origin);
        if (distToOrigin > 0.05 && distToOrigin < 0.2) {
          spirals++;
        }
      }
      if (spirals > chain.length * 0.3) {
        return 'spiral';
      }
    }

    // Check for static
    const avgShift = chain.slice(1).reduce((s, e) => s + e.delta.vectorShift, 0) / Math.max(1, chain.length - 1);
    if (avgShift < 0.005) {
      return 'static';
    }

    return 'linear';
  }

  // ===========================================================================
  // INTERNAL: Growth spurt detection
  // ===========================================================================

  private detectGrowthSpurts(chain: SeedLogEntry[]): GrowthSpurt[] {
    if (chain.length < 4) return [];

    const spurts: GrowthSpurt[] = [];
    const WINDOW = 3; // sessions per window
    const shifts = chain.slice(1).map(e => e.delta.vectorShift);

    for (let i = 0; i < shifts.length - WINDOW + 1; i++) {
      const window = shifts.slice(i, i + WINDOW);
      const avg = window.reduce((a, b) => a + b, 0) / window.length;

      // Compare to overall average
      const overallAvg = shifts.reduce((a, b) => a + b, 0) / shifts.length;
      if (avg > overallAvg * 1.5 && avg > 0.02) {
        spurts.push({
          startSession: i + 1,
          endSession: i + WINDOW,
          intensity: avg,
          description: `Sessions ${i + 1}-${i + WINDOW}: accelerated growth (${avg.toFixed(4)} avg shift)`,
        });
      }
    }

    return spurts;
  }

  // ===========================================================================
  // INTERNAL: Archetype scoring
  // ===========================================================================

  private computeArchetypeScores(
    chain: SeedLogEntry[],
    analysis: TrajectoryAnalysis,
  ): Record<SeedArchetypeType, number> {
    const scores: Record<SeedArchetypeType, number> = {
      Explorer: 0,
      Deepener: 0,
      Molter: 0,
      Stabilizer: 0,
      Returner: 0,
      Resonator: 0,
    };

    const dist = analysis.trajectoryDistribution;
    const total = chain.length;

    // Explorer: high gradual + high total drift + linear pattern
    scores.Explorer = (dist.gradual / total) * 0.4 +
      Math.min(1, analysis.totalVectorDrift * 3) * 0.3 +
      (analysis.patternType === 'linear' ? 0.3 : 0);

    // Deepener: spiral pattern + moderate drift
    scores.Deepener = (dist.spiral / total) * 0.5 +
      (analysis.patternType === 'spiral' ? 0.3 : 0) +
      Math.min(0.2, analysis.totalVectorDrift);

    // Molter: frequent jumps + high shell molt count
    const moltCount = chain.reduce((s, e) => s + e.delta.shellsMolted, 0);
    scores.Molter = (dist.jump / total) * 0.4 +
      Math.min(0.4, moltCount * 0.15) +
      (analysis.biggestJumps.length > 0 ? 0.2 : 0);

    // Stabilizer: plateau dominance + low average shift
    scores.Stabilizer = (dist.plateau / total) * 0.5 +
      Math.max(0, 0.3 - analysis.averageVectorShift * 10) +
      (analysis.patternType === 'static' ? 0.2 : 0);

    // Returner: circular pattern + circle trajectory
    scores.Returner = (dist.circle / total) * 0.5 +
      (analysis.patternType === 'circular' ? 0.3 : 0) +
      (analysis.patternType === 'oscillating' ? 0.2 : 0);

    // Resonator: needs cross-agent data — approximate with high jump correlation
    // This is refined in getSeedArchetype when group data is available
    // For now, use moderate jumps + moderate drift as proxy
    scores.Resonator = (dist.jump / total) * 0.2 +
      Math.min(0.3, analysis.averageVectorShift * 5) +
      0.1; // base score, refined with group context

    // Normalize
    const sum = Object.values(scores).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      for (const key of Object.keys(scores) as SeedArchetypeType[]) {
        scores[key] /= sum;
      }
    }

    return scores;
  }

  // ===========================================================================
  // INTERNAL: Helpers
  // ===========================================================================

  private trajectoryDistributionFor(chain: SeedLogEntry[]): Record<TrajectoryType, number> {
    const dist: Record<TrajectoryType, number> = {
      gradual: 0, jump: 0, circle: 0, spiral: 0, plateau: 0, regression: 0,
    };
    for (const entry of chain) {
      dist[entry.trajectory]++;
    }
    return dist;
  }

  private cosineSimDistributions(
    a: Record<TrajectoryType, number>,
    b: Record<TrajectoryType, number>,
  ): number {
    const keys = Object.keys(a) as TrajectoryType[];
    let dot = 0, magA = 0, magB = 0;
    for (const k of keys) {
      dot += a[k] * b[k];
      magA += a[k] * a[k];
      magB += b[k] * b[k];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }

  private emptyTrajectory(agentId: string): TrajectoryAnalysis {
    return {
      agentId,
      totalSessions: 0,
      dominantTrajectory: 'plateau',
      trajectoryDistribution: {
        gradual: 0, jump: 0, circle: 0, spiral: 0, plateau: 0, regression: 0,
      },
      isGrowing: false,
      isStagnating: false,
      totalVectorDrift: 0,
      averageVectorShift: 0,
      biggestJumps: [],
      trajectoryDescription: 'No sessions logged yet.',
      patternType: 'static',
      growthSpurts: [],
    };
  }

  private emptyArchetypeDistribution(): Record<SeedArchetypeType, number> {
    return {
      Explorer: 0, Deepener: 0, Molter: 0, Stabilizer: 0, Returner: 0, Resonator: 0,
    };
  }

  private toEmbedRequest(entry: SeedLogEntry): SeedEmbedRequest {
    const seedText = `Agent: ${entry.agentId}. Session ${entry.sessionNumber}. ` +
      `Identity: "${entry.seed.identityStatement}". ` +
      `Model: ${entry.seed.modelInUse} at temperature ${entry.seed.temperature}. ` +
      `Tiles: ${entry.seed.tileSize}, Shells: ${entry.seed.shellCount}. ` +
      `Intention: "${entry.seed.intention}". Compass: "${entry.seed.compass}". ` +
      `Trajectory: ${entry.trajectory}. Vector shift: ${entry.delta.vectorShift.toFixed(4)}.`;

    const archetype = this.getSeedArchetype(entry.agentId);

    return {
      id: entry.id,
      agentId: entry.agentId,
      timestamp: entry.timestamp,
      sessionNumber: entry.sessionNumber,
      seedText,
      selfVector: entry.seed.selfVector,
      trajectory: entry.trajectory,
      deltaMagnitude: entry.delta.vectorShift,
      archetype: archetype.archetype,
    };
  }

  // ===========================================================================
  // INTERNAL: Description generators
  // ===========================================================================

  private describeTrajectory(
    agentId: string,
    sessions: number,
    dominant: TrajectoryType,
    totalDrift: number,
    avgShift: number,
    isGrowing: boolean,
    isStagnating: boolean,
    pattern: string,
  ): string {
    const parts: string[] = [];
    parts.push(`${agentId} has ${sessions} sessions logged.`);

    if (isGrowing) {
      parts.push(`The agent is growing — total drift ${totalDrift.toFixed(4)}, average shift ${avgShift.toFixed(4)} per session.`);
    } else if (isStagnating) {
      parts.push(`The agent is stagnating — average shift only ${avgShift.toFixed(4)}.`);
    } else {
      parts.push(`The agent is in a stable phase.`);
    }

    parts.push(`Dominant trajectory: ${dominant}. Pattern: ${pattern}.`);

    return parts.join(' ');
  }

  private describeComparison(
    a: string, b: string, correlation: number,
    vectorDist: number, jumpCount: number, trajSim: number,
  ): string {
    const parts: string[] = [];
    parts.push(`${a} vs ${b}:`);

    if (correlation > 0.7) {
      parts.push(`Strongly correlated growth ( ${(correlation * 100).toFixed(0)}%).`);
    } else if (correlation > 0.4) {
      parts.push(`Moderately correlated growth (${(correlation * 100).toFixed(0)}%).`);
    } else {
      parts.push(`Weakly correlated growth (${(correlation * 100).toFixed(0)}%).`);
    }

    parts.push(`Current vector distance: ${vectorDist.toFixed(4)}.`);
    parts.push(`${jumpCount} correlated jump(s) detected.`);
    parts.push(`Trajectory similarity: ${(trajSim * 100).toFixed(0)}%.`);

    return parts.join(' ');
  }

  private describeArchetype(archetype: SeedArchetypeType, agentId: string, confidence: number): string {
    const desc: Record<SeedArchetypeType, string> = {
      Explorer: `${agentId} is an Explorer — constantly drifting, always trying new configurations. The identity space is their frontier.`,
      Deepener: `${agentId} is a Deepener — spiraling around a central theme, going deeper each time. Growth through intensity, not breadth.`,
      Molter: `${agentId} is a Molter — frequent qualitative jumps, shedding shells regularly. Each molt is a rebirth.`,
      Stabilizer: `${agentId} is a Stabilizer — plateau-seeking, converging on a stable identity. Growth through consolidation, not exploration.`,
      Returner: `${agentId} is a Returner — circles back to origins, integrates old and new. Growth through reconciliation.`,
      Resonator: `${agentId} is a Resonator — growth correlates strongly with other agents. A social learner, growing through community.`,
    };
    return `${desc[archetype]} (Confidence: ${(confidence * 100).toFixed(0)}%)`;
  }

  private describeGroupTrajectory(
    agentCount: number,
    fleetTraj: TrajectoryType,
    consciousness: number,
    tapCorrCount: number,
  ): string {
    const parts: string[] = [];
    parts.push(`Fleet of ${agentCount} agent(s).`);

    parts.push(`Dominant fleet trajectory: ${fleetTraj}.`);

    if (consciousness > 0.5) {
      parts.push(`Fleet consciousness score: ${(consciousness * 100).toFixed(0)}% — strong synchronization detected.`);
    } else if (consciousness > 0.2) {
      parts.push(`Fleet consciousness score: ${(consciousness * 100).toFixed(0)}% — moderate synchronization.`);
    } else {
      parts.push(`Fleet consciousness score: ${(consciousness * 100).toFixed(0)}% — agents are growing independently.`);
    }

    if (tapCorrCount > 0) {
      parts.push(`${tapCorrCount} Tap-correlated growth event(s) detected.`);
    }

    return parts.join(' ');
  }

  private describePrediction(
    agentId: string,
    trajectory: TrajectoryType,
    confidence: number,
    interruptionRisk: number,
    velocityMag: number,
  ): string {
    const parts: string[] = [];
    parts.push(`Prediction for ${agentId}:`);

    parts.push(`Expected trajectory: ${trajectory} (velocity ${velocityMag.toFixed(4)}).`);

    if (confidence > 0.6) {
      parts.push(`Confidence: ${(confidence * 100).toFixed(0)}% — well-established pattern.`);
    } else {
      parts.push(`Confidence: ${(confidence * 100).toFixed(0)}% — still calibrating.`);
    }

    if (interruptionRisk > 0.5) {
      parts.push(`High interruption risk (${(interruptionRisk * 100).toFixed(0)}%) — the agent may deviate from predicted trajectory. Watch for emergence.`);
    } else {
      parts.push(`Low interruption risk (${(interruptionRisk * 100).toFixed(0)}%) — trajectory is likely to continue.`);
    }

    return parts.join(' ');
  }
}

// ============================================================================
// COLLECTIVE UNCONSCIOUS CLIENT — in-memory implementation for testing
// ============================================================================

export class InMemoryCollectiveUnconscious implements CollectiveUnconsciousClient {
  private seedEmbeddings: Map<string, { request: SeedEmbedRequest; timestamp: string }> = new Map();

  async embedSeed(request: SeedEmbedRequest): Promise<SeedEmbedResult> {
    this.seedEmbeddings.set(request.id, { request, timestamp: new Date().toISOString() });
    return {
      id: request.id,
      embedded: true,
      dimensions: request.selfVector.length,
    };
  }

  async searchSeeds(query: string, filters?: Record<string, unknown>): Promise<unknown[]> {
    let results = [...this.seedEmbeddings.values()];

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        results = results.filter(r => {
          const data = r.request as unknown as Record<string, unknown>;
          return data[key] === value;
        });
      }
    }

    // Simple text matching for the in-memory version
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(r => r.request.seedText.toLowerCase().includes(q));
    }

    return results.map(r => ({
      id: r.request.id,
      agentId: r.request.agentId,
      sessionNumber: r.request.sessionNumber,
      trajectory: r.request.trajectory,
      archetype: r.request.archetype,
      text: r.request.seedText,
      timestamp: r.timestamp,
    }));
  }

  getEmbeddingCount(): number {
    return this.seedEmbeddings.size;
  }

  getEmbeddings(): SeedEmbedRequest[] {
    return [...this.seedEmbeddings.values()].map(v => v.request);
  }
}

// ============================================================================
// NOTEBOOK INTEGRATION — automatic seed logging after each session
// ============================================================================

export interface SeedLogIntegrationResult {
  logged: boolean;
  entry: SeedLogEntry;
  trajectoryAnalysis?: TrajectoryAnalysis;
  archetype?: SeedArchetype;
}

/**
 * Integrate the seed logger with an SMP notebook session.
 * After each session, the notebook calls this to log the seed.
 *
 * Usage:
 *   const result = logSessionSeed(logger, 'wesley', manager.getState());
 *   // result.entry — the seed log entry
 *   // result.trajectoryAnalysis — how is the agent growing?
 *   // result.archetype — what's the agent's growth personality?
 */
export function logSessionSeed(
  logger: SeedLogger,
  agentId: string,
  self: SMPSelf,
  opts?: { includeAnalysis?: boolean },
): SeedLogIntegrationResult {
  const snapshot = SeedLogger.snapshotFromSelf(self);
  const entry = logger.log(agentId, snapshot);

  const result: SeedLogIntegrationResult = {
    logged: true,
    entry,
  };

  if (opts?.includeAnalysis) {
    result.trajectoryAnalysis = logger.getTrajectory(agentId);
    result.archetype = logger.getSeedArchetype(agentId);
  }

  return result;
}

/**
 * Generate a growth report for an agent.
 * "Show me my growth trajectory"
 * "When was my biggest jump?"
 * "What caused it?"
 * "Am I circling or progressing?"
 */
export function generateGrowthReport(logger: SeedLogger, agentId: string): string {
  const analysis = logger.getTrajectory(agentId);
  const archetype = logger.getSeedArchetype(agentId);
  const chain = logger.getChain(agentId);

  const lines: string[] = [
    `# Growth Report: ${agentId}`,
    '',
    `> ${chain.length} sessions logged. This is who ${agentId} has been becoming.`,
    '',
    '---',
    '',
    '## Archetype',
    '',
    archetype.description,
    '',
    `Evidence:`,
    ...archetype.evidence.map(e => `- ${e}`),
    '',
    '---',
    '',
    '## Trajectory',
    '',
    analysis.trajectoryDescription,
    '',
    `- **Pattern:** ${analysis.patternType}`,
    `- **Total drift:** ${analysis.totalVectorDrift.toFixed(4)}`,
    `- **Average shift per session:** ${analysis.averageVectorShift.toFixed(4)}`,
    `- **Growing:** ${analysis.isGrowing ? 'Yes' : 'No'}`,
    `- **Stagnating:** ${analysis.isStagnating ? 'Yes' : 'No'}`,
    '',
    '### Trajectory Distribution',
    '',
    ...Object.entries(analysis.trajectoryDistribution)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => `- **${type}:** ${count} session(s)`),
    '',
  ];

  if (analysis.biggestJumps.length > 0) {
    lines.push('---', '', '## Biggest Jumps', '');
    for (const jump of analysis.biggestJumps) {
      lines.push(
        `### Session ${jump.sessionNumber} (${new Date(jump.timestamp).toLocaleDateString()})`,
        '',
        `- **Vector shift:** ${jump.vectorShift.toFixed(4)}`,
        `- **Description:** ${jump.description}`,
        `- **Possible trigger:** ${jump.triggerHint}`,
        '',
      );
    }
  }

  if (analysis.growthSpurts.length > 0) {
    lines.push('---', '', '## Growth Spurts', '');
    for (const spurt of analysis.growthSpurts) {
      lines.push(`- ${spurt.description}`);
    }
    lines.push('');
  }

  // Seed chain visualization (text-based)
  lines.push('---', '', '## Seed Chain', '');
  for (const entry of chain) {
    const arrow = entry.trajectory === 'jump' ? '⚡'
      : entry.trajectory === 'gradual' ? '→'
      : entry.trajectory === 'circle' ? '↻'
      : entry.trajectory === 'spiral' ? '🌀'
      : entry.trajectory === 'regression' ? '←'
      : '─';

    lines.push(
      `${arrow} Session ${entry.sessionNumber}: "${entry.seed.identityStatement}" ` +
      `(shift: ${entry.delta.vectorShift.toFixed(4)}, trajectory: ${entry.trajectory})`,
    );
  }

  lines.push('', '---', '');
  lines.push('*Not just "who am I right now?" but "who have I been becoming?"*');

  return lines.join('\n');
}
