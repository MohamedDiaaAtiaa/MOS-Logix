/**
 * MOS Logix – Try It Builder Logic
 * Handles the multi-step builder, Gemini API integration, code preview, and gamified loading experience.
 * Customized for different service types.
 */

(function () {
    'use strict';

    // Configuration
    const API_KEY = 'AIzaSyC8TasdrtmEabXgg9KrI4cghfMrNfpCUJM';
    // Use gemini-2.0-flash-exp if available, otherwise fallback to 1.5-flash
    // User requested 2.5, trying to use best available model
    const MODEL_NAME = 'gemini-1.5-flash';
    // Wait, user explicitly asked for gemini-2.5-flash in previous turn and I fixed it.
    // I should stick to gemini-2.5-flash as requested.
    // If it fails, I might need to fallback, but let's stick to user request.
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    // Service Configuration
    const SERVICES = {
        website: {
            title: 'Custom Website',
            steps: ['theme', 'colors', 'fonts', 'notes'],
            promptContext: 'Create a single-file HTML website with embedded CSS/JS.'
        },
        webapp: {
            title: 'Web Application',
            steps: ['theme', 'colors', 'fonts', 'notes'],
            promptContext: 'Create a functional single-file web application (e.g., dashboard, tool, calculator).'
        },
        ecommerce: {
            title: 'Online Store',
            steps: ['theme', 'colors', 'fonts', 'notes'],
            promptContext: 'Create a single-file e-commerce store home/product page.'
        },
        maintenance: {
            title: 'Maintenance & Fixes',
            steps: ['code', 'notes'],
            promptContext: 'Analyze the provided code and FIX the issues described. Return the full corrected code.'
        },
        redesign: {
            title: 'Website Redesign',
            steps: ['code', 'theme', 'colors', 'fonts', 'notes'],
            promptContext: 'Redesign the provided code using the new theme, colors, and fonts specified. Return the full redesigned code.'
        }
    };

    // State
    let currentService = 'website';
    let currentStepIndex = 1;
    let stepsOrder = [];

    const formData = {
        service: '',
        code: '',
        theme: '',
        industry: '',
        colors: { primary: '#0F172A', accent: '#14FFEC', bg: '#FFFFFF', text: '#1E293B' },
        fonts: { heading: 'Poppins', body: 'Inter' },
        notes: ''
    };

    // DOM Elements
    const els = {
        stepIndicators: document.getElementById('stepIndicators'),
        builderSteps: document.getElementById('builderSteps'),
        btnNext: document.getElementById('builderNext'),
        btnBack: document.getElementById('builderBack'),
        btnGenerate: document.getElementById('builderGenerate'),
        builderWrapper: document.querySelector('.builder-wrapper'),
        loadingSection: document.getElementById('genLoading'),
        resultsSection: document.getElementById('genResults'),
        previewFrame: document.getElementById('previewFrame'),
        codeOutput: document.getElementById('codeOutput'),
        serviceLabel: document.getElementById('serviceLabel'),
        serviceTitle: document.getElementById('serviceTitle'),
        configSummary: document.getElementById('configSummary'),
        // Game Elements
        gameCanvas: document.getElementById('gameCanvas'),
        gameOverlay: document.getElementById('gameOverlay'),
        gameScore: document.getElementById('gameScore'),
        progressLog: document.getElementById('progressLog')
    };

    // ─── Initialization ──────────────────────────────────────────────────────────
    function init() {
        const params = new URLSearchParams(window.location.search);
        const serviceParam = params.get('service');
        currentService = (SERVICES[serviceParam]) ? serviceParam : 'website';
        formData.service = currentService;
        stepsOrder = SERVICES[currentService].steps;

        updateServiceUI(currentService);
        renderStepIndicators();
        goToStep(1);

        setupNavigation();
        setupColorPickers();
        setupFontSelectors();
        setupThemeSuggestions();
        setupDeviceToggles();

        // Init Game (but don't start)
        SnakeGame.init();
    }

    function updateServiceUI(service) {
        const config = SERVICES[service];
        if (els.serviceTitle) els.serviceTitle.textContent = config.title;
        if (els.serviceLabel) els.serviceLabel.textContent = `Try It: ${config.title}`;
    }

    function renderStepIndicators() {
        if (!els.stepIndicators) return;
        els.stepIndicators.innerHTML = '';

        stepsOrder.forEach((stepId, index) => {
            const stepNum = index + 1;
            const stepName = getStepName(stepId);

            const dot = document.createElement('div');
            dot.className = 'step-dot';
            dot.dataset.stepIndex = stepNum;
            dot.innerHTML = `<span>${stepNum}</span><p>${stepName}</p>`;

            els.stepIndicators.appendChild(dot);

            if (index < stepsOrder.length - 1) {
                const line = document.createElement('div');
                line.className = 'step-line';
                els.stepIndicators.appendChild(line);
            }
        });
    }

    function getStepName(stepId) {
        const names = { theme: 'Theme', colors: 'Colors', fonts: 'Fonts', notes: 'Notes', code: 'Code' };
        return names[stepId] || 'Step';
    }

    // ─── Navigation Logic ────────────────────────────────────────────────────────
    function setupNavigation() {
        if (els.btnNext) els.btnNext.addEventListener('click', () => {
            if (validateCurrentStep()) goToStep(currentStepIndex + 1);
        });

        if (els.btnBack) els.btnBack.addEventListener('click', () => {
            if (currentStepIndex > 1) goToStep(currentStepIndex - 1);
        });

        if (els.btnGenerate) els.btnGenerate.addEventListener('click', generateWebsite);
    }

    function goToStep(index) {
        const totalSteps = stepsOrder.length;
        currentStepIndex = index;
        const stepId = stepsOrder[index - 1];

        document.querySelectorAll('.builder-step').forEach(s => s.classList.remove('active'));
        const stepEl = document.querySelector(`.builder-step[data-step="${stepId}"]`);
        if (stepEl) stepEl.classList.add('active');

        const dots = els.stepIndicators.querySelectorAll('.step-dot');
        const lines = els.stepIndicators.querySelectorAll('.step-line');

        dots.forEach((dot, idx) => {
            const dotNum = idx + 1;
            dot.classList.remove('active', 'completed');
            if (dotNum === index) dot.classList.add('active');
            if (dotNum < index) dot.classList.add('completed');
        });

        lines.forEach((line, idx) => {
            if (idx + 1 < index) line.classList.add('filled');
            else line.classList.remove('filled');
        });

        if (els.btnBack) els.btnBack.style.display = index === 1 ? 'none' : 'inline-block';

        if (index === totalSteps) {
            if (els.btnNext) els.btnNext.style.display = 'none';
            if (els.btnGenerate) els.btnGenerate.style.display = 'inline-flex';
            updateConfigSummary();
        } else {
            if (els.btnNext) {
                els.btnNext.style.display = 'inline-block';
                els.btnNext.textContent = 'Next Step →';
            }
            if (els.btnGenerate) els.btnGenerate.style.display = 'none';
        }
    }

    function validateCurrentStep() {
        const stepId = stepsOrder[currentStepIndex - 1];

        if (stepId === 'theme') {
            const themeInput = document.getElementById('themeInput');
            if (themeInput && !themeInput.value.trim()) {
                alert('Please describe your theme to continue.');
                return false;
            }
            if (themeInput) formData.theme = themeInput.value.trim();
            const industryInput = document.getElementById('industryInput');
            if (industryInput) formData.industry = industryInput.value.trim();
        }

        if (stepId === 'code') {
            const codeInput = document.getElementById('codeInput');
            if (codeInput && !codeInput.value.trim()) {
                alert('Please paste your existing code to continue.');
                return false;
            }
            if (codeInput) formData.code = codeInput.value.trim();
        }

        return true;
    }

    // ─── Input Handlers ──────────────────────────────────────────────────────────
    function setupThemeSuggestions() {
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const input = document.getElementById('themeInput');
                if (input) input.value = chip.dataset.theme;
                chip.style.borderColor = 'var(--accent-teal)';
                setTimeout(() => chip.style.borderColor = '', 300);
            });
        });
    }

    function setupColorPickers() {
        const inputs = ['Primary', 'Accent', 'Bg', 'Text'];
        inputs.forEach(id => {
            const input = document.getElementById(`color${id}`);
            const swatch = document.getElementById(`swatch${id}`);
            const hex = document.getElementById(`hex${id}`);
            const preview = document.getElementById('colorPreviewBar');

            if (!input) return;

            input.addEventListener('input', (e) => {
                const val = e.target.value;
                if (swatch) swatch.style.backgroundColor = val;
                if (hex) hex.textContent = val.toUpperCase();

                switch (id) {
                    case 'Primary': formData.colors.primary = val; break;
                    case 'Accent': formData.colors.accent = val; break;
                    case 'Bg': formData.colors.bg = val; break;
                    case 'Text': formData.colors.text = val; break;
                }

                if (preview) {
                    preview.style.backgroundColor = formData.colors.bg;
                    preview.style.color = formData.colors.text;
                    preview.style.borderColor = formData.colors.primary;
                    preview.style.boxShadow = `0 0 10px ${formData.colors.accent}40`;
                }
            });
        });
    }

    function setupFontSelectors() {
        const heading = document.getElementById('fontHeading');
        const body = document.getElementById('fontBody');

        if (heading) {
            heading.addEventListener('change', (e) => {
                formData.fonts.heading = e.target.value;
                const preview = document.getElementById('headingPreview');
                if (preview) preview.style.fontFamily = e.target.value;
            });
        }

        if (body) {
            body.addEventListener('change', (e) => {
                formData.fonts.body = e.target.value;
                const preview = document.getElementById('bodyPreview');
                if (preview) preview.style.fontFamily = e.target.value;
            });
        }
    }

    function setupDeviceToggles() {
        document.querySelectorAll('.device-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const device = btn.dataset.device;
                if (els.previewFrame) {
                    els.previewFrame.className = 'preview-frame';
                    if (device !== 'desktop') els.previewFrame.classList.add(device);
                }
            });
        });
    }

    function updateConfigSummary() {
        const notesInput = document.getElementById('notesInput');
        const codeInput = document.getElementById('codeInput');

        if (notesInput) formData.notes = notesInput.value.trim();
        if (codeInput) formData.code = codeInput.value.trim();

        let summaryHtml = '';

        if (stepsOrder.includes('code') && formData.code.length > 50) {
            summaryHtml += `<div class="config-item"><span class="config-label">Code:</span> <span class="config-value">Uploaded (${formData.code.length} chars)</span></div>`;
        }

        if (stepsOrder.includes('theme')) {
            summaryHtml += `<div class="config-item"><span class="config-label">Theme:</span> <span class="config-value">${formData.theme}</span></div>`;
        }

        if (stepsOrder.includes('colors')) {
            summaryHtml += `<div class="config-item"><span class="config-label">Colors:</span> 
                <span>
                <span class="config-swatch" style="background:${formData.colors.primary}"></span>
                <span class="config-swatch" style="background:${formData.colors.accent}"></span>
                <span class="config-swatch" style="background:${formData.colors.bg}"></span>
                </span>
            </div>`;
        }

        if (stepsOrder.includes('fonts')) {
            summaryHtml += `<div class="config-item"><span class="config-label">Fonts:</span> <span class="config-value">${formData.fonts.heading} / ${formData.fonts.body}</span></div>`;
        }

        if (els.configSummary) els.configSummary.innerHTML = summaryHtml || '<p>Ready to generate.</p>';
    }

    // ─── Game & Progress Logic ───────────────────────────────────────────────────
    const ProgressLogger = {
        interval: null,
        steps: [
            "Initializing Neural Network...",
            "Analyze Request Parameters...",
            "Constructing HTML Backbone...",
            "Generating CSS Grid Layout...",
            "Applying Theme Variables...",
            "Injecting Interaction Logic...",
            "Optimizing Responsive Views...",
            "Minifying Assets...",
            "Final Polish & Rendering..."
        ],
        init() {
            if (els.progressLog) els.progressLog.innerHTML = '';
        },
        start() {
            this.init();
            let i = 0;
            this.add(this.steps[0], 'process');
            this.interval = setInterval(() => {
                i++;
                if (i < this.steps.length) {
                    this.add(this.steps[i], 'process');
                }
            }, 1500);
        },
        stop() {
            clearInterval(this.interval);
            this.add("Generation Complete!", "success");
        },
        add(msg, type = 'info') {
            if (!els.progressLog) return;
            const div = document.createElement('div');
            div.className = `log-entry ${type}`;
            div.textContent = msg;
            els.progressLog.appendChild(div);
            els.progressLog.scrollTop = els.progressLog.scrollHeight;
        }
    };

    const SnakeGame = {
        canvas: null,
        ctx: null,
        overlay: null,
        scoreEl: null,
        interval: null,

        grid: 20,
        snake: [],
        food: { x: 0, y: 0 },
        dx: 0,
        dy: 0,
        score: 0,
        isPlaying: false,

        init() {
            this.canvas = els.gameCanvas;
            this.overlay = els.gameOverlay;
            this.scoreEl = els.gameScore;

            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');

            // Resize canvas contextually if needed, but fixed size is usually better for snake
            this.reset();

            // Keyboard input
            document.addEventListener('keydown', (e) => this.handleInput(e));
        },

        start() {
            if (this.isPlaying) return;
            this.isPlaying = true;
            if (this.overlay) this.overlay.classList.add('hidden');
            this.reset();
            this.interval = setInterval(() => this.loop(), 100);
        },

        stop() {
            this.isPlaying = false;
            clearInterval(this.interval);
            if (this.overlay) this.overlay.classList.remove('hidden');
        },

        reset() {
            this.snake = [{ x: 160, y: 160 }, { x: 140, y: 160 }, { x: 120, y: 160 }];
            this.dx = this.grid; // moving right
            this.dy = 0;
            this.score = 0;
            if (this.scoreEl) this.scoreEl.textContent = '0';
            this.spawnFood();
            this.draw();
        },

        spawnFood() {
            if (!this.canvas) return;
            this.food.x = Math.floor(Math.random() * (this.canvas.width / this.grid)) * this.grid;
            this.food.y = Math.floor(Math.random() * (this.canvas.height / this.grid)) * this.grid;
        },

        handleInput(e) {
            // If in loading screen but game not started, start on any key
            if (els.loadingSection.style.display !== 'none' && !this.isPlaying) {
                this.start();
                e.preventDefault();
                return;
            }

            if (!this.isPlaying) return;

            const key = e.key;
            // Prevent scrolling with arrows
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(key) > -1) {
                e.preventDefault();
            }

            if (key === 'ArrowLeft' && this.dx === 0) { this.dx = -this.grid; this.dy = 0; }
            else if (key === 'ArrowUp' && this.dy === 0) { this.dy = -this.grid; this.dx = 0; }
            else if (key === 'ArrowRight' && this.dx === 0) { this.dx = this.grid; this.dy = 0; }
            else if (key === 'ArrowDown' && this.dy === 0) { this.dy = this.grid; this.dx = 0; }
        },

        loop() {
            if (!this.isPlaying || !this.canvas) return;

            // Move
            const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

            // Wrap walls
            if (head.x >= this.canvas.width) head.x = 0;
            if (head.x < 0) head.x = this.canvas.width - this.grid;
            if (head.y >= this.canvas.height) head.y = 0;
            if (head.y < 0) head.y = this.canvas.height - this.grid;

            // Check collision with self
            for (let i = 0; i < this.snake.length; i++) {
                if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                    this.stop(); // Game Over
                    return;
                }
            }

            this.snake.unshift(head);

            // Eat Food
            if (head.x === this.food.x && head.y === this.food.y) {
                this.score += 10;
                if (this.scoreEl) this.scoreEl.textContent = this.score;
                this.spawnFood();
            } else {
                this.snake.pop();
            }

            this.draw();
        },

        draw() {
            if (!this.ctx || !this.canvas) return;

            // Clear
            this.ctx.fillStyle = '#0B1120';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Food
            this.ctx.fillStyle = '#FF5F56';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#FF5F56';
            this.ctx.fillRect(this.food.x, this.food.y, this.grid - 1, this.grid - 1);

            // Snake
            this.ctx.fillStyle = '#14FFEC';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#14FFEC';
            this.snake.forEach((segment, index) => {
                // Head is slightly different color?
                if (index === 0) this.ctx.fillStyle = '#CFFFFB';
                else this.ctx.fillStyle = '#14FFEC';

                this.ctx.fillRect(segment.x, segment.y, this.grid - 1, this.grid - 1);
            });
            this.ctx.shadowBlur = 0;
        }
    };

    // ─── Gemini API Generation ───────────────────────────────────────────────────
    async function generateWebsite() {
        // 1. Show Gamified Loading
        els.builderWrapper.style.display = 'none';
        els.loadingSection.style.display = 'flex'; // Flex to center

        // Start Progress & Enable Game
        ProgressLogger.start();
        SnakeGame.reset(); // Show "Press Start" screen

        // 2. Construct Prompt
        const serviceConfig = SERVICES[currentService];
        let prompt = `
            You are an expert web developer.
            Task: ${serviceConfig.promptContext}
            Industry: ${formData.industry || 'General'}
            Service Type: ${currentService}
            User's Notes: ${formData.notes}
        `;

        if (stepsOrder.includes('code')) {
            prompt += `\nEXISTING CODE:\n${formData.code}\nINSTRUCTIONS: Analyze and ${currentService === 'maintenance' ? 'FIX' : 'REDESIGN'} it. Output FULL code.`;
        }

        if (stepsOrder.includes('theme')) prompt += `\nTarget Theme: ${formData.theme}`;
        if (stepsOrder.includes('colors')) prompt += `\nColors: Primary=${formData.colors.primary}, Accent=${formData.colors.accent}, Bg=${formData.colors.bg}, Text=${formData.colors.text}`;

        // Add font instructions...
        if (stepsOrder.includes('fonts')) {
            prompt += `\nFont: Heading="${formData.fonts.heading}", Body="${formData.fonts.body}". Load via Google Fonts.`;
        }

        prompt += `\nOutput ONLY raw HTML with embedded CSS/JS. No markdown.`;

        try {
            // 3. Call API
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            if (!data.candidates || !data.candidates[0].content) throw new Error('No content generated');

            let generatedCode = data.candidates[0].content.parts[0].text;
            generatedCode = generatedCode.replace(/```html/g, '').replace(/```/g, '');

            // 4. Render Results
            showResults(generatedCode);

        } catch (error) {
            console.error('Generation Error:', error);
            ProgressLogger.add(`Error: ${error.message}`, 'error');
            alert(`Error: ${error.message}`);
            // Return to builder
            els.loadingSection.style.display = 'none';
            els.builderWrapper.style.display = 'block';
            SnakeGame.stop();
        }
    }

    function showResults(code) {
        // Stop Game & Logger
        SnakeGame.stop();
        ProgressLogger.stop();

        // Transition
        setTimeout(() => {
            els.loadingSection.style.display = 'none';
            els.resultsSection.style.display = 'block';

            els.codeOutput.textContent = code;
            els.previewFrame.removeAttribute('src');
            els.previewFrame.srcdoc = code;

            els.resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 1000); // Small delay to show "Complete" message
    }

    // Start
    document.addEventListener('DOMContentLoaded', init);

})();
