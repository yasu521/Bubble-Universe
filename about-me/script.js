// Natural Design About Me Website JavaScript
// Handles hero slideshow, category filtering, parallax, and gallery effects

class NaturalAboutMeWebsite {
    constructor() {
        this.init();
        this.bindEvents();
        this.setupIntersectionObserver();
        this.setupHeroSlideshow();
        this.setupCategoryFilter();
        this.setupGallery();
        this.setupSolutionCardsSection();
        this.setupFeaturedArtSection();
    }

    init() {
        // Cache DOM elements
        this.header = document.querySelector('.fixed-header');
        this.currentSectionEl = document.getElementById('currentSection');
        this.sections = document.querySelectorAll('[data-section]');
        this.parallaxElements = document.querySelectorAll('[data-speed]');
        this.galleryItems = document.querySelectorAll('.gallery-item');
        this.solutionCards = document.querySelectorAll('.solution-card');
        
        // Hero slideshow elements
        this.heroSlides = document.querySelectorAll('.hero-image-slide');
        this.indicators = document.querySelectorAll('.indicator');
        
        // Category filter elements
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.projectItems = document.querySelectorAll('.project-item');
        
        // State
        this.currentSection = 'Introduction';
        this.currentSlide = 0;
        this.slideInterval = null;
        this.scrollY = 0;
        this.ticking = false;
        
        // Encryption characters for gallery effect
        this.encryptionChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~`0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        
        console.log('Natural About Me Website initialized');
    }

    bindEvents() {
        // Scroll event with throttling
        window.addEventListener('scroll', () => {
            this.scrollY = window.pageYOffset;
            if (!this.ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    this.ticking = false;
                });
                this.ticking = true;
            }
        });

        // Resize event
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Hero slide indicators
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                this.goToSlide(index);
            });
        });

        // Category filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleCategoryFilter(e.target);
            });
        });

        // Smooth scroll for internal links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    this.smoothScrollTo(target);
                }
            }
        });
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '-20% 0px -20% 0px',
            threshold: 0.5
        };

        this.sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionName = entry.target.getAttribute('data-section');
                    this.updateCurrentSection(sectionName);
                    this.handleSectionInView(entry.target);
                }
            });
        }, options);

        // Observe all sections
        this.sections.forEach(section => {
            this.sectionObserver.observe(section);
        });

        // Animation observer for fade-in effects
        const animationOptions = {
            root: null,
            rootMargin: '0px 0px -100px 0px',
            threshold: 0.1
        };

        this.animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, animationOptions);

        // Observe elements for animation
        const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
        animatedElements.forEach(el => {
            this.animationObserver.observe(el);
        });
    }

    setupHeroSlideshow() {
        // Start automatic slideshow
        this.startSlideshow();
        
        // Pause on hover
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.addEventListener('mouseenter', () => {
                this.pauseSlideshow();
            });
            
            heroSection.addEventListener('mouseleave', () => {
                this.startSlideshow();
            });
        }
    }

    setupCategoryFilter() {
        // Initialize with all projects visible
        this.filterProjects('all');
    }

    setupGallery() {
        // Setup gallery hover effects
        this.galleryItems.forEach((item, index) => {
            const overlay = item.querySelector('.encryption-overlay');
            const encryptedText = item.querySelector('.encrypted-text');
            
            if (overlay && encryptedText) {
                item.addEventListener('mouseenter', () => {
                    this.startEncryptionEffect(encryptedText);
                });
                
                item.addEventListener('mouseleave', () => {
                    this.stopEncryptionEffect(encryptedText);
                });
            }
        });
    }

    setupSolutionCardsSection() {
        // GSAPとScrollTriggerが読み込まれているか確認
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.error('GSAP or ScrollTrigger is not loaded');
            return;
        }

        console.log('Setting up Solution Cards Section');

        // Intro部分のアニメーション
        gsap.set('.solution-intro-content', { opacity: 0, y: 30 });
        
        const introTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: '.solution-cards-section',
                start: 'top 80%',
                end: 'top 20%',
                scrub: true,
                // markers: true, // デバッグ用、必要に応じて有効化
            }
        });

        introTimeline
            .to('.solution-intro-content', {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power2.out'
            });

        // 各カードのアニメーション
        gsap.utils.toArray('.solution-card').forEach((card, index) => {
            // カードの初期スタイル設定
            gsap.set(card, { 
                opacity: 0, 
                y: 50,
                zIndex: 10 - index // スタッキング順序
            });
            
            // カード内のコンテンツ要素
            const cardHeader = card.querySelector('.card-header');
            const cardDescription = card.querySelector('.card-description');
            const cardImage = card.querySelector('.card-image');
            const cardLink = card.querySelector('.card-link');
            
            // 内部コンテンツの初期スタイル設定
            gsap.set([cardHeader, cardDescription, cardImage, cardLink], { 
                opacity: 0, 
                y: 20 
            });
            
            // カードごとのタイムライン
            const cardTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: card,
                    start: 'top bottom-=100',
                    end: 'top center-=100',
                    scrub: 0.4,
                    // markers: true, // デバッグ用
                }
            });
            
            // スタッキング効果のための固定位置（前のカードの一部が見える位置）
            const pinSpacePercentage = 18 * (index); // 各カードは前のカードより少し下に固定
            
            // カード本体のアニメーション
            cardTimeline
                .to(card, {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                })
                .to(cardHeader, {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                }, '-=0.2')
                .to(cardDescription, {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                }, '-=0.1')
                .to(cardImage, {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                }, '-=0.1')
                .to(cardLink, {
                    opacity: 1,
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                }, '-=0.1');
            
            // カードのスタッキング効果（前のカードを部分的に見せる）
            if (index < 4) { // 最後のカードはスタッキングしない
                ScrollTrigger.create({
                    trigger: card,
                    start: `top+=${pinSpacePercentage}% center`,
                    end: 'bottom top',
                    pin: true,
                    pinSpacing: false,
                    // markers: true, // デバッグ用
                });
            }
        });
        
        // 背景効果（インセクションに応じて色が変わる）
        gsap.timeline({
            scrollTrigger: {
                trigger: '.solution-cards-section',
                start: 'top top',
                end: 'bottom bottom',
                scrub: true,
            }
        })
        .fromTo('.solution-intro-bg', {
            backgroundPosition: '0% 0%',
        }, {
            backgroundPosition: '100% 100%',
            ease: 'none'
        });
    }

    handleScroll() {
        // Update header opacity based on scroll
        this.updateHeaderOpacity();
        
        // Handle scroll-based animations
        this.handleScrollAnimations();
    }

    updateHeaderOpacity() {
        const opacity = Math.min(this.scrollY / 100, 0.95);
        this.header.style.background = `rgba(255, 255, 255, ${0.95 + opacity * 0.05})`;
    }

    updateCurrentSection(sectionName) {
        if (this.currentSection !== sectionName) {
            this.currentSection = sectionName;
            this.animateCurrentSectionChange(sectionName);
        }
    }

    animateCurrentSectionChange(sectionName) {
        // Animate section title change
        this.currentSectionEl.style.opacity = '0';
        this.currentSectionEl.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            this.currentSectionEl.textContent = sectionName;
            this.currentSectionEl.style.opacity = '1';
            this.currentSectionEl.style.transform = 'translateY(0)';
        }, 150);
    }

    handleSectionInView(section) {
        // Add entrance animations for section content
        const content = section.querySelector('.section-content, .projects-container, .gallery-container');
        if (content && !content.classList.contains('animated')) {
            content.classList.add('animated');
            this.animateElementIn(content);
        }
    }

    // Hero Slideshow Methods
    startSlideshow() {
        this.slideInterval = setInterval(() => {
            this.nextSlide();
        }, 5000); // Change slide every 5 seconds
    }

    pauseSlideshow() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.heroSlides.length;
        this.goToSlide(nextIndex);
    }

    goToSlide(index) {
        // Remove active class from current slide and indicator
        this.heroSlides[this.currentSlide].classList.remove('active');
        this.indicators[this.currentSlide].classList.remove('active');
        
        // Add active class to new slide and indicator
        this.currentSlide = index;
        this.heroSlides[this.currentSlide].classList.add('active');
        this.indicators[this.currentSlide].classList.add('active');
    }

    // Category Filter Methods
    handleCategoryFilter(button) {
        const category = button.getAttribute('data-category');
        
        // Update active button
        this.filterBtns.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Filter projects
        this.filterProjects(category);
    }

    filterProjects(category) {
        this.projectItems.forEach((item, index) => {
            const itemCategory = item.getAttribute('data-category');
            const shouldShow = category === 'all' || itemCategory === category;
            
            if (shouldShow) {
                // Show with staggered animation
                setTimeout(() => {
                    item.classList.remove('hidden');
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 100);
            } else {
                // Hide immediately
                item.classList.add('hidden');
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
            }
        });
    }

    // Gallery Encryption Effects
    startEncryptionEffect(textElement) {
        const originalTexts = [
            'NATURAL_DESIGN_001',
            'SUSTAINABLE_PROTOCOL',
            'ECO_SYSTEM_ACTIVE',
            'GREEN_TECH_ONLINE',
            'HARMONY_NETWORK_UP'
        ];
        
        const randomText = originalTexts[Math.floor(Math.random() * originalTexts.length)];
        let iterations = 0;
        const maxIterations = 20;
        
        this.encryptionInterval = setInterval(() => {
            let scrambledText = '';
            
            for (let i = 0; i < randomText.length; i++) {
                if (iterations > i) {
                    scrambledText += randomText[i];
                } else {
                    scrambledText += this.encryptionChars[Math.floor(Math.random() * this.encryptionChars.length)];
                }
            }
            
            textElement.textContent = scrambledText;
            iterations++;
            
            if (iterations > maxIterations) {
                clearInterval(this.encryptionInterval);
            }
        }, 50);
    }

    stopEncryptionEffect(textElement) {
        if (this.encryptionInterval) {
            clearInterval(this.encryptionInterval);
        }
        textElement.textContent = '';
    }

    animateElementIn(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }

    handleScrollAnimations() {
        // Add scroll-based animations for various elements
        const animatedElements = document.querySelectorAll('.image-container, .skill-item, .project-item');
        
        animatedElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible && !element.classList.contains('scroll-animated')) {
                element.classList.add('scroll-animated');
                this.animateElementIn(element);
            }
        });
    }

    smoothScrollTo(target) {
        const targetPosition = target.offsetTop - 80; // Account for fixed header
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 1000;
        let start = null;

        const animation = (currentTime) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        };

        requestAnimationFrame(animation);
    }

    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    handleResize() {
        // Recalculate positions and animations on resize
        // No specific actions needed for current implementation
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Cleanup method
    destroy() {
        this.pauseSlideshow();
        if (this.sectionObserver) {
            this.sectionObserver.disconnect();
        }
        if (this.animationObserver) {
            this.animationObserver.disconnect();
        }
        if (this.encryptionInterval) {
            clearInterval(this.encryptionInterval);
        }
    }
}

// Page initialization
document.addEventListener('DOMContentLoaded', () => {
    const website = new NaturalAboutMeWebsite();
    
    // ScrollTriggerの更新（リサイズや動的コンテンツ変更に対応）
    window.addEventListener('resize', () => {
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    });
});

// Add some additional CSS animations via JavaScript
const additionalStyles = `
    .scroll-animated {
        animation: slideInUp 0.8s ease-out;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animated {
        animation: fadeInScale 1s ease-out;
    }
    
    @keyframes fadeInScale {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .project-item {
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .hero-image-slide {
        transition: opacity 1.5s ease-in-out;
    }
    
    .filter-btn {
        transition: all 0.3s ease;
    }
    
    .indicator {
        transition: all 0.3s ease;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
