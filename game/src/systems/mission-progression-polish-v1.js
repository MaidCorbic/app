const MISSION_STAGES = [
  { id: 'stage-1', zone: 'zone-1', puzzleLevel: 1, enemyLevel: 1 },
  { id: 'stage-2', zone: 'zone-2', puzzleLevel: 1, enemyLevel: 2 },
  { id: 'stage-3', zone: 'zone-3', puzzleLevel: 2, enemyLevel: 3 },
  { id: 'stage-4', zone: 'zone-4', puzzleLevel: 3, enemyLevel: 4 },
];

function installMissionProgressionPolish(RunnerScene) {
  if (!RunnerScene?.prototype || RunnerScene.prototype.__missionProgressionPolishV1) return;
  RunnerScene.prototype.__missionProgressionPolishV1 = true;

  RunnerScene.prototype.getMissionStage = function (stageId) {
    return MISSION_STAGES.find(stage => stage.id === stageId) || MISSION_STAGES[0];
  };

  RunnerScene.prototype.getCurrentMissionStage = function () {
    const index = Number(this.mission?.level ?? this.mission?.index ?? 0);
    return MISSION_STAGES[Math.max(0, Math.min(MISSION_STAGES.length - 1, index))];
  };

  RunnerScene.prototype.getMissionProgressionSummary = function () {
    const stage = this.getCurrentMissionStage();
    const zoneState = this.getWorldZoneState?.(stage.zone);
    return {
      stageId: stage.id,
      zone: stage.zone,
      puzzleLevel: stage.puzzleLevel,
      enemyLevel: stage.enemyLevel,
      unlocked: zoneState?.unlocked ?? false,
      completed: zoneState?.completed ?? false,
    };
  };

  RunnerScene.prototype.completeMissionStage = function (stageId = null) {
    const stage = this.getMissionStage(stageId || this.getCurrentMissionStage().id);
    const completed = this.completeWorldZone?.(stage.zone) ?? false;
    return {
      stageId: stage.id,
      completed,
      nextStage: MISSION_STAGES.find(item => item.zone === this.getNextWorldZone?.(stage.zone)?.id) || null,
    };
  };
}

export { installMissionProgressionPolish };
