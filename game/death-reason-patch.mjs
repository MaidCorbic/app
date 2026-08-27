const REQUIREMENTS = [
  "takeSciFiHit(message) {",
  "fail(message) {",
  "const collision = message.includes('barrier') || message.includes('interceptor');",
  "this.health--;",
];

export function patchDeathReason(code) {
  let transformed = code;

  for (const marker of REQUIREMENTS) {
    if (!transformed.includes(marker)) return code;
  }

  transformed = transformed.replace(
    "takeSciFiHit(message) { if (this.briefingProtected || this.respawning || this.finished || this.healthInvulnerable > 0) return; this.health--;",
    "takeSciFiHit(message, reason = 'hazard') { if (this.briefingProtected || this.respawning || this.finished || this.healthInvulnerable > 0) return; this.health--;"
  );

  transformed = transformed.replace(
    "if (this.health <= 0) { this.fail('The courier collapsed. Checkpoint health restored.'); return; }",
    "if (this.health <= 0) { this.fail('The courier collapsed. Checkpoint health restored.', reason); return; }"
  );

  transformed = transformed.replace(
    "fail(message) { if (this.briefingProtected || this.finished || this.respawning || this.respawnGrace > 0) return; const collision = message.includes('barrier') || message.includes('interceptor'); if (collision) this.collisions++; else this.falls++; this.deaths++; if (this.package?.condition) { this.packageCondition = Math.max(0, this.packageCondition - (collision ? 25 : 35));",
    "fail(message, reason) { if (this.briefingProtected || this.finished || this.respawning || this.respawnGrace > 0) return; const deathReason = reason || (message.includes('barrier') || message.includes('interceptor') ? 'collision' : 'fall'); const collision = deathReason === 'collision'; if (collision) this.collisions++; else if (deathReason === 'enemy') this.enemyHits = (this.enemyHits || 0) + 1; else this.falls++; this.deaths++; if (this.package?.condition) { this.packageCondition = Math.max(0, this.packageCondition - (deathReason === 'collision' || deathReason === 'enemy' ? 25 : 35));"
  );

  transformed = transformed.replace(
    "this.fail('A live barrier cut the delivery short.')",
    "this.fail('A live barrier cut the delivery short.', 'collision')"
  );
  transformed = transformed.replace(
    "this.fail('A security gate sealed the relay route.')",
    "this.fail('A security gate sealed the relay route.', 'collision')"
  );
  transformed = transformed.replace(
    "this.fail('The interceptor reclaimed the signal.')",
    "this.fail('The interceptor reclaimed the signal.', 'collision')"
  );
  transformed = transformed.replace(
    "this.fail('The rain swallowed the route below.')",
    "this.fail('The rain swallowed the route below.', 'fall')"
  );
  transformed = transformed.replace(
    "this.fail('The courier fell into the relay void.')",
    "this.fail('The courier fell into the relay void.', 'fall')"
  );
  transformed = transformed.replace(
    "this.fail('An enemy attack knocked the courier down.')",
    "this.fail('An enemy attack knocked the courier down.', 'enemy')"
  );
  transformed = transformed.replace(
    "this.takeSciFiHit('An enemy attack knocked the courier down.')",
    "this.takeSciFiHit('An enemy attack knocked the courier down.', 'enemy')"
  );
  transformed = transformed.replace(
    "this.takeSciFiHit('A dinosaur charge knocked the courier down.')",
    "this.takeSciFiHit('A dinosaur charge knocked the courier down.', 'enemy')"
  );

  transformed = transformed.replace(
    "this.deaths = 0; this.deathLimit",
    "this.deaths = 0; this.enemyHits = 0; this.deathLimit"
  );

  transformed = transformed.replace(
    "enemyDefeats: this.enemyDefeats || 0, bossDefeated:",
    "enemyDefeats: this.enemyDefeats || 0, enemyHits: this.enemyHits || 0, bossDefeated:"
  );

  return transformed;
}
