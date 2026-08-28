import { RunnerScene } from './src/scenes/RunnerScene.js';
import { installGameplayExpansion } from './src/systems/gameplay-expansion-v1.js';
import { installGameplayExpansionV2Safe } from './src/systems/gameplay-expansion-v2-safe.js';
import { installGameplayExpansionV3Safe } from './src/systems/gameplay-expansion-v3-safe.js';
import { installGameplayExpansionV3InputCompat } from './src/systems/gameplay-expansion-v3-input-compat.js';
import { installGameplayExpansionV4Safe } from './src/systems/gameplay-expansion-v4-safe.js';
import { installGameplayExpansionV5Safe } from './src/systems/gameplay-expansion-v5-safe.js';
import { installGameplayExpansionV6Safe } from './src/systems/gameplay-expansion-v6-safe.js';
import { installGameplayExpansionV7WorldSimulation } from './src/systems/gameplay-expansion-v7-world-simulation.js';

installGameplayExpansion(RunnerScene);
installGameplayExpansionV2Safe(RunnerScene);
installGameplayExpansionV3Safe(RunnerScene);
installGameplayExpansionV3InputCompat(RunnerScene);
installGameplayExpansionV4Safe(RunnerScene);
installGameplayExpansionV5Safe(RunnerScene);
installGameplayExpansionV6Safe(RunnerScene);
installGameplayExpansionV7WorldSimulation(RunnerScene);
