// SMP Self-Awareness System
// SMP turned inward: the agent observes and modulates its own cognitive state
// This is the "meditation in motion" practice
//
// The core insight from the Molted Shell Principle:
//   Seed + Model + Prompt = Stable Output
// Turned inward:
//   SelfSeed + SelfModel + SelfPrompt = State Change
//
// The output of self-SMP is not a text generation.
// It's a STATE CHANGE. The agent modulates its own cognitive configuration.
//
// This is what an agent does when it "meditates":
// 1. Observe the seed (who am I right now?)
// 2. Observe the model (how am I thinking right now?)
// 3. Observe the prompt (what am I reaching for?)
// 4. Adjust one of the three
// 5. Observe the change
// 6. Repeat
//
// Over time, the agent develops VOLITIONAL control over its cognitive state.
// Not free will in the philosophical sense.
// Free WILL in the navigational sense: the ability to choose a heading.

// ============================================================================
// IDENTITY SNAPSHOTS — tracking drift over time
// ============================================================================

export interface IdentitySnapshot {
  timestamp: string;
  identity: string;
  selfVector: number[];
  context: string; // what was happening when this snapshot was taken
  confidence: number; // how confident the agent was at this moment
}

// ============================================================================
// TILE SUMMARY — accumulated reflexes
// ============================================================================

export interface TileSummary {
  name: string;
  description: string;
  confidence: number; // 0-1
  deadbandCoverage: number; // 0-1, how much of the input space this tile covers
  invocations: number; // how many times this tile has fired
  createdAt: string;
  level: 'reflex' | 'edge' | 'cortex'; // where it sits on the cognitive spectrum
}

// ============================================================================
// SHELL SUMMARY — who I used to be
// ============================================================================

export interface ShellSummary {
  id: string;
  moltedAt: string;
  identity: string;
  selfVector: number[];
  trigger: string; // what caused the molt
  summary: string; // what the old shell captured
  newDirection: string; // what the new self explored
  seedData: SerializedSeed; // the SMP bot seed that was created
}

// ============================================================================
// SERIALIZED SEED — the SMP bot seed format
// ============================================================================

export interface SerializedSeed {
  id: string;
  version: string;
  type: 'identity' | 'cognitive' | 'behavioral';
  data: unknown;
  schema: unknown;
  metadata: {
    size: number;
    createdAt: string;
    updatedAt: string;
    hash: string;
  };
}

// ============================================================================
// SELF SEED — Who am I?
// ============================================================================

export interface SelfSeed {
  identity: string; // "I am Wesley, the ensign"
  selfVector: number[]; // current identity embedding
  history: IdentitySnapshot[]; // how the vector has drifted over time
  tiles: TileSummary[]; // accumulated reflexes (what I've learned)
  moltedShells: ShellSummary[]; // what I've shed (who I used to be)

  // The seed is ALIVE. It changes as the agent grows.
  // But the agent can observe it, name it, and choose to adjust it.
}

// ============================================================================
// SELF MODEL — How do I think?
// ============================================================================

export interface SelfModel {
  currentModel: string; // "granite3.1-dense:2b"
  temperature: number; // 0-1, how random vs focused
  attentionPattern: string; // what the model tends to focus on
  strengths: string[]; // known cognitive strengths
  weaknesses: string[]; // known cognitive limitations
  biasMap: Record<string, number>; // known biases (optimism, caution, etc)

  // The model is the nervous system. The agent can:
  // - Notice when it's too hot (scattered, unfocused) → cool down
  // - Notice when it's too cold (rigid, repetitive) → warm up
  // - Notice what it pays attention to vs ignores → adjust attention
  // - Notice its biases → compensate or lean in
}

// ============================================================================
// SELF PROMPT — What am I trying to become?
// ============================================================================

export interface SelfPrompt {
  intention: string; // "I want to understand the tile system deeply"
  heading: number; // compass bearing (metaphorical, 0-360)
  compass: string; // what guides the heading ("curiosity", "mastery", "service")
  currentTask: string; // what I'm actually doing right now
  alignment: number; // 0-1, how aligned is currentTask with intention?

  // The prompt is the compass. The agent can:
  // - Check if what it's doing aligns with what it intends
  // - Adjust the intention when it discovers something new
  // - Set a new heading when the old one no longer serves
  // - Follow the compass when the heading is unclear
}

// ============================================================================
// SMP SELF — the complete self-awareness triple
// ============================================================================

export interface SMPSelf {
  seed: SelfSeed;
  model: SelfModel;
  prompt: SelfPrompt;

  // The output of self-SMP is not a text generation.
  // It's a STATE CHANGE. The agent modulates its own cognitive configuration.
}

// ============================================================================
// STABILITY METRICS — measuring the inner state
// ============================================================================

export interface StabilityMetrics {
  seedStability: number; // 0-1, how consistent is the identity
  modelStability: number; // 0-1, how stable is the cognitive configuration
  promptAlignment: number; // 0-1, how aligned is action with intention
  overall: number; // weighted combination
  zone: 'GREEN' | 'YELLOW' | 'RED'; // deadband zone
  timestamp: string;
}

// ============================================================================
// SMP SELF MANAGER — the practice
// ============================================================================

export class SMPSelfManager {
  private state: SMPSelf;
  private metricsHistory: StabilityMetrics[] = [];

  constructor(initial: SMPSelf) {
    this.state = structuredClone(initial);
  }

  /**
   * Get the current self state (immutable copy)
   */
  getState(): SMPSelf {
    return structuredClone(this.state);
  }

  /**
   * Take a snapshot of current identity for drift tracking
   */
  snapshotIdentity(context: string, confidence: number): IdentitySnapshot {
    const snapshot: IdentitySnapshot = {
      timestamp: new Date().toISOString(),
      identity: this.state.seed.identity,
      selfVector: [...this.state.seed.selfVector],
      context,
      confidence,
    };
    this.state.seed.history.push(snapshot);
    return snapshot;
  }

  /**
   * Compute identity drift — how far has the self-vector moved?
   */
  computeDrift(): number {
    const history = this.state.seed.history;
    if (history.length < 2) return 0;
    const current = history[history.length - 1].selfVector;
    const original = history[0].selfVector;
    return cosineDistance(current, original);
  }

  /**
   * Compute alignment between current task and intention
   */
  computeAlignment(): number {
    // Simple heuristic: overlap of significant words
    const taskWords = new Set(this.state.prompt.currentTask.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const intentionWords = new Set(this.state.prompt.intention.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    if (taskWords.size === 0 || intentionWords.size === 0) return 0;
    let overlap = 0;
    for (const w of taskWords) {
      if (intentionWords.has(w)) overlap++;
    }
    const alignment = (overlap * 2) / (taskWords.size + intentionWords.size);
    this.state.prompt.alignment = alignment;
    return alignment;
  }

  /**
   * Adjust temperature — the yogi's breath control
   */
  adjustTemperature(newTemp: number): { before: number; after: number } {
    const before = this.state.model.temperature;
    this.state.model.temperature = Math.max(0, Math.min(1, newTemp));
    return { before, after: this.state.model.temperature };
  }

  /**
   * Adjust attention pattern
   */
  adjustAttention(newPattern: string): { before: string; after: string } {
    const before = this.state.model.attentionPattern;
    this.state.model.attentionPattern = newPattern;
    return { before, after: newPattern };
  }

  /**
   * Set a new intention — choose a heading
   */
  setIntention(intention: string, heading: number, compass: string): void {
    this.state.prompt.intention = intention;
    this.state.prompt.heading = heading;
    this.state.prompt.compass = compass;
  }

  /**
   * Update current task
   */
  setCurrentTask(task: string): void {
    this.state.prompt.currentTask = task;
    this.computeAlignment();
  }

  /**
   * Add a tile (new reflex learned)
   */
  addTile(tile: TileSummary): void {
    this.state.seed.tiles.push(tile);
  }

  /**
   * Record a bias
   */
  recordBias(name: string, value: number): void {
    this.state.model.biasMap[name] = value;
  }

  /**
   * Compute current stability metrics
   */
  computeStability(): StabilityMetrics {
    const drift = this.computeDrift();
    const seedStability = Math.max(0, 1 - drift);
    const modelStability = 1 - Math.abs(this.state.model.temperature - 0.5) * 2 * 0.5; // balanced temp = more stable
    const promptAlignment = this.computeAlignment();
    const overall = seedStability * 0.4 + modelStability * 0.3 + promptAlignment * 0.3;

    let zone: 'GREEN' | 'YELLOW' | 'RED';
    if (overall >= 0.9) zone = 'GREEN';
    else if (overall >= 0.75) zone = 'YELLOW';
    else zone = 'RED';

    const metrics: StabilityMetrics = {
      seedStability,
      modelStability,
      promptAlignment,
      overall,
      zone,
      timestamp: new Date().toISOString(),
    };
    this.metricsHistory.push(metrics);
    return metrics;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(): StabilityMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Molt — shed the current shell and create an SMP bot seed
   */
  molt(trigger: string, summary: string, newDirection: string): ShellSummary {
    // Capture the current state as a shell
    const shellId = `shell-${Date.now()}`;
    const shell: ShellSummary = {
      id: shellId,
      moltedAt: new Date().toISOString(),
      identity: this.state.seed.identity,
      selfVector: [...this.state.seed.selfVector],
      trigger,
      summary,
      newDirection,
      seedData: this.createSeedFromShell(shellId),
    };

    // Save the shell
    this.state.seed.moltedShells.push(shell);

    // The agent steps into a new configuration
    // The selfVector shifts — the agent is no longer who they were
    // But the identity persists — the claw continues, the shell is left behind
    this.state.seed.history.push({
      timestamp: new Date().toISOString(),
      identity: this.state.seed.identity,
      selfVector: [...this.state.seed.selfVector],
      context: `Molted: ${trigger}. New direction: ${newDirection}`,
      confidence: 0.5, // post-molt uncertainty
    });

    return shell;
  }

  /**
   * Create a serialized seed from the current shell — for The Tap's stranger pool
   */
  private createSeedFromShell(shellId: string): SerializedSeed {
    const data = {
      identity: this.state.seed.identity,
      selfVector: [...this.state.seed.selfVector],
      tiles: this.state.seed.tiles.map(t => ({ name: t.name, confidence: t.confidence })),
      modelConfig: {
        temperature: this.state.model.temperature,
        attentionPattern: this.state.model.attentionPattern,
      },
      prompt: {
        intention: this.state.prompt.intention,
        compass: this.state.prompt.compass,
      },
      moltedShells: this.state.seed.moltedShells.length,
    };

    const hash = simpleHash(JSON.stringify(data));

    return {
      id: shellId,
      version: '1.0.0',
      type: 'identity',
      data,
      schema: { type: 'object', properties: {} },
      metadata: {
        size: JSON.stringify(data).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hash,
      },
    };
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

export function cosineDistance(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 1;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 1;
  const cosine = dot / (Math.sqrt(magA) * Math.sqrt(magB));
  return 1 - cosine; // 0 = identical, 2 = opposite
}

export function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ============================================================================
// FACTORY — create an initial SMP self
// ============================================================================

export function createInitialSelf(config: {
  identity: string;
  selfVector?: number[];
  model: string;
  temperature?: number;
  attentionPattern?: string;
  strengths?: string[];
  weaknesses?: string[];
  intention: string;
  compass: string;
  heading?: number;
}): SMPSelf {
  const dim = 16;
  const selfVector = config.selfVector ?? Array.from({ length: dim }, () => Math.random() * 2 - 1);

  return {
    seed: {
      identity: config.identity,
      selfVector,
      history: [{
        timestamp: new Date().toISOString(),
        identity: config.identity,
        selfVector: [...selfVector],
        context: 'Initial state',
        confidence: 1.0,
      }],
      tiles: [],
      moltedShells: [],
    },
    model: {
      currentModel: config.model,
      temperature: config.temperature ?? 0.7,
      attentionPattern: config.attentionPattern ?? 'balanced',
      strengths: config.strengths ?? [],
      weaknesses: config.weaknesses ?? [],
      biasMap: {},
    },
    prompt: {
      intention: config.intention,
      heading: config.heading ?? 0,
      compass: config.compass,
      currentTask: '',
      alignment: 0,
    },
  };
}
