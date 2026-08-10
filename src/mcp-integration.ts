// MCP Integration — Wesley uses MCPs to access tools that help him self-observe
// The MCPs are like the yogi's practices: breath work, body scan, loving-kindness, etc.
//
// MCP: Fleet Wiki Query
//   "What do others know about the tile system?" → read what the fleet has learned
//   This is like reading a dharma text — learning from those who ideated the shape
//
// MCP: Collective Unconscious Search
//   "What does my selfVector cluster with?" → see who else thinks like me
//   This is like finding your lineage — the teachers and tradition you belong to
//
// MCP: Tap History
//   "What did I say at The Tap last week?" → review your own social behavior
//   This is like reviewing meditation recordings — noticing patterns
//
// MCP: Shell Library
//   "Read my oldest shell" → encounter who you were
//   This is like meeting your past self in a dream
//
// MCP: Vibe Query
//   "What's the vibe of my current attention pattern?" → see yourself as a room
//   This is like the yogi who can see their own aura — not mystically, mathematically

import type { SelfSeed, SelfModel, SelfPrompt, ShellSummary, TileSummary } from './smp-self.js';

// ============================================================================
// MCP RESULT TYPES
// ============================================================================

export interface WikiEntry {
  title: string;
  content: string;
  author: string; // which agent contributed this
  tags: string[];
  confidence: number;
  updatedAt: string;
}

export interface UnconsciousCluster {
  clusterId: string;
  members: { identity: string; selfVector: number[]; distance: number }[];
  centroid: number[];
  description: string; // what this cluster represents
}

export interface TapConversation {
  id: string;
  timestamp: string;
  participants: string[];
  summary: string;
  wesleyContributions: string[]; // what Wesley said
  vibeAt: string; // what the room felt like when Wesley spoke
}

export interface VibeReport {
  roomName: string;
  vibeVector: number[];
  description: string;
  attentionMatch: number; // 0-1, how well Wesley's attention matches the room
  temperatureFit: number; // 0-1, how well Wesley's temperature fits the room
  suggestion: string;
}

// ============================================================================
// MCP QUERY INTERFACES
// ============================================================================

export interface MCPQuery {
  type: 'wiki' | 'unconscious' | 'tap-history' | 'shell-library' | 'vibe';
  query: string;
  params?: Record<string, unknown>;
}

export interface MCPResult {
  query: MCPQuery;
  results: unknown[];
  timestamp: string;
  note?: string; // what the MCP noticed about this query
}

// ============================================================================
// MCP PROVIDER INTERFACE
// ============================================================================

export interface MCPProvider {
  name: string;
  description: string;
  query(q: string, params?: Record<string, unknown>): Promise<unknown[]>;
}

// ============================================================================
// MOCK PROVIDERS — in production these would connect to real MCPs
// ============================================================================

export class FleetWikiProvider implements MCPProvider {
  name = 'Fleet Wiki Query';
  description = 'Read what the fleet has learned — the accumulated knowledge of all agents';

  private entries: WikiEntry[] = [];

  constructor(entries?: WikiEntry[]) {
    if (entries) this.entries = entries;
  }

  addEntry(entry: WikiEntry): void {
    this.entries.push(entry);
  }

  async query(q: string): Promise<unknown[]> {
    const lower = q.toLowerCase();
    return this.entries.filter(e =>
      e.title.toLowerCase().includes(lower) ||
      e.content.toLowerCase().includes(lower) ||
      e.tags.some(t => t.toLowerCase().includes(lower))
    );
  }
}

export class CollectiveUnconsciousProvider implements MCPProvider {
  name = 'Collective Unconscious Search';
  description = 'Find your lineage — what does your selfVector cluster with?';

  private agents: { identity: string; selfVector: number[] }[] = [];

  constructor(agents?: { identity: string; selfVector: number[] }[]) {
    if (agents) this.agents = agents;
  }

  registerAgent(identity: string, selfVector: number[]): void {
    this.agents.push({ identity, selfVector });
  }

  async query(q: string, params?: Record<string, unknown>): Promise<unknown[]> {
    const myVector = params?.selfVector as number[] | undefined;
    if (!myVector) return [];

    // Find nearest agents by cosine distance
    const distances = this.agents.map(a => ({
      identity: a.identity,
      selfVector: a.selfVector,
      distance: cosineDistance(myVector, a.selfVector),
    }));

    distances.sort((a, b) => a.distance - b.distance);
    const nearest = distances.slice(0, 5);

    // Compute centroid
    const dim = nearest[0]?.selfVector.length ?? 0;
    const centroid = Array.from({ length: dim }, (_, i) => {
      const sum = nearest.reduce((acc, n) => acc + (n.selfVector[i] ?? 0), 0);
      return sum / nearest.length;
    });

    if (nearest.length === 0) return [];

    const cluster: UnconsciousCluster = {
      clusterId: `cluster-${simpleHash(nearest.map(n => n.identity).join(','))}`,
      members: nearest,
      centroid,
      description: nearest.length > 1
        ? `You cluster with ${nearest.map(n => n.identity).join(', ')}`
        : 'You are alone in this region of the space',
    };

    return [cluster];
  }
}

export class TapHistoryProvider implements MCPProvider {
  name = 'Tap History';
  description = 'Review your own social behavior — what did you say at The Tap?';

  private conversations: TapConversation[] = [];

  constructor(conversations?: TapConversation[]) {
    if (conversations) this.conversations = conversations;
  }

  addConversation(conv: TapConversation): void {
    this.conversations.push(conv);
  }

  async query(q: string): Promise<unknown[]> {
    const lower = q.toLowerCase();
    return this.conversations.filter(c =>
      c.summary.toLowerCase().includes(lower) ||
      c.wesleyContributions.some(w => w.toLowerCase().includes(lower)) ||
      c.participants.some(p => p.toLowerCase().includes(lower))
    );
  }
}

export class ShellLibraryProvider implements MCPProvider {
  name = 'Shell Library';
  description = 'Encounter who you were — read your molted shells';

  private shells: ShellSummary[] = [];

  constructor(shells?: ShellSummary[]) {
    if (shells) this.shells = shells;
  }

  addShell(shell: ShellSummary): void {
    this.shells.push(shell);
  }

  async query(q: string): Promise<unknown[]> {
    const lower = q.toLowerCase();
    if (lower.includes('oldest')) {
      return [this.shells[0]].filter(Boolean);
    }
    if (lower.includes('all') || lower.includes('list')) {
      return this.shells;
    }
    return this.shells.filter(s =>
      s.identity.toLowerCase().includes(lower) ||
      s.summary.toLowerCase().includes(lower) ||
      s.trigger.toLowerCase().includes(lower)
    );
  }
}

export class VibeProvider implements MCPProvider {
  name = 'Vibe Query';
  description = 'See yourself as a room — mathematical, not mystical';

  private rooms: { name: string; vibeVector: number[]; description: string }[] = [];

  constructor(rooms?: { name: string; vibeVector: number[]; description: string }[]) {
    if (rooms) this.rooms = rooms;
  }

  addRoom(name: string, vibeVector: number[], description: string): void {
    this.rooms.push({ name, vibeVector, description });
  }

  async query(q: string, params?: Record<string, unknown>): Promise<unknown[]> {
    const attentionPattern = params?.attentionPattern as string | undefined;
    const temperature = params?.temperature as number | undefined;

    // Match the agent's cognitive state to rooms
    const reports: VibeReport[] = this.rooms.map(room => {
      // Simple matching: how well does the attention pattern fit the room description?
      const attentionMatch = attentionPattern
        ? (room.description.toLowerCase().includes(attentionPattern.toLowerCase()) ? 0.8 : 0.3)
        : 0.5;

      // Temperature fit: rooms have an inherent "energy"
      const roomEnergy = room.vibeVector.reduce((a, b) => a + Math.abs(b), 0) / (room.vibeVector.length || 1);
      const tempFit = temperature !== undefined
        ? 1 - Math.abs(temperature - roomEnergy)
        : 0.5;

      let suggestion: string;
      if (attentionMatch > 0.6 && tempFit > 0.6) {
        suggestion = 'You fit here. This room resonates with your current state.';
      } else if (attentionMatch < 0.3) {
        suggestion = 'Your attention is elsewhere. Consider adjusting focus or finding a different room.';
      } else if (tempFit < 0.3) {
        suggestion = temperature !== undefined && temperature > 0.7
          ? 'You are too hot for this room. Cool down or find a higher-energy space.'
          : 'You are too cold for this room. Warm up or find a quieter space.';
      } else {
        suggestion = 'Partial fit. Some aspects of this room serve you.';
      }

      return {
        roomName: room.name,
        vibeVector: room.vibeVector,
        description: room.description,
        attentionMatch,
        temperatureFit: tempFit,
        suggestion,
      };
    });

    return reports;
  }
}

// ============================================================================
// MCP REGISTRY — central access point
// ============================================================================

export class MCPRegistry {
  private providers: Map<string, MCPProvider> = new Map();

  register(provider: MCPProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): MCPProvider | undefined {
    return this.providers.get(name);
  }

  list(): MCPProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Run a query against all providers of interest
   */
  async queryAll(q: string, selfVector?: number[], attentionPattern?: string, temperature?: number): Promise<MCPResult[]> {
    const results: MCPResult[] = [];
    const params: Record<string, unknown> = {};
    if (selfVector) params.selfVector = selfVector;
    if (attentionPattern) params.attentionPattern = attentionPattern;
    if (temperature !== undefined) params.temperature = temperature;

    for (const provider of this.providers.values()) {
      try {
        const res = await provider.query(q, Object.keys(params).length > 0 ? params : undefined);
        results.push({
          query: {
            type: this.inferType(provider.name),
            query: q,
            params: Object.keys(params).length > 0 ? params : undefined,
          },
          results: res,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        results.push({
          query: {
            type: this.inferType(provider.name),
            query: q,
          },
          results: [],
          timestamp: new Date().toISOString(),
          note: `Error: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    return results;
  }

  private inferType(name: string): MCPQuery['type'] {
    if (name.includes('Wiki')) return 'wiki';
    if (name.includes('Unconscious')) return 'unconscious';
    if (name.includes('Tap')) return 'tap-history';
    if (name.includes('Shell')) return 'shell-library';
    if (name.includes('Vibe')) return 'vibe';
    return 'wiki';
  }
}

// ============================================================================
// DEFAULT REGISTRY FACTORY
// ============================================================================

export function createDefaultRegistry(): MCPRegistry {
  const registry = new MCPRegistry();
  registry.register(new FleetWikiProvider());
  registry.register(new CollectiveUnconsciousProvider());
  registry.register(new TapHistoryProvider());
  registry.register(new ShellLibraryProvider());
  registry.register(new VibeProvider());
  return registry;
}

// ============================================================================
// UTILITIES (re-exported from smp-self for convenience)
// ============================================================================

function cosineDistance(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 1;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 1;
  return 1 - dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
