(() => {
  const panel = document.getElementById('relayInfoPanel');
  const card = panel?.querySelector('.relay-info-card');
  const faqItems = [...document.querySelectorAll('.relay-faq-item')];
  const filterButtons = [...document.querySelectorAll('[data-faq-filter]')];

  if (!panel || !card) return;

  const closeFaq = () => {
    panel.classList.add('hidden');
    panel.setAttribute('aria-hidden', 'true');

    faqItems.forEach(item => {
      item.classList.remove('open');

      const button = item.querySelector('.relay-faq-question');
      const answer = item.querySelector('.relay-faq-answer');

      button?.setAttribute('aria-expanded', 'false');

      if (answer) {
        answer.hidden = true;
      }
    });
  };

  const openFaq = () => {
    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden', 'false');
  };

  /* FAQ accordion */

  faqItems.forEach(item => {
    const button = item.querySelector('.relay-faq-question');
    const answer = item.querySelector('.relay-faq-answer');

    if (!button || !answer) return;

    button.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      faqItems.forEach(other => {
        if (other === item) return;

        other.classList.remove('open');

        const otherButton =
          other.querySelector('.relay-faq-question');

        const otherAnswer =
          other.querySelector('.relay-faq-answer');

        otherButton?.setAttribute(
          'aria-expanded',
          'false'
        );

        if (otherAnswer) {
          otherAnswer.hidden = true;
        }
      });

      item.classList.toggle('open', !isOpen);
      button.setAttribute(
        'aria-expanded',
        String(!isOpen)
      );

      answer.hidden = isOpen;
    });
  });

  /* CATEGORY FILTER */

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.faqFilter || 'all';

      filterButtons.forEach(btn => {
        btn.classList.toggle(
          'active',
          btn === button
        );
      });

      faqItems.forEach(item => {
        const category = item.dataset.category;

        const visible =
          filter === 'all' ||
          category === filter;

        item.classList.toggle(
          'faq-filter-hidden',
          !visible
        );
      });
    });
  });

  /* CLOSE BY ESC */

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!panel.classList.contains('hidden')) {
        closeFaq();
      }
    }
  });

  /* CLOSE BY BACKDROP */

  panel.addEventListener('click', event => {
    if (event.target === panel) {
      closeFaq();
    }
  });

  /* OPTIONAL GLOBAL API */

  window.relayFaq = {
    open: openFaq,
    close: closeFaq,
    toggle() {
      if (panel.classList.contains('hidden')) {
        openFaq();
      } else {
        closeFaq();
      }
    }
  };
})();
