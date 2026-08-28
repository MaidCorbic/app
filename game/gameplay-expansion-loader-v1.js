import { RunnerScene } from './src/scenes/RunnerScene.js';
import { installGameplayExpansion } from './src/systems/gameplay-expansion-v1.js';
import { installGameplayExpansionV2Safe } from './src/systems/gameplay-expansion-v2-safe.js';
import { installGameplayExpansionV3Safe } from './src/systems/gameplay-expansion-v3-safe.js';

installGameplayExpansion(RunnerScene);
installGameplayExpansionV2Safe(RunnerScene);
installGameplayExpansionV3Safe(RunnerScene);