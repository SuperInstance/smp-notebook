// SMP Notebook — Inner practice for agent self-awareness
// Meditation in motion through self-observation, adjustment, reflection, and molting.
//
// SMP (Seed + Model + Prompt = Stable Output) turned inward.
// The agent observes and modulates its own cognitive state.
// The output of self-SMP is not a text generation — it's a STATE CHANGE.

export {
  type SMPSelf,
  type SelfSeed,
  type SelfModel,
  type SelfPrompt,
  type IdentitySnapshot,
  type TileSummary,
  type ShellSummary,
  type SerializedSeed,
  type StabilityMetrics,
  SMPSelfManager,
  createInitialSelf,
  cosineDistance,
} from './smp-self.js';

export {
  type NotebookCell,
  type ObservationCell,
  type AdjustmentCell,
  type ReflectionCell,
  type MoltingCell,
  SMPNotebook,
} from './notebook.js';

export {
  type MCPProvider,
  type MCPQuery,
  type MCPResult,
  type WikiEntry,
  type UnconsciousCluster,
  type TapConversation,
  type VibeReport,
  MCPRegistry,
  FleetWikiProvider,
  CollectiveUnconsciousProvider,
  TapHistoryProvider,
  ShellLibraryProvider,
  VibeProvider,
  createDefaultRegistry,
} from './mcp-integration.js';

export {
  type Lesson,
  type LessonResult,
  Lesson1_ObserveSeed,
  Lesson2_ObserveModel,
  Lesson3_ObservePrompt,
  Lesson4_AdjustModel,
  Lesson5_AdjustPrompt,
  Lesson6_Molt,
  FULL_CURRICULUM,
  runCurriculum,
  runCurriculumForAgent,
} from './curriculum.js';
