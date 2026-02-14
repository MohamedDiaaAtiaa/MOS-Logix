/**
 * MOS Logix – Business Assessment Quiz
 * Interactive questionnaire with projected growth statistics
 */

(function () {
    'use strict';

    const answers = {};
    let currentQuestion = 1;
    const totalQuestions = 7;

    const slides = document.querySelectorAll('.quiz-slide');
    const progressBar = document.getElementById('quizProgressBar');
    const progressText = document.getElementById('quizProgressText');
    const backBtn = document.getElementById('quizBack');

    if (!slides.length) return;

    // ─── Option Click Handler ────────────────────────────────────────
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.addEventListener('click', () => {
            const slide = option.closest('.quiz-slide');
            const q = parseInt(slide.dataset.question);

            // Deselect siblings
            slide.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');

            answers[q] = option.dataset.value;

            // Auto-advance after short delay
            setTimeout(() => {
                if (q < totalQuestions) {
                    goToQuestion(q + 1);
                } else {
                    showResults();
                }
            }, 400);
        });
    });

    // ─── Back Button ─────────────────────────────────────────────────
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (currentQuestion > 1) goToQuestion(currentQuestion - 1);
        });
    }

    // ─── Navigation ──────────────────────────────────────────────────
    function goToQuestion(num) {
        currentQuestion = num;
        slides.forEach(s => s.classList.remove('active'));
        const target = document.querySelector(`.quiz-slide[data-question="${num}"]`);
        if (target) target.classList.add('active');

        // Progress
        const pct = (num / totalQuestions) * 100;
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (progressText) progressText.textContent = `Question ${num} of ${totalQuestions}`;
        if (backBtn) backBtn.style.display = num > 1 ? 'inline-flex' : 'none';

        // Scroll to top of quiz
        document.querySelector('.quiz-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ─── Compute Results ────────────────────────────────────────────
    function computeResults() {
        // Digital readiness score (0-100)
        let score = 50; // base

        // Website status impact
        const wsMap = { none: -30, old: -15, template: -5, decent: 10, great: 25 };
        score += wsMap[answers[2]] || 0;

        // Discovery channel
        const chMap = { wordofmouth: -15, social: 0, google: 15, ads: 5, mixed: 10 };
        score += chMap[answers[3]] || 0;

        // Revenue tier
        const rvMap = { pre: -5, low: 0, mid: 5, high: 10, enterprise: 15 };
        score += rvMap[answers[4]] || 0;

        // Clamp
        score = Math.max(5, Math.min(95, score));

        // ── Traffic projections ──────────────────────────
        const trafficNowMap = { none: 0, old: 120, template: 350, decent: 800, great: 2500 };
        const trafficNow = trafficNowMap[answers[2]] || 0;

        let trafficMultiplier = 5;
        if (answers[2] === 'great') trafficMultiplier = 1.4;
        else if (answers[2] === 'decent') trafficMultiplier = 2.5;
        else if (answers[2] === 'template') trafficMultiplier = 3;

        const trafficAfter = Math.round((trafficNow || 200) * trafficMultiplier);

        // ── Revenue projections ──────────────────────────
        const revNowMap = { pre: 0, low: 1200, mid: 5000, high: 25000, enterprise: 75000 };
        const revenueNow = revNowMap[answers[4]] || 0;

        let revMultiplier = 2.5;
        if (answers[2] === 'great') revMultiplier = 1.2;
        else if (answers[5] === 'ecommerce') revMultiplier = 3.5;

        const revenueAfter = Math.round((revenueNow || 500) * revMultiplier);

        // ── Conversion rate ──────────────────────────────
        const convNow = answers[2] === 'none' ? 0 : answers[2] === 'great' ? 3.2 : answers[2] === 'decent' ? 1.8 : 0.8;
        const convAfter = Math.min(convNow * 3.5, 7.5);

        // ── Speed ────────────────────────────────────────
        const speedNow = answers[2] === 'none' ? 0 : answers[2] === 'great' ? 1.2 : answers[2] === 'decent' ? 3.5 : 6.5;
        const speedAfter = 0.8;

        // ── Recommendations ──────────────────────────────
        const recs = [];

        if (answers[2] === 'none' || answers[2] === 'old') {
            recs.push({
                priority: 'high',
                title: 'Build a Professional Website',
                text: 'You\'re losing potential customers every day without a proper web presence. A custom website will establish credibility and capture leads 24/7.',
                service: 'Custom Website — $100'
            });
        }

        if (answers[2] === 'template') {
            recs.push({
                priority: 'high',
                title: 'Upgrade from Templates',
                text: 'Template sites cap your potential. A custom-built site loads 3x faster, ranks higher on Google, and converts significantly more visitors.',
                service: 'Website Redesign — $750'
            });
        }

        if (answers[5] === 'ecommerce') {
            recs.push({
                priority: 'high',
                title: 'Launch an E-commerce Store',
                text: 'Online selling unlocks revenue 24/7. With integrated payments, inventory, and email automation you can scale without hiring.',
                service: 'E-commerce — $1,000'
            });
        }

        if (answers[5] === 'automation' || answers[1] === 'saas') {
            recs.push({
                priority: 'high',
                title: 'Build a Web Application',
                text: 'Your business model requires custom software. A web app with real-time features and a solid backend will be your competitive edge.',
                service: 'Web Application — $300'
            });
        }

        if (answers[5] === 'seo' || answers[3] === 'wordofmouth') {
            recs.push({
                priority: 'medium',
                title: 'Invest in SEO & Discoverability',
                text: 'If people can\'t find you on Google, you don\'t exist online. Proper SEO structure can triple your organic traffic within 6 months.',
                service: 'Custom Website — $100'
            });
        }

        if (answers[5] === 'speed' || answers[2] === 'old') {
            recs.push({
                priority: 'medium',
                title: 'Fix Performance Issues',
                text: 'Every second of load time costs you 7% in conversions. Optimized code and modern architecture will transform your user experience.',
                service: 'Website Redesign — $750'
            });
        }

        if (answers[2] === 'decent' || answers[2] === 'great') {
            recs.push({
                priority: 'low',
                title: 'Ongoing Maintenance & Growth',
                text: 'Your site is in good shape—keep it that way. Regular updates, security monitoring, and performance tuning protect your investment.',
                service: 'Maintenance — $10/mo'
            });
        }

        if (answers[5] === 'design') {
            recs.push({
                priority: 'medium',
                title: 'Premium Design Overhaul',
                text: 'First impressions happen in 0.05 seconds. A modern, conversion-focused design will set you apart from every competitor.',
                service: 'Website Redesign — $750'
            });
        }

        // Ensure at least 2 recs
        if (recs.length < 2) {
            recs.push({
                priority: 'medium',
                title: 'Establish a Digital Foundation',
                text: 'A professional website is the cornerstone of all digital marketing. Start here and scale from a solid base.',
                service: 'Custom Website — $100'
            });
        }

        return {
            score,
            traffic: { now: trafficNow, after: trafficAfter },
            revenue: { now: revenueNow, after: revenueAfter },
            conversion: { now: convNow, after: convAfter },
            speed: { now: speedNow, after: speedAfter },
            recs
        };
    }

    // ─── Show Results ────────────────────────────────────────────────
    function showResults() {
        const data = computeResults();
        const wrapper = document.querySelector('.quiz-wrapper');
        const results = document.getElementById('quizResults');
        if (!wrapper || !results) return;

        wrapper.style.display = 'none';
        results.style.display = 'block';

        // Scroll up
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // ── Title
        let titleText, subtitleText;
        if (data.score < 30) {
            titleText = 'Your Digital Presence Needs <span class="gradient-text">Urgent Attention</span>';
            subtitleText = 'You\'re leaving serious money on the table. Here\'s exactly what to do.';
        } else if (data.score < 55) {
            titleText = 'You\'re Missing Major <span class="gradient-text">Growth Opportunities</span>';
            subtitleText = 'Your business has potential—but your digital presence isn\'t keeping up. Let\'s fix that.';
        } else if (data.score < 75) {
            titleText = 'Solid Foundation, Room to <span class="gradient-text">Scale</span>';
            subtitleText = 'You\'re doing well, but strategic upgrades could unlock significantly more revenue.';
        } else {
            titleText = 'You\'re in Great Shape — Let\'s <span class="gradient-text">Optimize</span>';
            subtitleText = 'Your digital presence is strong. Small refinements can still drive meaningful growth.';
        }

        document.getElementById('resultsTitle').innerHTML = titleText;
        document.getElementById('resultsSubtitle').textContent = subtitleText;

        // ── Score Ring (with SVG gradient) ──
        const ringFill = document.getElementById('scoreRingFill');
        if (ringFill) {
            // Inject gradient def
            const svg = ringFill.closest('svg');
            if (svg && !svg.querySelector('#scoreGradient')) {
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                defs.innerHTML = `
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#14FFEC"/>
            <stop offset="100%" stop-color="#00D9FF"/>
          </linearGradient>`;
                svg.prepend(defs);
            }
            // Animate ring
            const circumference = 2 * Math.PI * 85; // ≈534
            const offset = circumference - (data.score / 100 * circumference);
            setTimeout(() => { ringFill.style.strokeDashoffset = offset; }, 300);
        }

        // Animate score counter
        animateCounter('scoreNumber', 0, data.score, 2000);

        // ── Bar Charts ─────────────────────────────────────
        setTimeout(() => {
            setBar('trafficBefore', 'trafficAfter', data.traffic.now, data.traffic.after,
                formatNum(data.traffic.now), formatNum(data.traffic.after));
            document.getElementById('trafficDelta').textContent =
                `+${Math.round(((data.traffic.after - data.traffic.now) / Math.max(data.traffic.now, 1)) * 100)}% increase`;

            setBar('revenueBefore', 'revenueAfter', data.revenue.now, data.revenue.after,
                '$' + formatNum(data.revenue.now), '$' + formatNum(data.revenue.after));
            document.getElementById('revenueDelta').textContent =
                `+$${formatNum(data.revenue.after - data.revenue.now)}/mo potential`;

            setBar('convBefore', 'convAfter', data.conversion.now, data.conversion.after,
                data.conversion.now.toFixed(1) + '%', data.conversion.after.toFixed(1) + '%');
            document.getElementById('convDelta').textContent =
                `${data.conversion.after.toFixed(1)}% conversion target`;

            // Speed: lower is better, so invert for chart
            setBar('speedBefore', 'speedAfter', data.speed.now, data.speed.after,
                data.speed.now ? data.speed.now.toFixed(1) + 's' : 'N/A',
                data.speed.after.toFixed(1) + 's',
                true);
            document.getElementById('speedDelta').textContent =
                data.speed.now ? `${((1 - data.speed.after / data.speed.now) * 100).toFixed(0)}% faster` : 'Sub-second loads';
        }, 500);

        // ── Recommendations ────────────────────────────────
        const recsGrid = document.getElementById('recsGrid');
        if (recsGrid) {
            recsGrid.innerHTML = data.recs.map(r => `
        <div class="glass-card rec-card">
          <span class="rec-priority ${r.priority}">${r.priority} priority</span>
          <h4 class="rec-title">${r.title}</h4>
          <p class="rec-text">${r.text}</p>
          <a href="services.html" class="rec-service">→ ${r.service}</a>
        </div>
      `).join('');
        }

        // ── Growth Line Chart ──────────────────────────────
        setTimeout(() => drawGrowthChart(data), 800);

        // Trigger reveal animations
        setTimeout(() => {
            results.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
        }, 100);
    }

    // ─── Bar Chart Helpers ───────────────────────────────────────────
    function setBar(beforeId, afterId, valBefore, valAfter, labelBefore, labelAfter, invertHeight) {
        const barBefore = document.getElementById(beforeId);
        const barAfter = document.getElementById(afterId);
        if (!barBefore || !barAfter) return;

        const maxVal = Math.max(valBefore, valAfter, 1);
        let hBefore, hAfter;

        if (invertHeight) {
            // For speed: higher value = taller bar (worse), we want "after" to be short (good)
            hBefore = Math.max((valBefore / Math.max(valBefore, 8)) * 140, 15);
            hAfter = Math.max((valAfter / Math.max(valBefore, 8)) * 140, 15);
        } else {
            hBefore = Math.max((valBefore / maxVal) * 140, valBefore > 0 ? 15 : 8);
            hAfter = Math.max((valAfter / maxVal) * 140, 15);
        }

        barBefore.style.height = `${hBefore}px`;
        barAfter.style.height = `${hAfter}px`;
        barBefore.querySelector('span').textContent = labelBefore;
        barAfter.querySelector('span').textContent = labelAfter;
    }

    // ─── Animate Counter ─────────────────────────────────────────────
    function animateCounter(elementId, from, to, duration) {
        const el = document.getElementById(elementId);
        if (!el) return;
        const start = performance.now();

        function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(from + (to - from) * eased);
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // ─── Format Numbers ─────────────────────────────────────────────
    function formatNum(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    }

    // ─── 12-Month Growth Canvas Chart ─────────────────────────────
    function drawGrowthChart(data) {
        const canvas = document.getElementById('growthCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Handle hi-DPI
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 300 * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = '300px';
        ctx.scale(dpr, dpr);

        const W = rect.width;
        const H = 300;
        const padL = 60, padR = 20, padT = 30, padB = 40;
        const chartW = W - padL - padR;
        const chartH = H - padT - padB;

        // Generate monthly data points
        const months = ['Now', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12'];
        const revenueStart = data.revenue.now || 500;
        const revenueEnd = data.revenue.after;

        const withoutSite = months.map((_, i) => {
            // Flat / slight growth without a site
            return revenueStart * (1 + i * 0.01);
        });

        const withSite = months.map((_, i) => {
            // Exponential-ish curve up
            const t = i / 12;
            const eased = t * t; // quadratic ease-in
            return revenueStart + (revenueEnd - revenueStart) * eased;
        });

        const allVals = [...withoutSite, ...withSite];
        const maxY = Math.max(...allVals) * 1.15;
        const minY = 0;

        function xPos(i) { return padL + (i / 12) * chartW; }
        function yPos(v) { return padT + chartH - ((v - minY) / (maxY - minY)) * chartH; }

        // ── Grid Lines ──
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padT + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(W - padR, y);
            ctx.stroke();
        }

        // ── Y-axis labels ──
        ctx.fillStyle = '#94A3B8';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const val = minY + ((maxY - minY) / 4) * (4 - i);
            const y = padT + (chartH / 4) * i;
            ctx.fillText('$' + formatNum(Math.round(val)), padL - 10, y + 4);
        }

        // ── X-axis labels ──
        ctx.textAlign = 'center';
        months.forEach((label, i) => {
            ctx.fillText(label, xPos(i), H - 10);
        });

        // ── "Without" line (gray, dashed) ──
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        withoutSite.forEach((v, i) => {
            if (i === 0) ctx.moveTo(xPos(i), yPos(v));
            else ctx.lineTo(xPos(i), yPos(v));
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // ── "With MOS Logix" line (teal, animated) ──
        const gradient = ctx.createLinearGradient(padL, 0, W - padR, 0);
        gradient.addColorStop(0, '#14FFEC');
        gradient.addColorStop(1, '#00D9FF');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(20, 255, 236, 0.4)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        withSite.forEach((v, i) => {
            if (i === 0) ctx.moveTo(xPos(i), yPos(v));
            else ctx.lineTo(xPos(i), yPos(v));
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Fill area under the teal line
        ctx.fillStyle = 'rgba(20, 255, 236, 0.06)';
        ctx.beginPath();
        ctx.moveTo(xPos(0), yPos(withSite[0]));
        withSite.forEach((v, i) => ctx.lineTo(xPos(i), yPos(v)));
        ctx.lineTo(xPos(12), padT + chartH);
        ctx.lineTo(xPos(0), padT + chartH);
        ctx.closePath();
        ctx.fill();

        // ── Data points on teal line ──
        withSite.forEach((v, i) => {
            ctx.fillStyle = '#14FFEC';
            ctx.beginPath();
            ctx.arc(xPos(i), yPos(v), 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // ── Legend ──
        const legY = padT - 12;
        ctx.font = '12px Inter, sans-serif';

        // Without
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padL, legY);
        ctx.lineTo(padL + 30, legY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#94A3B8';
        ctx.textAlign = 'left';
        ctx.fillText('Without website', padL + 36, legY + 4);

        // With
        ctx.strokeStyle = '#14FFEC';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padL + 160, legY);
        ctx.lineTo(padL + 190, legY);
        ctx.stroke();
        ctx.fillStyle = '#14FFEC';
        ctx.fillText('With MOS Logix', padL + 196, legY + 4);
    }

    // ─── Reset Quiz ──────────────────────────────────────────────────
    window.resetQuiz = function () {
        const wrapper = document.querySelector('.quiz-wrapper');
        const results = document.getElementById('quizResults');
        if (wrapper) wrapper.style.display = 'block';
        if (results) results.style.display = 'none';

        Object.keys(answers).forEach(k => delete answers[k]);
        document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
        goToQuestion(1);
        wrapper?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

})();
