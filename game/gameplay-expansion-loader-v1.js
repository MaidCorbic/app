import { RunnerScene } from './src/scenes/RunnerScene.js';

/*
 * PR 1055 CORE RUNNER BOOT
 *
 * The previous loader installed V1-V13 expansion packs that injected
 * secondary maps, trains, traffic, NPC/world simulation, floating props
 * and legacy route objects into RunnerScene.
 *
 * RunnerScene is now authoritative. Keep this file as a compatibility
 * entry point for home-options.js, but do not install any legacy expansion.
 */

void RunnerScene;
