// Keeps the Help step a child just opened on the screen (on a short screen it can open below the bottom edge).

/** Scrolls the newest Help step (or, after the last step, the worked answer) into view without moving keyboard focus. */
export function showNewStep(root) {
  const step = root?.querySelector('.help-steps li:last-child');
  if (!step) return;
  const r = step.getBoundingClientRect();
  if (r.bottom > window.innerHeight || r.top < 0) step.scrollIntoView({ block: 'nearest' });
}
