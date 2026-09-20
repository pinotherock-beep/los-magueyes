document.querySelectorAll('[data-auto-submit]').forEach(select => {
  select.addEventListener('change', () => select.form?.requestSubmit());
});

document.querySelectorAll('form[data-confirm]').forEach(form => {
  form.addEventListener('submit', event => {
    if (!window.confirm(form.dataset.confirm)) event.preventDefault();
  });
});
