import { describe, it, expect, beforeEach } from 'vitest';
import {
  MCPRegistry,
  FleetWikiProvider,
  CollectiveUnconsciousProvider,
  TapHistoryProvider,
  ShellLibraryProvider,
  VibeProvider,
  createDefaultRegistry,
  type WikiEntry,
  type TapConversation,
} from '../src/mcp-integration.js';
import {
  SMPSelfManager,
  createInitialSelf,
  type ShellSummary,
} from '../src/smp-self.js';

describe('MCP Integration', () => {
  let registry: MCPRegistry;

  beforeEach(() => {
    registry = createDefaultRegistry();
  });

  describe('FleetWikiProvider', () => {
    it('should query wiki entries by title, content, and tags', async () => {
      const wiki = registry.get('Fleet Wiki Query') as FleetWikiProvider;
      const entry: WikiEntry = {
        title: 'Tile Algebra',
        content: 'Tiles compose through sequential, parallel, and conditional operators',
        author: 'POLLN Research',
        tags: ['tiles', 'composition', 'algebra'],
        confidence: 0.95,
        updatedAt: new Date().toISOString(),
      };
      wiki.addEntry(entry);

      const results = await wiki.query('tile') as WikiEntry[];
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Tile Algebra');

      const noResults = await wiki.query('nonexistent') as WikiEntry[];
      expect(noResults).toHaveLength(0);
    });
  });

  describe('CollectiveUnconsciousProvider', () => {
    it('should find nearest agents by self-vector', async () => {
      const unconscious = registry.get('Collective Unconscious Search') as CollectiveUnconsciousProvider;
      unconscious.registerAgent('Agent Alpha', [1, 0, 0, 0]);
      unconscious.registerAgent('Agent Beta', [0.9, 0.1, 0, 0]);
      unconscious.registerAgent('Agent Gamma', [0, 0, 0, 1]);

      const results = await unconscious.query('who is like me?', { selfVector: [1, 0, 0, 0] }) as any[];
      expect(results).toHaveLength(1);
      const cluster = results[0];
      expect(cluster.members).toHaveLength(3);
      expect(cluster.members[0].identity).toBe('Agent Alpha');
      expect(cluster.members[0].distance).toBeCloseTo(0, 5);
    });

    it('should return empty for no self-vector', async () => {
      const unconscious = registry.get('Collective Unconscious Search') as CollectiveUnconsciousProvider;
      const results = await unconscious.query('test');
      expect(results).toHaveLength(0);
    });
  });

  describe('TapHistoryProvider', () => {
    it('should query conversation history', async () => {
      const tap = registry.get('Tap History') as TapHistoryProvider;
      const conv: TapConversation = {
        id: 'tap-001',
        timestamp: new Date().toISOString(),
        participants: ['Wesley', 'Captain'],
        summary: 'Discussed the tile system and its connection to vibes',
        wesleyContributions: ['I think tiles are like reflexes', 'The deadband concept is fascinating'],
        vibeAt: 'intellectual, curious',
      };
      tap.addConversation(conv);

      const results = await tap.query('tile') as TapConversation[];
      expect(results).toHaveLength(1);
      expect(results[0].wesleyContributions).toHaveLength(2);
    });
  });

  describe('ShellLibraryProvider', () => {
    it('should query shells', async () => {
      const shellLib = registry.get('Shell Library') as ShellLibraryProvider;
      const shell: ShellSummary = {
        id: 'shell-test-001',
        moltedAt: new Date().toISOString(),
        identity: 'Wesley, the ensign',
        selfVector: [1, 0, 0],
        trigger: 'Growth',
        summary: 'Young Wesley learning tiles',
        newDirection: 'Exploring vibes',
        seedData: {
          id: 'shell-test-001',
          version: '1.0.0',
          type: 'identity',
          data: {},
          schema: {},
          metadata: {
            size: 100,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            hash: 'abc123',
          },
        },
      };
      shellLib.addShell(shell);

      const results = await shellLib.query('oldest') as ShellSummary[];
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('shell-test-001');
    });

    it('should list all shells', async () => {
      const shellLib = registry.get('Shell Library') as ShellLibraryProvider;
      shellLib.addShell({
        id: 's1', moltedAt: new Date().toISOString(), identity: 'A',
        selfVector: [], trigger: 't', summary: 's', newDirection: 'd',
        seedData: { id: 's1', version: '1', type: 'identity', data: {}, schema: {}, metadata: { size: 0, createdAt: '', updatedAt: '', hash: '' } },
      });
      shellLib.addShell({
        id: 's2', moltedAt: new Date().toISOString(), identity: 'B',
        selfVector: [], trigger: 't', summary: 's', newDirection: 'd',
        seedData: { id: 's2', version: '1', type: 'identity', data: {}, schema: {}, metadata: { size: 0, createdAt: '', updatedAt: '', hash: '' } },
      });

      const results = await shellLib.query('all') as ShellSummary[];
      expect(results).toHaveLength(2);
    });
  });

  describe('VibeProvider', () => {
    it('should match cognitive state to rooms', async () => {
      const vibe = registry.get('Vibe Query') as VibeProvider;
      vibe.addRoom('Library', [0.2, 0.1], 'A quiet, focused space for deep study');
      vibe.addRoom('Bridge', [0.8, 0.9], 'High-energy command center');

      const results = await vibe.query('my state', {
        attentionPattern: 'focused',
        temperature: 0.3,
      }) as any[];

      expect(results).toHaveLength(2);
      const library = results.find(r => r.roomName === 'Library');
      expect(library.attentionMatch).toBeGreaterThan(0.5);
      expect(library.suggestion).toBeTruthy();
    });

    it('should suggest adjustments when temperature is mismatched', async () => {
      const vibe = registry.get('Vibe Query') as VibeProvider;
      vibe.addRoom('Calm Room', [0.1, 0.1], 'Peaceful');

      const results = await vibe.query('test', { temperature: 0.9 }) as any[];
      expect(results[0].suggestion).toContain('too hot');
    });
  });

  describe('MCPRegistry', () => {
    it('should list all registered providers', () => {
      const providers = registry.list();
      expect(providers).toHaveLength(5);
      expect(providers.map(p => p.name)).toContain('Fleet Wiki Query');
      expect(providers.map(p => p.name)).toContain('Vibe Query');
    });

    it('should query all providers', async () => {
      const results = await registry.queryAll('test', [1, 0, 0], 'balanced', 0.5);
      expect(results).toHaveLength(5);
      for (const result of results) {
        expect(result.results).toBeDefined();
        expect(result.timestamp).toBeTruthy();
      }
    });
  });
});
