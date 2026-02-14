/**
 * MOS Logix — EN/AR Translation System
 * Lightweight i18n with localStorage persistence and RTL support.
 */

const translations = {
    en: {
        // Navbar
        'nav.home': 'Home',
        'nav.services': 'Services',
        'nav.about': 'About',
        'nav.contact': 'Contact',
        'nav.quiz': 'Free Assessment',

        // Hero (index)
        'hero.label': 'Modern Optimized Solutions',
        'hero.title.prefix': 'Engineering the ',
        'hero.title.gradient': 'Digital Future',
        'hero.subtitle': 'Websites built like software—fast, scalable, converting. We craft digital experiences that transform visitors into loyal customers.',
        'hero.cta.start': 'Start Project',
        'hero.cta.quiz': 'Take Free Assessment',
        'hero.cta.sample': 'Get a Sample',
        'hero.scroll': 'Scroll to explore',

        // Services Preview (index)
        'services.label': 'What We Do',
        'services.title': 'Premium Digital Services',
        'services.subtitle': 'From concept to launch, we deliver solutions that drive real business results.',
        'services.web.title': 'Web Development',
        'services.web.desc': 'Custom-built, high-performance websites with clean architecture. Every line of code optimized for speed and scalability.',
        'services.ui.title': 'UI/UX Design',
        'services.ui.desc': 'Interfaces that look stunning and convert. Research-backed design decisions that guide users exactly where you want them.',
        'services.perf.title': 'Performance',
        'services.perf.desc': 'Lightning-fast load times, 90+ Lighthouse scores. Code-level optimization that keeps your users engaged.',

        // Social Proof (index)
        'proof.label': 'Why Us',
        'proof.title': 'Built Different',
        'proof.subtitle': 'We don\'t just build websites—we engineer digital assets.',

        // CTA Section (index)
        'cta.title': 'Ready to Go Digital?',
        'cta.subtitle': 'Take our free 2-minute assessment to see if your business needs a digital upgrade.',
        'cta.btn': 'Start Free Assessment',
        'cta.note': 'No email required • Instant results • Takes 2 minutes',

        // Footer
        'footer.desc': 'Engineering high-performance digital solutions for modern businesses.',
        'footer.nav': 'Navigate',
        'footer.connect': 'Connect',
        'footer.copyright': '© 2026 MOS Logix. All rights reserved.',

        // Services page
        'services.page.label': 'Our Services',
        'services.page.title': 'Digital Solutions, Engineered',
        'services.page.subtitle': 'From concept to deployment, every project is built with precision.',
        'services.website.title': 'Custom Websites',
        'services.website.desc': 'Hand-coded, lightning-fast websites built from scratch. No templates, no WordPress—just clean, modern code.',
        'services.webapp.title': 'Web Applications',
        'services.webapp.desc': 'Full-stack web applications with custom backends, APIs, and databases. Built for scale.',
        'services.ecommerce.title': 'E-Commerce',
        'services.ecommerce.desc': 'Online stores that convert. Custom shopping experiences with secure payments and inventory management.',
        'services.maintenance.title': 'Maintenance & Support',
        'services.maintenance.desc': 'Ongoing updates, bug fixes, and performance monitoring. We keep your digital assets running smooth.',
        'services.redesign.title': 'Website Redesign',
        'services.redesign.desc': 'Transform your outdated site into a modern, fast, converting machine. Same brand, new power.',
        'services.tech': 'Tech',
        'services.timeline': 'Timeline',
        'services.package': 'Package',
        'services.plan': 'Plan',
        'services.scope': 'Scope',
        'services.experience': 'Experience It',
        'services.tryit': '🚀 Try It Free',

        // Contact page
        'contact.label': 'Get In Touch',
        'contact.title': 'Start Your Project',
        'contact.subtitle': 'Ready to build something amazing? Fill out the form and we\'ll get back to you within 24 hours.',
        'contact.name': 'Full Name',
        'contact.name.placeholder': 'Your name',
        'contact.email': 'Email Address',
        'contact.email.placeholder': 'your@email.com',
        'contact.type': 'Project Type',
        'contact.type.placeholder': 'Select project type',
        'contact.type.website': 'Custom Website',
        'contact.type.webapp': 'Web Application',
        'contact.type.ecommerce': 'E-Commerce Store',
        'contact.type.redesign': 'Website Redesign',
        'contact.type.maintenance': 'Maintenance',
        'contact.type.other': 'Other',
        'contact.budget': 'Project Budget',
        'contact.budget.placeholder': 'Select budget range',
        'contact.message': 'Project Details',
        'contact.message.placeholder': 'Tell us about your project...',
        'contact.submit': 'Send Message',
        'contact.info.title': 'Contact Info',
        'contact.info.email': 'Email',
        'contact.info.phone': 'Phone',
        'contact.social.title': 'Connect With Us',

        // About page
        'about.label': 'About Us',
        'about.title': 'Modern Optimized Solutions',
        'about.subtitle': 'We\'re a team of developers and designers who believe the web deserves better.',

        // Quiz page
        'quiz.title': 'Free Business Assessment',
        'quiz.subtitle': 'Discover if your company needs a website and get projected growth statistics.',

        // Misc
        'lang.switch': 'عربي',
    },

    ar: {
        // Navbar
        'nav.home': 'الرئيسية',
        'nav.services': 'الخدمات',
        'nav.about': 'من نحن',
        'nav.contact': 'تواصل معنا',
        'nav.quiz': 'تقييم مجاني',

        // Hero (index)
        'hero.label': 'حلول حديثة ومُحسّنة',
        'hero.title.prefix': 'نهندس ',
        'hero.title.gradient': 'المستقبل الرقمي',
        'hero.subtitle': 'مواقع مبنية كبرمجيات — سريعة، قابلة للتوسع، وتحقق نتائج. نصنع تجارب رقمية تحوّل الزوار إلى عملاء دائمين.',
        'hero.cta.start': 'ابدأ مشروعك',
        'hero.cta.quiz': 'تقييم مجاني',
        'hero.cta.sample': 'احصل على عيّنة',
        'hero.scroll': 'اسحب للاستكشاف',

        // Services Preview (index)
        'services.label': 'ما نقدمه',
        'services.title': 'خدمات رقمية مميزة',
        'services.subtitle': 'من الفكرة إلى الإطلاق، نقدم حلولاً تحقق نتائج أعمال حقيقية.',
        'services.web.title': 'تطوير المواقع',
        'services.web.desc': 'مواقع مخصصة وعالية الأداء بهندسة نظيفة. كل سطر كود مُحسّن للسرعة والقابلية للتوسع.',
        'services.ui.title': 'تصميم UI/UX',
        'services.ui.desc': 'واجهات مذهلة تحقق التحويلات. قرارات تصميم مبنية على أبحاث توجه المستخدمين بدقة.',
        'services.perf.title': 'الأداء',
        'services.perf.desc': 'سرعة تحميل فائقة، نتائج Lighthouse 90+. تحسين على مستوى الكود يبقي المستخدمين متفاعلين.',

        // Social Proof (index)
        'proof.label': 'لماذا نحن',
        'proof.title': 'صُنعنا مختلفين',
        'proof.subtitle': 'نحن لا نبني مواقع فقط — بل نهندس أصولاً رقمية.',

        // CTA Section (index)
        'cta.title': 'جاهز للتحول الرقمي؟',
        'cta.subtitle': 'خذ تقييمنا المجاني لمدة دقيقتين لمعرفة إذا كان عملك يحتاج تحديث رقمي.',
        'cta.btn': 'ابدأ التقييم المجاني',
        'cta.note': 'بدون بريد إلكتروني • نتائج فورية • يستغرق دقيقتين',

        // Footer
        'footer.desc': 'نهندس حلولاً رقمية عالية الأداء للأعمال الحديثة.',
        'footer.nav': 'التنقل',
        'footer.connect': 'تواصل',
        'footer.copyright': '© 2026 MOS Logix. جميع الحقوق محفوظة.',

        // Services page
        'services.page.label': 'خدماتنا',
        'services.page.title': 'حلول رقمية، مهندسة بدقة',
        'services.page.subtitle': 'من الفكرة إلى النشر، كل مشروع يُبنى بدقة.',
        'services.website.title': 'مواقع مخصصة',
        'services.website.desc': 'مواقع مكتوبة يدوياً بسرعة فائقة. بدون قوالب، بدون ووردبريس — فقط كود حديث ونظيف.',
        'services.webapp.title': 'تطبيقات ويب',
        'services.webapp.desc': 'تطبيقات ويب متكاملة مع خوادم وواجهات برمجة وقواعد بيانات مخصصة. مبنية للتوسع.',
        'services.ecommerce.title': 'التجارة الإلكترونية',
        'services.ecommerce.desc': 'متاجر إلكترونية تحقق مبيعات. تجارب تسوق مخصصة مع مدفوعات آمنة وإدارة مخزون.',
        'services.maintenance.title': 'الصيانة والدعم',
        'services.maintenance.desc': 'تحديثات مستمرة، إصلاح أخطاء، ومراقبة الأداء. نحافظ على أصولك الرقمية بسلاسة.',
        'services.redesign.title': 'إعادة تصميم المواقع',
        'services.redesign.desc': 'حوّل موقعك القديم إلى آلة حديثة وسريعة ومحوّلة. نفس العلامة التجارية، قوة جديدة.',
        'services.tech': 'التقنيات',
        'services.timeline': 'المدة الزمنية',
        'services.package': 'الباقة',
        'services.plan': 'الخطة',
        'services.scope': 'النطاق',
        'services.experience': 'جرّبه',
        'services.tryit': '🚀 جرّب مجاناً',

        // Contact page
        'contact.label': 'تواصل معنا',
        'contact.title': 'ابدأ مشروعك',
        'contact.subtitle': 'جاهز لبناء شيء مذهل؟ املأ النموذج وسنرد عليك خلال 24 ساعة.',
        'contact.name': 'الاسم الكامل',
        'contact.name.placeholder': 'اسمك',
        'contact.email': 'البريد الإلكتروني',
        'contact.email.placeholder': 'your@email.com',
        'contact.type': 'نوع المشروع',
        'contact.type.placeholder': 'اختر نوع المشروع',
        'contact.type.website': 'موقع مخصص',
        'contact.type.webapp': 'تطبيق ويب',
        'contact.type.ecommerce': 'متجر إلكتروني',
        'contact.type.redesign': 'إعادة تصميم موقع',
        'contact.type.maintenance': 'صيانة',
        'contact.type.other': 'أخرى',
        'contact.budget': 'ميزانية المشروع',
        'contact.budget.placeholder': 'اختر نطاق الميزانية',
        'contact.message': 'تفاصيل المشروع',
        'contact.message.placeholder': 'أخبرنا عن مشروعك...',
        'contact.submit': 'إرسال الرسالة',
        'contact.info.title': 'معلومات التواصل',
        'contact.info.email': 'البريد الإلكتروني',
        'contact.info.phone': 'الهاتف',
        'contact.social.title': 'تواصل معنا',

        // About page
        'about.label': 'من نحن',
        'about.title': 'حلول حديثة ومُحسّنة',
        'about.subtitle': 'نحن فريق من المطورين والمصممين الذين يؤمنون بأن الويب يستحق الأفضل.',

        // Quiz page
        'quiz.title': 'تقييم الأعمال المجاني',
        'quiz.subtitle': 'اكتشف إذا كانت شركتك تحتاج موقعاً واحصل على إحصائيات النمو المتوقعة.',

        // Misc
        'lang.switch': 'English',
    }
};

/**
 * Apply translations to all elements with data-i18n attributes.
 * Also handles data-i18n-placeholder for input placeholders.
 */
function setLanguage(lang) {
    const dict = translations[lang];
    if (!dict) return;

    // Store preference
    localStorage.setItem('mos-lang', lang);

    // Update HTML attributes
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    // Apply translations
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });

    // Apply placeholder translations
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) {
            el.setAttribute('placeholder', dict[key]);
        }
    });

    // Update language switcher button text
    document.querySelectorAll('.lang-switch').forEach(btn => {
        btn.textContent = dict['lang.switch'] || (lang === 'ar' ? 'English' : 'عربي');
    });
}

/**
 * Toggle between English and Arabic
 */
function toggleLanguage() {
    const current = localStorage.getItem('mos-lang') || 'en';
    setLanguage(current === 'en' ? 'ar' : 'en');
}

// Auto-apply saved language on load
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('mos-lang');
    if (saved && saved !== 'en') {
        setLanguage(saved);
    }
});
