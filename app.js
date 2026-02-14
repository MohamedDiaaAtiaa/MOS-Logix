/**
 * MOS Logix - Main JavaScript
 * Modern Optimized Solutions
 * Engineering the Digital Future
 */

document.addEventListener('DOMContentLoaded', () => {
  // Core Components
  initScrollProgress();
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initSmoothScroll();

  // Soothing & Visual Enhancements
  initNoiseOverlay();
  initCursorGlow();
  initMagneticButtons();
  init3DTilt();
  initTypingEffect();
  initFloatingElements();

  // UX Enhancements (Gimmicks)
  initCustomSelects();
  initToastSystem();
  initPricingTiers();

  // Section Specific
  initTextScramble();
  initBookingSlots();
  initContactForm();
  initFloatingNudge();
  initPageTransitions();
  initDynamicBackground();
  initStatCounters();
  initSystemLog();
});

/**
 * System Activity Log: Periodically adds "activity" lines to the log container
 */
function initSystemLog() {
  const container = document.getElementById('logContent');
  if (!container) return;

  const activities = [
    'Initializing AI architecture...',
    'Analyzing user requirements...',
    'Building website structure...',
    'Optimizing for performance...',
    'Integrating design modules...',
    'Calibrating UX interactions...',
    'Generating responsive layouts...',
    'Deploying to edge network...',
    'Verifying SEO metadata...',
    'Constructing component library...',
    'Fetching AI models...',
    'Synchronizing database states...',
    'Refining visual aesthetics...',
    'Preparing launch sequence...'
  ];

  function addLog() {
    const line = document.createElement('div');
    line.className = 'log-line';
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const activity = activities[Math.floor(Math.random() * activities.length)];
    line.innerHTML = `<span style="opacity: 0.5;">[${timestamp}]</span> > ${activity}`;

    container.prepend(line);

    // Keep only last 5 lines
    if (container.children.length > 5) {
      container.lastElementChild.remove();
    }

    // Schedule next log
    setTimeout(addLog, 3000 + Math.random() * 5000);
  }

  // Start after a delay
  setTimeout(addLog, 2000);
}

/**
 * Floating Nudge: Periodically pulses the CTA button
 */
function initFloatingNudge() {
  const cta = document.querySelector('.nav-cta .btn-primary');
  if (!cta) return;

  setInterval(() => {
    cta.classList.add('pulse-anim');
    setTimeout(() => cta.classList.remove('pulse-anim'), 2000);
  }, 10000);
}

/**
 * 1. Visual Texture: Noise Overlay
 * Adds a subtle film grain effect for a premium feel.
 */
function initNoiseOverlay() {
  if (document.querySelector('.noise-overlay')) return;
  const noise = document.createElement('div');
  noise.className = 'noise-overlay';
  document.body.appendChild(noise);
}

/**
 * 2. 3D Tilt Effect for Cards
 * Adds depth by tilting cards based on mouse position.
 * FIX: Prepend shimmer to avoid blocking inputs.
 */
function init3DTilt() {
  const cards = document.querySelectorAll('.glass-card, .service-card, .testimonial-card, .meta-card, .pricing-card');

  cards.forEach(card => {
    // SKIP Tilt for contact form to ensure stable input interaction
    if (card.classList.contains('contact-form-wrapper')) return;

    if (!card.querySelector('.shimmer-bg')) {
      const shimmer = document.createElement('div');
      shimmer.className = 'shimmer-bg';
      card.style.position = 'relative';

      if (card.querySelector('select')) {
        card.style.overflow = 'visible';
      } else {
        card.style.overflow = 'hidden';
      }
      card.prepend(shimmer);
    }

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -2;
      const rotateY = ((x - centerX) / centerX) * 2;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
  });
}

/**
 * 3. Enhanced Magnetic Buttons
 */
function initMagneticButtons() {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });

    // Ripple logic handled in CSS now or kept simple
  });
}

/**
 * 4. Typing Effect for Hero Label
 */
function initTypingEffect() {
  const target = document.querySelector('.hero-label');
  if (target && !target.dataset.typed) {
    target.style.opacity = '1';
    target.style.animation = 'none';
    const text = target.textContent;
    target.dataset.typed = 'true';
    target.textContent = '';
    target.classList.add('typing-cursor');

    let i = 0;
    const type = () => {
      if (i < text.length) {
        target.textContent += text.charAt(i);
        i++;
        setTimeout(type, 50 + Math.random() * 50);
      } else {
        setTimeout(() => target.classList.remove('typing-cursor'), 2000);
      }
    };
    setTimeout(type, 100);
  }
}

/**
 * 5. Custom Select Dropdowns
 * Replaces native selects with styled custom dropdowns.
 */
function initCustomSelects() {
  document.querySelectorAll('select.form-select').forEach(select => {
    if (select.closest('.custom-select-wrapper')) return; // Already customized

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    // Hide default select
    select.style.display = 'none';

    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';
    wrapper.appendChild(customSelect);

    const trigger = document.createElement('div');
    trigger.className = 'custom-select__trigger';
    // Initial text
    const selectedOption = select.options[select.selectedIndex];
    trigger.innerHTML = `<span>${selectedOption ? selectedOption.text : 'Select...'}</span>`;
    customSelect.appendChild(trigger);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-select__options';
    customSelect.appendChild(optionsContainer);

    Array.from(select.options).forEach(opt => {
      const option = document.createElement('div');
      option.className = `custom-option ${opt.selected ? 'selected' : ''}`;
      option.textContent = opt.text;
      option.dataset.value = opt.value;

      option.addEventListener('click', (e) => {
        select.value = opt.value;
        select.dispatchEvent(new Event('change')); // Notify change
        trigger.querySelector('span').textContent = opt.text;

        customSelect.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        customSelect.classList.remove('open');
        e.stopPropagation();
      });
      optionsContainer.appendChild(option);
    });

    trigger.addEventListener('click', (e) => {
      // Close others
      document.querySelectorAll('.custom-select').forEach(s => {
        if (s !== customSelect) s.classList.remove('open');
      });
      customSelect.classList.toggle('open');
      e.stopPropagation();
    });
  });

  // Close on click outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('open'));
  });
}

/**
 * 6. Toast Notification System
 * Replaces alert() with custom toasts.
 */
function initToastSystem() {
  if (document.querySelector('.toast-container')) return;
  const container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);

  window.showToast = (title, message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success'
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-body">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

    container.appendChild(toast);
    // Animation
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 5000); // 5 seconds
  };
}

// ─── Existing Functionality ───────────────────────────────────────────────────

function initFloatingElements() {
  const floaters = document.querySelectorAll('.hero-visual img, .illustration-3d');
  floaters.forEach(el => el.classList.add('float-anim'));
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    if (btn && btn.classList.contains('loading')) return;

    // Basic Front-end validation
    const emailInput = form.querySelector('input[type="email"]');
    if (emailInput && !emailInput.value.includes('@')) {
      if (window.showToast) window.showToast('Invalid Email', 'Please enter a valid email address.', 'error');
      return;
    }

    const originalText = btn ? btn.innerHTML : 'Send Message';
    if (btn) {
      btn.innerHTML = '<span class="loader-dots">Sending...</span>';
      btn.classList.add('loading');
    }

    // Check for local file protocol
    if (window.location.protocol === 'file:') {
      console.error('Local Testing Detected');
      if (window.showToast) {
        window.showToast('Local Testing', 'API requires a server. Use "wrangler pages dev" for local testing.', 'error');
      }
      if (btn) {
        btn.innerHTML = originalText;
        btn.classList.remove('loading');
      }
      return;
    }

    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(`${window.location.origin}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      let result;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // Handle unexpected HTML response (e.g. 405 error from Cloudflare)
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        throw new Error(`Server returned ${response.status} ${response.statusText}. Please check if the API is correctly deployed.`);
      }

      if (response.ok && result.success) {
        if (window.showToast) {
          window.showToast('Message Sent', 'We have received your inquiry. Check your inbox soon!', 'success');
        } else {
          alert('Message Sent!');
        }
        form.reset();

        // Reset custom selects
        document.querySelectorAll('.custom-select__trigger span').forEach(span => {
          const wrapper = span.closest('.custom-select-wrapper');
          if (wrapper) {
            const select = wrapper.querySelector('select');
            if (select && select.options[0]) {
              span.textContent = select.options[0].text;
            }
          }
        });
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission Error:', error);
      if (window.showToast) {
        window.showToast('Submission Failed', error.message, 'error');
      } else {
        alert('Error: ' + error.message);
      }
    } finally {
      if (btn) {
        btn.innerHTML = originalText;
        btn.classList.remove('loading');
      }
    }
  });
}


function initBookingSlots() {
  const slots = document.querySelectorAll('.booking-slot');
  const bookBtn = document.getElementById('bookCallBtn');
  let selected = null;

  if (!slots.length) return;

  slots.forEach(slot => {
    slot.addEventListener('click', () => {
      slots.forEach(s => s.classList.remove('selected'));
      slot.classList.add('selected');
      selected = slot.dataset.slot;
    });
  });

  if (bookBtn) {
    bookBtn.addEventListener('click', () => {
      if (!selected) {
        if (window.showToast) window.showToast('Selection Required', 'Please select a time slot first.', 'error');
        else alert('Please select a time slot first.');
        return;
      }
      if (window.showToast) window.showToast('Booking Request Sent', 'We will confirm your appointment via email.', 'success');
      else alert('Booking Sent!');

      slots.forEach(s => s.classList.remove('selected'));
      selected = null;
    });
  }
}

function initScrollProgress() {
  const progressBar = document.getElementById('scrollProgress');
  if (!progressBar) return;
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    progressBar.style.width = `${scrollPercent}%`;
  });
}

function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.pageYOffset > 50);
  });
}

function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const menu = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      menu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => observer.observe(el));
}

function initTestimonials() {
  const track = document.getElementById('testimonialsTrack');
  const dots = document.querySelectorAll('.testimonial-dot');
  if (!track || !dots.length) return;
  let current = 0;
  const update = (idx) => {
    current = idx;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  };
  dots.forEach((d, i) => d.addEventListener('click', () => update(i)));
  setInterval(() => update((current + 1) % dots.length), 5000);
}

function initCursorGlow() {
  const glow = document.getElementById('cursorGlow');
  if (!glow || !window.matchMedia('(pointer: fine)').matches) return;
  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;
  document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; glow.classList.add('active'); });
  const animate = () => {
    glowX += (mouseX - glowX) * 0.1;
    glowY += (mouseY - glowY) * 0.1;
    glow.style.left = `${glowX}px`;
    glow.style.top = `${glowY}px`;
    requestAnimationFrame(animate);
  };
  animate();
  document.addEventListener('mouseleave', () => glow.classList.remove('active'));
}

function initTextScramble() {
  const elements = document.querySelectorAll('.scramble-text');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (el.dataset.scrambling) return;
        el.dataset.scrambling = 'true';
        const originalText = el.textContent;
        let iteration = 0;
        let interval = setInterval(() => {
          el.textContent = originalText.split('').map((char, index) => {
            if (index < iteration) return originalText[index];
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('');
          if (iteration >= originalText.length) {
            clearInterval(interval);
            el.textContent = originalText;
          }
          iteration += 1 / 3;
        }, 30);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  elements.forEach(el => observer.observe(el));
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
window.addEventListener('load', () => document.body.classList.add('loaded'));

/**
 * 7. Service Pricing Tiers
 * Handles clicking on tier buttons to update the price.
 */
function initPricingTiers() {
  const cards = document.querySelectorAll('.pricing-tier-card');
  if (!cards.length) return;

  cards.forEach(card => {
    const btns = card.querySelectorAll('.tier-btn');
    const priceDisplay = card.querySelector('.tier-price');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active from others in this card
        btns.forEach(b => b.classList.remove('active'));
        // Add to this one
        btn.classList.add('active');

        // Update price with animation
        const newPrice = btn.dataset.price;
        if (priceDisplay && newPrice) {
          priceDisplay.classList.remove('update-anim');
          void priceDisplay.offsetWidth; // Force reflow
          priceDisplay.textContent = newPrice;
          priceDisplay.classList.add('update-anim');
        }
      });
    });
  });
}
/**
 * 9. Page Transitions
 * Creates a glassmorphic loader and handles smooth entry.
 */
function initPageTransitions() {
  // Check if we've already shown the loader this session
  if (sessionStorage.getItem('mos_loader_shown')) {
    document.body.classList.add('page-ready');
    return;
  }

  const loader = document.createElement('div');
  loader.className = 'page-loader';
  loader.innerHTML = `
    <div class="loader-content">
      <div class="loader-circle"></div>
    </div>
  `;
  document.body.prepend(loader);

  // Simulate progress
  setTimeout(() => {
    loader.classList.add('fade-out');
    document.body.classList.add('page-ready');
    sessionStorage.setItem('mos_loader_shown', 'true');
    setTimeout(() => loader.remove(), 800);
  }, 1000);

  // Intercept links strictly for same-origin navigation if needed,
  // but we won't show the full loader again to keep it fast.
}

/**
 * 10. Dynamic Background (Mouse Repel)
 * Makes particles react to mouse movement.
 */
function initDynamicBackground() {
  const particles = document.querySelectorAll('.particle');
  if (!particles.length || window.innerWidth < 768) return;

  document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;

    particles.forEach(p => {
      const rect = p.getBoundingClientRect();
      const pX = rect.left + rect.width / 2;
      const pY = rect.top + rect.height / 2;

      const dist = Math.hypot(clientX - pX, clientY - pY);

      if (dist < 200) {
        const angle = Math.atan2(clientY - pY, clientX - pX);
        const force = (200 - dist) / 20;
        const moveX = -Math.cos(angle) * force;
        const moveY = -Math.sin(angle) * force;
        p.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.2)`;
      } else {
        p.style.transform = '';
      }
    });
  });
}

/**
 * 11. Stat Counters
 * Animates numbers when they scroll into view.
 */
function initStatCounters() {
  const stats = [
    { selector: '.meta-value:contains("Weeks")', suffix: ' Weeks' },
    { selector: '.meta-value:contains("Lighthouse")', suffix: '+ Lighthouse' }
  ];

  // Helper to find elements by text since CSS doesn't support :contains
  const findByText = (text) => {
    return Array.from(document.querySelectorAll('.meta-value, .feature-name, p')).filter(el => el.textContent.includes(text));
  };

  const animateValue = (obj, start, end, duration, suffix = '') => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      obj.textContent = value + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent;
        const match = text.match(/(\d+)/);
        if (match) {
          const endValue = parseInt(match[0]);
          const suffix = text.replace(match[0], '');
          animateValue(el, 0, endValue, 1500, suffix);
        }
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  // Look for specific patterns like "X-Y Weeks" or "X+"
  document.querySelectorAll('.meta-value, .stat-number').forEach(el => {
    if (el.textContent.match(/\d+/)) {
      observer.observe(el);
    }
  });
}
