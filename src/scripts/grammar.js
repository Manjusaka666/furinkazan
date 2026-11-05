// The guide's exercises hide answers behind toggles; its original jQuery is gone, this is all that's left of it.
document.querySelector('.gx').addEventListener('click', (e) => {
  const a = e.target.closest('[data-reveal], [data-flip]');
  if (!a) return;
  e.preventDefault();
  document.getElementById(a.dataset.reveal ?? a.dataset.flip)?.classList.toggle('shown');
});
