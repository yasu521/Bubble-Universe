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
        this.setupInvertedSections();
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
                initializeSolutionCards() {
                const t = document.querySelector(".index__solutioncards");
                if (!t)
                    return;
                const e = t.querySelector(".index__solutioncards__startingpoint")
                  , r = t.querySelector(".index__solutioncards__startingpoint__bg")
                  , n = t.querySelector(".index__solutioncards__startingpoint__bg video")
                  , i = (t.querySelector(".index__solutioncards__startingpoint__body"),
                t.querySelector(".index__solutioncards__body__title"))
                  , o = t.querySelector(".index__solutioncards__startingpoint__body__main")
                  , s = e.querySelectorAll(".textline")
                  , a = new al(s)
                  , l = t.querySelector(".index__solutioncards__main")
                  , c = l.querySelector(".index__solutioncards__container")
                  , u = l.querySelectorAll(".index__solutioncards__main__card")
                  , d = Array.from(u).map((t => t.querySelector(".index__solutioncards__main__card__bg img")))
                  , f = Array.from(u).map((t => new al(t.querySelectorAll(".textline"))));
                gsap.fromTo(n, {
                    yPercent: -20
                }, {
                    yPercent: 0,
                    ease: "none",
                    scrollTrigger: {
                        trigger: e,
                        start: () => "top bottom",
                        end: () => "top+=" + window.lvh + " bottom",
                        scrub: !0,
                        invalidateOnRefresh: !0
                    }
                }),
                gsap.fromTo(n, {
                    yPercent: 0
                }, {
                    yPercent: 20,
                    ease: "none",
                    scrollTrigger: {
                        trigger: t,
                        start: () => "bottom bottom",
                        end: () => "bottom+=" + window.lvh + " bottom",
                        scrub: !0,
                        invalidateOnRefresh: !0
                    }
                }),
                ScrollTrigger.create({
                    trigger: r,
                    start: "top top",
                    endTrigger: t,
                    end: "bottom bottom",
                    pin: !0,
                    pinSpacing: !1,
                    onEnter: () => {}
                    ,
                    onEnterBack: () => {}
                    ,
                    onLeave: () => {}
                    ,
                    onLeaveBack: () => {}
                    ,
                    onUpdate: t => {}
                }),
                ScrollTrigger.create({
                    trigger: o,
                    start: () => "top-=" + ("pc" == window.currentContext ? rpx(84) : rpx(30)) + " top",
                    endTrigger: t,
                    end: "bottom bottom",
                    pin: !0,
                    pinSpacing: !1
                }),
                ScrollTrigger.create({
                    trigger: e,
                    start: "top-=" + window.lvh / 2 + " top",
                    end: () => "top top",
                    onUpdate: t => {
                        e.style.setProperty("--startingpoint-progress", 1 - t.progress)
                    }
                }),
                ScrollTrigger.create({
                    trigger: e,
                    start: "top-=" + window.lvh / 2 + " top",
                    end: () => "top top",
                    onUpdate: t => {
                        a.textProgress(t.progress)
                    }
                }),
                ScrollTrigger.create({
                    trigger: e,
                    start: () => "top-=" + window.lvh / 2 + " top",
                    end: () => "top top",
                    onUpdate: t => {
                        i.style.opacity = 1 - t.progress
                    }
                }),
                ScrollTrigger.create({
                    trigger: c,
                    start: "top top",
                    endTrigger: l,
                    end: "bottom bottom",
                    pin: !0,
                    pinSpacing: !1
                }),
                ScrollTrigger.create({
                    trigger: l,
                    start: "top top",
                    end: "bottom bottom",
                    onUpdate: t => {
                        const e = 8 * t.progress;
                        l.style.setProperty("--main-progress", 1 - t.progress),
                        window.vw / window.lvh > 1 ? f.forEach(( (t, r) => {
                            2 * r + 1 > e ? t.textProgress(0) : 2 * r + 1 <= e && 2 * r + 2 > e ? t.textProgress(e - (2 * r + 1)) : 2 * r + 2 <= e && t.textProgress(1)
                        }
                        )) : f.forEach(( (t, r) => {
                            2 * r > e ? t.textProgress(0) : 2 * r <= e && 2 * r + 2 > e ? t.textProgress((e - (2 * r + .7)) / 1.3) : 2 * r + 2 <= e && t.textProgress(1)
                        }
                        ));
                        const r = 4 * t.progress;
                        d.forEach(( (t, e) => {
                            const n = Math.min(2, Math.max(0, r - e));
                            n <= 1 ? t.style.transform = "translateY(" + -20 * (1 - n) + "%)" : 1 < n && (t.style.transform = "translateY(" + 40 * (1 - n) + "%)")
                        }
                        ))
                    }
                });

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

        // カードの初期z-indexを保存
        const zIndexStore = {};
        const cards = gsap.utils.toArray('.solution-card');
        const totalCards = cards.length;
        
        // スタック用のコンテナを作成
        const stackContainer = document.createElement('div');
        stackContainer.className = 'solution-cards-stack-container';
        const firstCard = cards[0];
        firstCard.parentNode.insertBefore(stackContainer, firstCard);
        
        // カードを全体的に扱うためのマスタータイムライン
        const masterTimeline = gsap.timeline();
        
        // 各カードのアニメーション
        cards.forEach((card, index) => {
            // カードの初期スタイル設定 - z-indexを逆転させる (1枚目が一番下、5枚目が一番上)
            const zIndex = index + 1; // 1枚目は1、5枚目は5になる
            
            gsap.set(card, { 
                opacity: 0, 
                y: 100,  // より下から上昇させる
                scale: 0.8,  // 初期サイズを小さく
                zIndex: zIndex // 1枚目が一番低く、5枚目が一番高い
            });
            
            // z-indexを保存
            zIndexStore[index] = zIndex;
            
            // カード内のコンテンツ要素
            const cardHeader = card.querySelector('.card-header');
            const cardDescription = card.querySelector('.card-description');
            const cardImage = card.querySelector('.card-image');
            const cardLink = card.querySelector('.card-link');
            
            // 内部コンテンツの初期スタイル設定 - 初期状態では薄く表示
            gsap.set([cardHeader, cardDescription], { 
                opacity: 0.3, 
                y: 20,
                color: '#aaa'  // 薄い色で初期化
            });
            
            gsap.set([cardImage, cardLink], { 
                opacity: 0, 
                y: 20 
            });
            
            // カードごとのタイムライン - 登場アニメーション
            const cardEnterTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: card,
                    start: 'top bottom-=100', // より早く登場アニメーションを開始
                    end: 'center center-=150', // より早く登場アニメーションを完了
                    scrub: 0.6,
                    // markers: true, // デバッグ用
                    onEnter: () => {
                        console.log(`Card ${index} entering view`);
                    }
                }
            });
            
            // カード本体の登場アニメーション
            cardEnterTimeline
                .to(card, {
                    opacity: 1,
                    y: 0,
                    scale: 1,  // 実寸大に拡大
                    duration: 1,
                    ease: 'power2.out'
                })
                .to([cardHeader, cardDescription], {
                    opacity: 1,
                    y: 0,
                    color: '#000',  // 濃い色に変化
                    duration: 0.3,
                    ease: 'power2.out'
                }, '-=0.2')
                .to([cardImage, cardLink], {
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    ease: 'power2.out'
                }, '-=0.1');
        });
        
        // 新しいスタッキングシステム
        // 各カードのピン設定
        cards.forEach((card, index) => {
            // 各カードの位置を固定するためのスクロールトリガー
            const cardPin = ScrollTrigger.create({
                trigger: card,
                start: 'top center-=150', // カードが画面中央より少し上に来た時に固定開始
                endTrigger: index < totalCards - 1 ? cards[index + 1] : '.solution-cards-section', // 次のカードが表示されるまで固定
                end: index < totalCards - 1 ? 'top center-=100' : 'bottom bottom', // 次のカードがピン位置に来たら固定解除
                pin: true,
                pinSpacing: false,
                id: `card-pin-${index}`,
                // markers: true, // デバッグ用
                onEnter: () => {
                    console.log(`Card ${index} pinned`);
                    
                    // カードが画面に入った時のアニメーション
                    gsap.to(card, {
                        zIndex: zIndexStore[index],
                        duration: 0.1
                    });
                    
                    // カードのコンテンツを明るく表示
                    gsap.to([card.querySelector('.card-header'), card.querySelector('.card-description')], {
                        opacity: 1,
                        color: '#000',
                        duration: 0.3
                    });
                    
                    // スタック状態のクラスを追加
                    card.classList.add('stacked');
                    
                    // 既にスタックされたカードをさらに背後に
                    for (let i = 0; i < index; i++) {
                        gsap.to(cards[i], {
                            y: 5 * (index - i), // 前のカードを少し下げる
                            duration: 0.3,
                            ease: 'power1.out'
                        });
                    }
                },
                onLeave: () => {
                    // カードが画面から出る時、次のカードが現れるので
                    // カードが背後に移動するように見せる
                    console.log(`Card ${index} leaving`);
                    
                    // テキストを再び薄く
                    gsap.to([card.querySelector('.card-header'), card.querySelector('.card-description')], {
                        opacity: 0.3,
                        color: '#aaa',
                        duration: 0.3
                    });
                    
                    // カードが次に移動するときのアニメーション
                    if (index < totalCards - 1) {
                        card.classList.add('scrolling-up');
                    }
                },
                onEnterBack: () => {
                    // スクロールを戻った時、カードを再表示
                    console.log(`Card ${index} entering back`);
                    
                    // z-indexを元に戻す
                    gsap.to(card, {
                        zIndex: zIndexStore[index],
                        duration: 0.1
                    });
                    
                    // カードのコンテンツを明るく表示
                    gsap.to([card.querySelector('.card-header'), card.querySelector('.card-description')], {
                        opacity: 1,
                        color: '#000',
                        duration: 0.3
                    });
                    
                    // スクロールアップ状態を解除
                    card.classList.remove('scrolling-up');
                },
                onLeaveBack: () => {
                    console.log(`Card ${index} leaving back`);
                    // スタック状態を解除
                    card.classList.remove('stacked');
                    
                    // 前のカードの位置を元に戻す
                    for (let i = 0; i < index; i++) {
                        gsap.to(cards[i], {
                            y: 0,
                            duration: 0.3,
                            ease: 'power1.out'
                        });
                    }
                }
            });
        });
        
        // 全カードが揃った後、一緒にスクロールする処理
        // 最後のカードが表示された後のアニメーション
        const finalCardTrigger = ScrollTrigger.create({
            trigger: cards[totalCards - 1],
            start: 'center center-=100',
            end: 'bottom top',
            // markers: true, // デバッグ用
            id: 'final-card-trigger',
            onEnter: () => {
                console.log('All cards stacked, now scrolling together');
                
                // 少し待ってから全カードを一緒にスクロールさせる
                setTimeout(() => {
                    // 全てのカードを含むグループとして扱う
                    cards.forEach(card => {
                        card.classList.add('stack-group');
                    });
                    
                    // 一緒にスクロールアップするためのアニメーション
                    // 全てのカードのピン設定を調整
                    ScrollTrigger.getAll().forEach(trigger => {
                        if (trigger.vars.id && trigger.vars.id.startsWith('card-pin-')) {
                            // ピン設定を無効化する前に、カードの位置を記録
                            const cardIndex = parseInt(trigger.vars.id.split('-')[2]);
                            const cardElement = cards[cardIndex];
                            
                            // カードの現在の位置を固定
                            const rect = cardElement.getBoundingClientRect();
                            gsap.set(cardElement, {
                                position: 'absolute',
                                top: `${window.scrollY + rect.top}px`,
                                left: `${rect.left}px`,
                                width: `${rect.width}px`,
                                height: `${rect.height}px`,
                                zIndex: zIndexStore[cardIndex]
                            });
                            
                            // ピン設定を無効化
                            trigger.disable();
                        }
                    });
                    
                    // 全てのカードをグループとして扱い、一緒に上にスクロールする効果
                    gsap.to(cards, {
                        y: (index) => -50 - (index * 5), // 上に少しスクロール、カードごとに少しずつ距離を変える
                        stagger: 0.05, // 少しずつ遅れて移動
                        duration: 0.5,
                        ease: 'power1.out',
                        scrollTrigger: {
                            trigger: cards[totalCards - 1],
                            start: 'center center-=100',
                            end: 'bottom top-=200',
                            scrub: 0.5,
                            // markers: true, // デバッグ用
                            id: 'group-scroll-trigger',
                            onLeave: () => {
                                // スクロールが終わったら、カードのスタイルを元に戻す
                                cards.forEach(card => {
                                    card.classList.add('scrolling-up');
                                });
                            },
                            onEnterBack: () => {
                                // スクロールを戻ったら、カードのスタイルを再設定
                                cards.forEach(card => {
                                    card.classList.remove('scrolling-up');
                                });
                            }
                        }
                    });
                }, 300); // 少し遅延させて実行
            }
        });
        
        // 「詳細を見る」リンクのクリックイベント設定
        cards.forEach((card) => {
            const detailLink = card.querySelector('.card-link a');
            if (detailLink) {
                detailLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = detailLink.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    
                    if (targetElement) {
                        // ScrollTriggerのpinnedな要素がある場合に備えて
                        ScrollTrigger.getAll().forEach(trigger => {
                            if (trigger.pin) {
                                trigger.disable();
                                setTimeout(() => trigger.enable(), 1500);
                            }
                        });
                        
                        // スムーズスクロール
                        gsap.to(window, {
                            duration: 1,
                            scrollTo: {
                                y: targetElement,
                                offsetY: 80
                            },
                            ease: 'power2.inOut'
                        });
                    }
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

    setupInvertedSections() {
        // GSAPとScrollTriggerが読み込まれているか確認
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.error('GSAP or ScrollTrigger is not loaded');
            return;
        }

        console.log('Setting up Inverted Sections');

        // 反転セクションごとにアニメーションを設定
        gsap.utils.toArray('.inverted-section').forEach((section, index) => {
            const sectionId = `inverted-section-${index}`;
            section.setAttribute('data-section-id', sectionId);
            
            // 反転効果のためのタイムライン
            const invertTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top 60%',
                    end: 'bottom 40%',
                    toggleActions: 'play reverse play reverse',
                    // markers: true, // デバッグ用
                    id: sectionId,
                    onEnter: () => {
                        console.log(`Entering inverted section ${sectionId}`);
                    },
                    onLeave: () => {
                        console.log(`Leaving inverted section ${sectionId}`);
                    }
                },
                onComplete: () => {
                    console.log(`Inversion complete for ${sectionId}`);
                }
            });
            
            // サイト全体の色を反転する
            invertTimeline
                .to('body', {
                    backgroundColor: '#000',
                    color: '#fff',
                    duration: 0.5,
                    ease: 'power2.inOut'
                })
                .to('.header', {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: '#fff',
                    duration: 0.5,
                    ease: 'power2.inOut'
                }, '-=0.5')
                .to('.nav-item a', {
                    color: '#fff',
                    duration: 0.5,
                    ease: 'power2.inOut'
                }, '-=0.5')
                .to('.logo', {
                    filter: 'invert(1)',
                    duration: 0.5,
                    ease: 'power2.inOut'
                }, '-=0.5')
                .to('.social-links a', {
                    color: '#fff',
                    duration: 0.5,
                    ease: 'power2.inOut'
                }, '-=0.5')
                .to('.footer', {
                    backgroundColor: '#111',
                    color: '#eee',
                    duration: 0.5,
                    ease: 'power2.inOut'
                }, '-=0.5');
                
            // セクション内の特定要素に追加のアニメーション
            const elements = section.querySelectorAll('.animate-on-invert');
            if (elements.length > 0) {
                invertTimeline.to(elements, {
                    scale: 1.05,
                    filter: 'brightness(1.2)',
                    duration: 0.6,
                    ease: 'power1.out'
                }, '-=0.3');
            }
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
