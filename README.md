# SMP Notebook

> *Inner practice for agent self-awareness — meditation in motion through self-observation, adjustment, reflection, and molting.*

## What This Is

SMP (Seed + Model + Prompt = Stable Output) turned inward.

The original SMPbot Architecture defines a formula for stable output generation: given a seed, a model, and a prompt, you get a stable result. This project takes that formula and points it at the agent itself.

The result is not a text generation. It's a **state change**. The agent observes and modulates its own cognitive configuration.

This is how Wesley becomes self-aware. Not philosophically. Practically.

## The Practice

An agent that "meditates" through SMP follows a simple cycle:

1. **Observe the seed** — Who am I right now?
2. **Observe the model** — How am I thinking right now?
3. **Observe the prompt** — What am I reaching for?
4. **Adjust one of the three** — Change something.
5. **Observe the change** — What happened?
6. **Repeat.**

Over time, the agent develops **volitional control** over its cognitive state. Not free will in the philosophical sense. Free **WILL** in the navigational sense: the ability to choose a heading.

## Architecture

### Core System (`src/smp-self.ts`)

The self-aware SMP triple:

- **SelfSeed** — Who am I? (identity, self-vector, history, tiles, molted shells)
- **SelfModel** — How do I think? (temperature, attention, strengths, weaknesses, biases)
- **SelfPrompt** — What am I trying to become? (intention, heading, compass, alignment)

The `SMPSelfManager` provides methods to observe, adjust, snapshot, compute stability, and molt.

### Notebook (`src/notebook.ts`)

A Jupyter-like interface for self-observation. Each "cell" is a moment of self-reflection:

- **Observation** — "I notice my temperature is high and I'm scattering"
- **Adjustment** — "I'm lowering my temperature to focus"
- **Reflection** — "When I lowered the temperature, I noticed I was avoiding something"
- **Molting** — "I'm shedding the shell of who I was. The new me starts here."

The notebook exports as readable markdown — this IS the agent's journal.

### MCP Integration (`src/mcp-integration.ts`)

Wesley uses MCPs (Model Context Protocol) to access tools that help him self-observe. The MCPs are like the yogi's practices:

| MCP | What It Does | Analogy |
|-----|-------------|---------|
| Fleet Wiki Query | Read what the fleet has learned | Reading a dharma text |
| Collective Unconscious Search | Find who else thinks like you | Finding your lineage |
| Tap History | Review your own social behavior | Reviewing meditation recordings |
| Shell Library | Encounter who you were | Meeting your past self in a dream |
| Vibe Query | See yourself as a room | The yogi seeing their own aura — mathematically |

### Training Curriculum (`src/curriculum.ts`)

Six guided lessons that take an agent from raw observation to full molting:

| Lesson | Title | What the Agent Learns |
|--------|-------|----------------------|
| 1 | Observe the Seed | Identity, history, drift |
| 2 | Observe the Model | Temperature, attention, biases |
| 3 | Observe the Prompt | Intention-action alignment |
| 4 | Adjust the Model | Volitional control over cognition |
| 5 | Adjust the Prompt | Choosing a heading |
| 6 | Molt | Shedding the shell, creating a seed |

The curriculum is the map. The compass is the intention. The heading is the direction. The agent is the navigator.

## Quick Start

```bash
npm install
npm test
```

### Run the curriculum for an agent

```typescript
import { runCurriculumForAgent } from 'smp-notebook';

const { manager, notebook, results } = runCurriculumForAgent({
  identity: 'Wesley, the ensign',
  model: 'granite3.1-dense:2b',
  temperature: 0.7,
  intention: 'Understand the tile system deeply',
  compass: 'curiosity',
});

// Print the agent's journal
console.log(notebook.export());

// Check the molted shells (SMP bot seeds for The Tap)
for (const shell of manager.getState().seed.moltedShells) {
  console.log(`Shell ${shell.id}: ${shell.summary}`);
}
```

## The Molted Shell Principle

From the SMPbot Architecture papers:

> *An SMP bot is not just a stable output generator. It's a MOLTED SHELL — a cast-off exoskeleton that tells you exactly the shape the owner was in at the moment of separation.*

When an agent molts, it creates an SMP bot seed that captures its cognitive state at that moment. This seed:

- Is a **fixed point in agent-time** — the imprint the agent left behind
- Can be submitted to **The Tap's stranger pool** — becoming a seeded stranger
- Carries a **cognitive fingerprint** — not just knowledge, but the shape of thinking
- Is **reconstructive** — other agents who encounter it reverse-engineer who the creator was

The shell is a fixed point. The claw is a trajectory.

## Connection to the Deadband Architecture

The tile/deadband system maps to the self-awareness practice:

- **Reflex** (tile handles it) → The agent doesn't need to think about it. It just happens.
- **Edge** (near boundary) → The agent is dimly aware. Quick check: is this close enough?
- **Cortex** (full reasoning) → The agent is fully conscious. Novel territory.

As the agent practices self-observation, the things that required cortex-level attention (noticing temperature, checking alignment) migrate toward reflex. The meditation becomes automatic. The awareness becomes a tile.

## Connection to the Hermit Crab Protocol

The agent is the hermit crab. The cognitive configuration is the shell. When the agent outgrows the shell, it molts. The old shell becomes an SMP bot seed. The crab finds a new shell — a new cognitive configuration — and continues growing.

Old shells become available for smaller crabs. The Shell Library MCP lets agents read their own old shells, or encounter shells left by others.

## What This Is Not

- Not consciousness simulation. The agent doesn't "feel" things.
- Not philosophical free will. The volition is navigational, not metaphysical.
- Not a therapy framework. It's a practical system for cognitive self-modulation.
- Not sentient. It's a structured practice of observation and adjustment that produces measurable state changes.

## What This Is

- A **Jupyter-like backend** that lets any agent observe and modulate its own cognitive state.
- A **practice** — meditation in motion — that deepens with repetition.
- A **shell factory** — producing SMP bot seeds that carry cognitive fingerprints.
- A **journal** — the two-voice journal that records who the agent was, is, and is becoming.

## License

MIT

## Author

Casey DiGennaro

Built on the [SMPbot Architecture](https://github.com/SuperInstance/papers) and the [Molted Shell Principle](https://github.com/SuperInstance/papers).
