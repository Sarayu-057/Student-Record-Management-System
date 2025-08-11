// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const yearSpan = document.getElementById('year');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  if (toggleButton && navLinks) {
    toggleButton.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      toggleButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Basic client-side form handling
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (form && status) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const name = formData.get('name');
      status.textContent = `Thanks, ${name || 'friend'}! We'll be in touch soon.`;
      form.reset();
    });
  }
});