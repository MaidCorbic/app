export function patchSpecialEventCreditReward(code) {
  const marker = '  const modifierXp = runStats.modifier?.xpBonus || 0;';
  if (!code.includes(marker) || code.includes('const modifierCredits = runStats.modifier?.credits || 0;')) return code;

  let transformed = code.replace(
    marker,
    `${marker}\n  const modifierCredits = runStats.modifier?.credits || 0;`,
  );

  transformed = transformed.replace(
    'credits: state.credits + credits + campaignCredits + rivalCredits,',
    'credits: state.credits + credits + campaignCredits + rivalCredits + modifierCredits,',
  );

  transformed = transformed.replace(
    'modifier: modifierXp, daily: 0, contract: contractXp,',
    'modifier: modifierXp, modifierCredits, daily: 0, contract: contractXp,',
  );

  return transformed;
}
