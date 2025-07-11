        // デバッグ情報を表示する関数
        function updateDebugInfo(message) {
            const debugElement = document.getElementById('debug-info');
            if (debugElement) {
                const now = new Date();
                const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
                debugElement.innerHTML += `<div>[${timestamp}] ${message}</div>`;
                debugElement.scrollTop = debugElement.scrollHeight;
            }
        }
        
        // コンソールログをオーバーライド
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;
        
        console.log = function(message, ...args) {
            originalConsoleLog.apply(console, [message, ...args]);
            updateDebugInfo('LOG: ' + message);
        };
        
        console.error = function(message, ...args) {
            originalConsoleError.apply(console, [message, ...args]);
            updateDebugInfo('ERROR: ' + message);
        };
        
        console.warn = function(message, ...args) {
            originalConsoleWarn.apply(console, [message, ...args]);
            updateDebugInfo('WARN: ' + message);
        };
        
        // バブル生成関数
        function createBubbles(containerId, count) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            for (let i = 0; i < count; i++) {
                const bubble = document.createElement('div');
                bubble.classList.add('bubble');
                
                // ランダムなサイズと位置
                const size = Math.random() * 150 + 50;
                bubble.style.width = `${size}px`;
                bubble.style.height = `${size}px`;
                bubble.style.left = `${Math.random() * 100}%`;
                bubble.style.top = `${Math.random() * 100}%`;
                
                // ランダムなアニメーション遅延と持続時間
                bubble.style.animationDelay = `${Math.random() * 10}s`;
                bubble.style.animationDuration = `${15 + Math.random() * 15}s`;
                
                container.appendChild(bubble);
            }
        }
        
        // セクション切り替え関数
        function switchSection(fromId, toId, callback) {
            const fromSection = document.getElementById(fromId);
            const toSection = document.getElementById(toId);
            
            if (!fromSection || !toSection) {
                console.error('セクションが見つかりません:', { fromId, toId });
                return;
            }
            
            console.log(`セクション切り替え: ${fromId} -> ${toId}`);
            
            // アニメーションセクションから切り替える場合、アニメーションを完全に停止
            if (fromId === 'animation-section' && transactionAnimation) {
                console.log('アニメーションを停止してリソースを解放します');
                
                // アニメーションフレームをキャンセル
                if (transactionAnimation._animationFrameId) {
                    cancelAnimationFrame(transactionAnimation._animationFrameId);
                    transactionAnimation._animationFrameId = null;
                }
                
                // アニメーション停止
                transactionAnimation.stopAnimation();
                
                // レンダラーのDOMエレメントを削除（メモリリーク防止）
                if (transactionAnimation.renderer && transactionAnimation.renderer.domElement) {
                    const canvasContainer = document.getElementById('canvas-container');
                    if (canvasContainer && canvasContainer.contains(transactionAnimation.renderer.domElement)) {
                        canvasContainer.removeChild(transactionAnimation.renderer.domElement);
                    }
                }
                
                // リソースを解放
                transactionAnimation.dispose();
                transactionAnimation = null;
                
                // キャンバスコンテナ内の全要素をクリア（完全にクリーンな状態にする）
                const canvasContainer = document.getElementById('canvas-container');
                if (canvasContainer) {
                    while (canvasContainer.firstChild) {
                        canvasContainer.removeChild(canvasContainer.firstChild);
                    }
                }
                
                // GCを促進するために少し待つ
                setTimeout(() => {
                    console.log('キャンバスコンテナをクリアしました');
                }, 100);
            }
            
            // 現在のセクションをフェードアウト
            fromSection.classList.remove('active-section');
            
            // 少し待ってから次のセクションをフェードイン
            setTimeout(() => {
                toSection.classList.add('active-section');
                
                // コンテンツセクションに切り替える場合、スムーススクロールを再初期化
                if (toId === 'content-section') {
                    // スクロール位置をトップにリセット
                    window.scrollTo(0, 0);
                    
                    // Lenisインスタンスが存在する場合は一度破棄
                    if (window.lenisInstance) {
                        window.lenisInstance.destroy();
                    }
                    
                    // 少し遅らせてからスムーススクロールを再初期化
                    setTimeout(() => {
                        // 新しいLenisインスタンスを作成
                        window.lenisInstance = new Lenis({ lerp: 0.15 });
                        
                        // ScrollTriggerと同期
                        window.lenisInstance.on('scroll', ScrollTrigger.update);
                        
                        // GSAPアニメーションとLenisを同期
                        gsap.ticker.remove(window.lenisRaf);
                        window.lenisRaf = (time) => {
                            window.lenisInstance.raf(time * 1000);
                        };
                        gsap.ticker.add(window.lenisRaf);
                        
                        console.log('コンテンツセクション用のスムーススクロールを初期化しました');
                    }, 200);
                }
                
                if (callback && typeof callback === 'function') {
                    callback();
                }
            }, 800); // フェードアウト時間に合わせる
        }
        
        // アニメーション関連の変数
        let transactionAnimation = null;
        
        // Three.jsアニメーションクラス
        class TransactionAnimation {
            constructor(containerId, texturePath) {
                console.log('TransactionAnimation コンストラクタ開始', { containerId, texturePath });
                // 設定
                this.containerId = containerId;
                this.texturePath = texturePath;
                
                // 基本パラメータ
                this.container = document.getElementById(this.containerId);
                if (!this.container) {
                    console.error(`コンテナ要素 #${this.containerId} が見つかりません`);
                } else {
                    console.log('コンテナ要素が見つかりました', this.container);
                }
                
                this.width = window.innerWidth;
                this.height = window.innerHeight;
                this.textureLoader = new THREE.TextureLoader();
                this.scene = null;
                this.camera = null;
                this.renderer = null;
                this.donutMeshes = [];
                this.isAnimating = false;
                this.animationComplete = false;
                
                // アニメーションパラメータ
                this.animationDuration = 1.0;  // 各ドーナツのアニメーション時間（秒）
                this.delayBetweenDonuts = 0.05; // ドーナツ間の遅延時間（秒）を短くして10枚でも全体の長さを調整
                this.finalDelay = 0.5;         // 最終段階後の遅延時間（秒）
                
                // 10枚のドーナツ用の配列を準備 - オリジナルと同じ
                this.donutCount = 13; // ドーナツの枚数
                this.rotationAngle = 15; // 各ドーナツの回転角度（度）
                
                // 初期Z位置（深さ方向に少しずつずらす）- オリジナルと同じ
                this.zPositions = Array.from({ length: this.donutCount }, (_, i) => 7 + (i * 0.2));
                
                // 終了位置Z（個別に設定可能）- オリジナルと同じ
                this.targetZ = Array.from({ length: this.donutCount }, (_, i) => 5 - (i * 0.6));
                
                // リセット位置Z（個別に設定）- オリジナルと同じ
                this.resetZ = Array.from({ length: this.donutCount }, (_, i) => 5 - (i * 0.6));
                
                // 文字表示パラメータ
                this.textMesh = null;
                this.textVisible = false;
                this.textFadeInDuration = 1.0; // 文字のフェードイン時間
                this.textPosition = { x: 0, y: 0, z: 2 }; // 文字の位置
                this.textSize = 0.5; // オリジナルと同じサイズに戻す
                this.textContent = "TRANSITION"; // 表示するテキスト
                this.textDirection = "forward"; // アニメーションの方向（前進または後退）
                
                // 逆アニメーションパラメータ
                this.reverseAnimationActive = false;
                this.reverseAnimationDuration = 2.0; // 逆アニメーションの時間
                this.fadeOutDuration = 0; // フェードアウトの時間
                
                // 時間管理
                this.clock = new THREE.Clock();
                this.elapsedTime = 0;
                
                // 各ドーナツの開始時間を計算（等間隔に配置）
                this.startTimes = Array.from({ length: this.donutCount }, (_, i) => i * this.delayBetweenDonuts);
                
                // 各ドーナツのアニメーションフェーズ（0: 待機, 1: アニメーション中, 2: 完了）
                this.phases = Array(this.donutCount).fill(0);
                
                // セットアップ
                this.init();
            }
            
            init() {
                console.log('init メソッド開始');
                this.setupScene();
                
                // テクスチャとフォントのロード処理
                console.log('テクスチャとフォントのロード開始');
                
                const loadFontPromise = this.loadFont().catch(error => {
                    console.error('フォントのロードに失敗しました:', error);
                    // フォントが読み込めなくてもテキスト表示なしで続行可能
                    return null;
                });
                
                const loadTexturesPromise = this.loadTextures().catch(error => {
                    console.error('テクスチャのロードに失敗しました:', error);
                    return null;
                });
                
                // 両方のリソースを並行してロード
                Promise.all([loadTexturesPromise, loadFontPromise])
                    .then(results => {
                        console.log('リソースのロード完了', { textureLoaded: !!results[0], fontLoaded: !!results[1] });
                        
                        // テクスチャが読み込めた場合のみドーナツメッシュを作成
                        if (results[0]) {
                            // 既存のドーナツメッシュをクリア
                            this.removeAllDonuts();
                            
                            // 新しいドーナツメッシュを作成
                            this.createDonutMeshes();
                            console.log('ドーナツメッシュを作成しました');
                        } else {
                            console.error('テクスチャがロードされなかったため、ドーナツメッシュを作成できません');
                            
                            // エラーメッセージを表示
                            if (typeof alert === 'function') {
                                alert('リソースのロードに失敗しました。ページを再読み込みしてください。');
                            }
                            
                            return; // これ以上処理を続行しない
                        }
                        
                        // フォントが読み込めた場合のみテキストメッシュを作成
                        if (results[1]) {
                            this.createTextMesh();
                            console.log('テキストメッシュを作成しました');
                        } else {
                            console.warn('フォントがロードされなかったため、テキストメッシュを作成しません');
                        }
                        
                        // アニメーション開始
                        this.startAnimation();
                        console.log('アニメーションを開始しました');
                        
                        this.animate();
                    })
                    .catch(error => {
                        console.error('リソースのロードに失敗しました:', error);
                        
                        // エラーメッセージを表示
                        if (typeof alert === 'function') {
                            alert('リソースのロードに失敗しました。ページを再読み込みしてください。');
                        }
                    });
            }
            
            setupScene() {
                // シーン
                this.scene = new THREE.Scene();
                
                // カメラ
                this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 100);
                this.camera.position.set(0, 0, 5);
                this.scene.add(this.camera);
                
                // レンダラー
                this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                this.renderer.setSize(this.width, this.height);
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                this.container.appendChild(this.renderer.domElement);
                
                // ウィンドウリサイズイベント
                window.addEventListener('resize', () => this.onResize());
                
                console.log('シーンセットアップ完了');
            }
            
            loadTextures() {
                return new Promise((resolve, reject) => {
                    try {
                        console.log('テクスチャのロード開始:', this.texturePath);
                        
                        // テクスチャパスのチェック
                        if (!this.texturePath) {
                            const error = new Error('テクスチャパスが指定されていません');
                            console.error(error.message);
                            reject(error);
                            return;
                        }
                        
                        // イメージのプリロードで存在確認
                        const img = new Image();
                        img.onload = () => {
                            console.log('テクスチャ画像が存在することを確認:', this.texturePath);
                            
                            // 実際のテクスチャのロード
                            this.textureLoader.load(
                                this.texturePath,
                                texture => {
                                    console.log('テクスチャのロード成功:', this.texturePath);
                                    this.donutTexture = texture;
                                    resolve(texture);
                                },
                                undefined,
                                error => {
                                    console.error('テクスチャのロードエラー:', error);
                                    reject(error);
                                }
                            );
                        };
                        
                        img.onerror = () => {
                            const error = new Error(`テクスチャ画像が見つかりません: ${this.texturePath}`);
                            console.error(error.message);
                            reject(error);
                        };
                        
                        img.src = this.texturePath;
                    } catch (error) {
                        console.error('テクスチャローダーの実行に失敗しました:', error);
                        reject(error);
                    }
                });
            }
            
            loadFont() {
                return new Promise((resolve, reject) => {
                    try {
                        const loader = typeof FontLoader !== 'undefined' ? new FontLoader() : new THREE.FontLoader();
                        
                        // おしゃれなフォントを使用（Gentilis）
                        const fontUrl = 'https://threejs.org/examples/fonts/gentilis_regular.typeface.json';
                        
                        loader.load(
                            fontUrl,
                            font => {
                                console.log('フォントのロードに成功しました');
                                this.font = font;
                                resolve(font);
                            },
                            undefined,
                            error => {
                                console.error('フォントのロードに失敗しました:', error);
                                reject(error);
                            }
                        );
                    } catch (error) {
                        console.error('フォントローダーの実行に失敗しました:', error);
                        reject(error);
                    }
                });
            }
            
            createDonutMeshes() {
                // 既存のドーナツメッシュをクリア
                if (this.donutMeshes && this.donutMeshes.length > 0) {
                    for (const mesh of this.donutMeshes) {
                        if (mesh && this.scene) {
                            this.scene.remove(mesh);
                            if (mesh.geometry) mesh.geometry.dispose();
                            if (mesh.material) mesh.material.dispose();
                        }
                    }
                }
                
                // ドーナツメッシュ配列を初期化
                this.donutMeshes = [];
                
                // テクスチャが読み込まれているか確認
                if (!this.donutTexture) {
                    console.error('テクスチャがロードされていません');
                    return;
                }
                
                // ドーナツの大きさ（画面を覆うサイズ）
                const aspectRatio = this.width / this.height;
                const size = Math.max(4, 4 * aspectRatio); // 画面アスペクト比に合わせたサイズ
                
                console.log(`ドーナツメッシュを作成します: ${this.donutCount}個`);
                
                // 指定枚数のドーナツを作成
                for (let i = 0; i < this.donutCount; i++) {
                    try {
                        const geometry = new THREE.PlaneGeometry(size * 2, size * 2);
                        const material = new THREE.MeshBasicMaterial({
                            map: this.donutTexture,
                            transparent: true,
                            opacity: 0,
                            depthWrite: false,
                            side: THREE.DoubleSide
                        });
                        
                        const mesh = new THREE.Mesh(geometry, material);
                        
                        // Z位置の設定
                        mesh.position.z = this.zPositions[i];
                        
                        // 各ドーナツに回転を与える（累積）
                        const rotationRad = THREE.MathUtils.degToRad(this.rotationAngle * i);
                        mesh.rotation.z = rotationRad;
                        
                        // スケールの設定（各ドーナツのサイズを少しずつ変える）
                        const scaleFactor = 1.0 - (i * 0.01); // 後ろのドーナツほど少し小さく
                        mesh.scale.set(scaleFactor, scaleFactor, 1);
                        
                        // 配列に追加してシーンに追加
                        this.donutMeshes.push(mesh);
                        this.scene.add(mesh);
                        
                        console.log(`ドーナツ ${i+1}/${this.donutCount} を作成: 位置Z=${mesh.position.z}, 回転=${this.rotationAngle * i}度`);
                    } catch (error) {
                        console.error(`ドーナツ ${i+1} の作成中にエラーが発生しました:`, error);
                    }
                }
                
                console.log(`ドーナツメッシュ作成完了: ${this.donutMeshes.length}個`);
            }
            
            createTextMesh() {
                try {
                    // テキストジオメトリの作成
                    let textGeometry;
                    
                    // THREE.TextGeometryまたはTextGeometryのどちらかを使用
                    if (typeof TextGeometry !== 'undefined') {
                        textGeometry = new TextGeometry(this.textContent, {
                            font: this.font,
                            size: this.textSize,
                            height: 0.1,
                            curveSegments: 12,
                            bevelEnabled: false
                        });
                    } else if (typeof THREE.TextGeometry !== 'undefined') {
                        textGeometry = new THREE.TextGeometry(this.textContent, {
                            font: this.font,
                            size: this.textSize,
                            height: 0.1,
                            curveSegments: 12,
                            bevelEnabled: false
                        });
                    } else {
                        console.error('TextGeometryが見つかりません');
                        return;
                    }
                    
                    // テキストを中央に配置
                    textGeometry.computeBoundingBox();
                    const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
                    
                    // テキストマテリアル
                    const textMaterial = new THREE.MeshBasicMaterial({
                        color: 0xFFFFFF, // 白色
                        transparent: true,
                        opacity: 0
                    });
                    
                    this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
                    this.textMesh.position.set(
                        this.textPosition.x - textWidth / 2,
                        this.textPosition.y,
                        this.textPosition.z
                    );
                    
                    this.scene.add(this.textMesh);
                    console.log('テキストメッシュを作成しました:', this.textContent);
                } catch (error) {
                    console.error('テキストメッシュの作成中にエラーが発生しました:', error);
                }
            }
            
            startAnimation() {
                console.log('アニメーション開始');
                
                // アニメーションのリセット
                this.isAnimating = true;
                this.clock.start();
                this.elapsedTime = 0; // 時間をリセット
                
                // アニメーション方向に基づいてテキストを更新
                this.textContent = this.textDirection === "backward" ? "WELCOME BACK" : "TRANSITION";
                
                console.log(`アニメーション方向: ${this.textDirection}, テキスト: ${this.textContent}`);
                
                // フェーズをリセット（すべてのドーナツを初期状態に）
                this.phases = Array(this.donutCount).fill(0);
                this.animationComplete = false;
                this.reverseAnimationActive = false;
                this.textVisible = false;
                
                // ドーナツメッシュが存在する場合は初期位置に戻す
                if (this.donutMeshes && this.donutMeshes.length > 0) {
                    for (let i = 0; i < this.donutMeshes.length; i++) {
                        const mesh = this.donutMeshes[i];
                        if (mesh) {
                            // 初期位置に戻す
                            mesh.position.z = this.zPositions[i];
                            // 透明度を0に戻す
                            if (mesh.material) mesh.material.opacity = 0;
                            // 表示状態にする
                            mesh.visible = true;
                        }
                    }
                    console.log('既存のドーナツメッシュを初期位置にリセットしました');
                } else {
                    // ドーナツメッシュがない場合は新たに作成
                    this.createDonutMeshes();
                    console.log('新しいドーナツメッシュを作成しました');
                }
                
                // テキストメッシュが既に存在する場合は削除
                if (this.textMesh && this.font) {
                    this.scene.remove(this.textMesh);
                    this.textMesh.geometry.dispose();
                    this.textMesh.material.dispose();
                    this.textMesh = null;
                }
                
                // 新しいテキストメッシュを作成
                if (this.font) {
                    this.createTextMesh();
                    console.log('テキストメッシュを更新しました:', this.textContent);
                } else {
                    console.warn('フォントがロードされていないため、テキストメッシュを作成できません');
                }
            }
            
            updateAnimation() {
                // アニメーションが停止している場合は更新しない
                if (!this.isAnimating) {
                    return;
                }
                
                // 時間の更新
                this.elapsedTime = this.clock.getElapsedTime();
                
                try {
                    // 逆アニメーションが有効な場合はそちらを優先
                    if (this.reverseAnimationActive) {
                        this.updateReverseAnimation();
                        return;
                    }
                    
                    // ドーナツメッシュが初期化されているか確認
                    if (!this.donutMeshes || this.donutMeshes.length === 0) {
                        console.warn('ドーナツメッシュがまだ初期化されていません');
                        return;
                    }
                    
                    for (let i = 0; i < this.donutMeshes.length; i++) {
                        const mesh = this.donutMeshes[i];
                        
                        // meshが有効かチェック
                        if (!mesh || !mesh.material) {
                            console.warn(`ドーナツメッシュ ${i} が無効です`);
                            continue;
                        }
                        
                        // アニメーションの開始確認
                        if (this.phases[i] === 0 && this.elapsedTime >= this.startTimes[i]) {
                            this.phases[i] = 1;
                        }
                        
                        // アニメーション中
                        if (this.phases[i] === 1) {
                            const elapsed = this.elapsedTime - this.startTimes[i];
                            const progress = Math.min(elapsed / this.animationDuration, 1);
                            
                            // 位置のアニメーション - 各ドーナツごとのターゲットZ位置を使用
                            mesh.position.z = THREE.MathUtils.lerp(
                                this.zPositions[i],
                                this.targetZ[i],
                                this.easeOutCubic(progress)
                            );
                            
                            // 透明度のアニメーション
                            mesh.material.opacity = this.easeOutCubic(progress);
                            
                            // アニメーション完了
                            if (progress === 1) {
                                this.phases[i] = 2;
                            }
                        }
                    }
                    
                    // テキストのフェードイン更新
                    if (this.textVisible && this.textMesh) {
                        this.updateTextFade();
                    }
                    
                    // すべてのドーナツのアニメーションが完了した場合
                    if (this.phases.every(phase => phase === 2) && !this.animationComplete) {
                        this.animationComplete = true;
                        
                        // テキストを表示
                        if (this.textMesh && !this.textVisible) {
                            this.textVisible = true;
                            this.textStartTime = this.elapsedTime;
                        }
                        
                        setTimeout(() => {
                            this.resetDonutsPosition();
                            
                            // テキスト表示後、一定時間後に逆アニメーション開始
                            setTimeout(() => {
                                this.startReverseAnimation();
                            }, 2000); // 2秒後に逆アニメーション開始
                            
                        }, this.finalDelay * 1000);
                    }
                } catch (error) {
                    console.error('アニメーションの更新中にエラーが発生しました:', error);
                }
            }
            
            // テキストのフェードイン処理
            updateTextFade() {
                if (this.textMesh && this.textVisible) {
                    const progress = Math.min((this.elapsedTime - this.textStartTime) / this.textFadeInDuration, 1);
                    this.textMesh.material.opacity = this.easeOutCubic(progress);
                }
            }
            
            // 逆アニメーションを開始
            startReverseAnimation() {
                this.reverseAnimationActive = true;
                this.reverseStartTime = this.elapsedTime;
                
                // 全体のフェードアウトタイマーを設定
                if (this._fadeOutTimer) {
                    clearTimeout(this._fadeOutTimer);
                }
                
                this._reverseAnimationTimer = setTimeout(() => {
                    this.startFadeOut();
                }, (this.reverseAnimationDuration * 0.7) * 1000); // 逆アニメーションの70%が経過した時点でフェードアウト開始
            }
            
            // 全体のフェードアウトを開始
            startFadeOut() {
                console.log('フェードアウト開始');
                
                // アニメーションフラグをオフに
                this.isAnimating = false;
                
                // アニメーションの状態をリセット
                this.animationComplete = false;
                this.reverseAnimationActive = false;
                this.textVisible = false;
                
                // ドーナツメッシュの位置と透明度をリセット
                this.resetDonutsPosition();
                console.log('フェードアウト時: ドーナツを初期位置と透明度0にリセットしました');
                
                // アニメーション方向に基づいて次のセクションを決定
                const targetSection = this.textDirection === "backward" ? 'welcome-section' : 'content-section';
                
                // 適切なセクションに切り替え
                switchSection('animation-section', targetSection, () => {
                    console.log(`${targetSection}に切り替えました`);
                    
                    // バブルを生成
                    if (targetSection === 'content-section') {
                        createBubbles('content-bubble-container', 15);
                    }
                });
            }
            
            // 全てのドーナツを削除するメソッド
            removeAllDonuts() {
                console.log('全てのドーナツを削除します');
                
                try {
                    if (this.donutMeshes && this.donutMeshes.length > 0) {
                        for (const mesh of this.donutMeshes) {
                            if (mesh) {
                                if (this.scene) this.scene.remove(mesh);
                                if (mesh.geometry) mesh.geometry.dispose();
                                if (mesh.material) mesh.material.dispose();
                            }
                        }
                        this.donutMeshes = [];
                        console.log('全てのドーナツメッシュを削除しました');
                    }
                    
                    // テキストメッシュも削除
                    if (this.textMesh) {
                        if (this.scene) this.scene.remove(this.textMesh);
                        if (this.textMesh.geometry) this.textMesh.geometry.dispose();
                        if (this.textMesh.material) this.textMesh.material.dispose();
                        this.textMesh = null;
                        console.log('テキストメッシュを削除しました');
                    }
                } catch (error) {
                    console.error('ドーナツメッシュの削除中にエラーが発生しました:', error);
                }
            }
            
            // 逆アニメーションの更新
            updateReverseAnimation() {
                if (!this.reverseAnimationActive) return;
                
                try {
                    const elapsed = this.elapsedTime - this.reverseStartTime;
                    const progress = Math.min(elapsed / this.reverseAnimationDuration, 1);
                    
                    // ドーナツメッシュが初期化されているか確認
                    if (!this.donutMeshes || this.donutMeshes.length === 0) {
                        console.warn('ドーナツメッシュがまだ初期化されていません');
                        return;
                    }
                    
                    // 各ドーナツを終了位置から初期位置に戻す
                    for (let i = 0; i < this.donutMeshes.length; i++) {
                        const mesh = this.donutMeshes[i];
                        
                        // meshが有効かチェック
                        if (!mesh || !mesh.material) {
                            console.warn(`ドーナツメッシュ ${i} が無効です`);
                            continue;
                        }
                        
                        // 位置のアニメーション
                        mesh.position.z = THREE.MathUtils.lerp(
                            this.targetZ[i],
                            this.zPositions[i],
                            this.easeInOutCubic(progress)
                        );
                        
                        // 透明度のアニメーション（徐々に透明に）
                        if (progress > 0.5) { // 後半で透明度を下げる
                            const fadeProgress = (progress - 0.5) * 2; // 0.5～1の範囲を0～1に正規化
                            mesh.material.opacity = 2 - this.easeInCubic(fadeProgress);
                        }
                    }
                    
                    // テキストも徐々に消す
                    if (this.textMesh && progress > 0.3) {
                        const fadeProgress = (progress - 0.3) / 0.7; // 0.3～1の範囲を0～1に正規化
                        this.textMesh.material.opacity = 1 - this.easeInCubic(Math.min(fadeProgress, 1));
                    }
                    
                    // 完全にフェードアウトしたらフラグを設定
                    if (progress >= 1) {
                        // アニメーションが完了したら、次回のために位置と透明度をリセット
                        this.resetDonutsPosition();
                        console.log('逆アニメーション完了: ドーナツを初期位置と透明度0にリセットしました');
                    }
                } catch (error) {
                    console.error('逆アニメーションの更新中にエラーが発生しました:', error);
                }
            }
            
            resetDonutsPosition() {
                console.log('ドーナツメッシュの位置をリセットします');
                
                // ドーナツメッシュが初期化されているか確認
                if (!this.donutMeshes || this.donutMeshes.length === 0) {
                    console.warn('リセット：ドーナツメッシュがまだ初期化されていません');
                    return;
                }
                
                // すべてのドーナツを個別のリセット位置に移動
                for (let i = 0; i < this.donutMeshes.length; i++) {
                    const mesh = this.donutMeshes[i];
                    
                    // meshが有効かチェック
                    if (!mesh) {
                        console.warn(`リセット：ドーナツメッシュ ${i} が無効です`);
                        continue;
                    }
                    
                    // 配列の範囲内かチェック
                    if (i < this.resetZ.length) {
                        mesh.position.z = this.resetZ[i];
                    } else {
                        // 範囲外の場合はデフォルト値
                        mesh.position.z = -3;
                    }
                    
                    console.log(`ドーナツ ${i+1} をリセット位置 Z=${mesh.position.z} に移動`);
                }
            }
            
            animate() {
                try {
                    // アニメーションが停止している場合は更新しない
                    if (this.isAnimating) {
                        this.updateAnimation();
                        if (this.renderer && this.scene && this.camera) {
                            this.renderer.render(this.scene, this.camera);
                        } else {
                            console.warn('レンダラー、シーン、またはカメラが初期化されていません');
                        }
                    }
                } catch (error) {
                    console.error('アニメーションループでエラーが発生しました:', error);
                }
                
                // アニメーションフレームを要求
                this._animationFrameId = requestAnimationFrame(() => this.animate());
            }
            
            onResize() {
                this.width = window.innerWidth;
                this.height = window.innerHeight;
                
                this.camera.aspect = this.width / this.height;
                this.camera.updateProjectionMatrix();
                
                this.renderer.setSize(this.width, this.height);
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            }
            
            // イージング関数
            easeOutCubic(x) {
                return 1 - Math.pow(1 - x, 3);
            }
            
            easeInCubic(x) {
                return x * x * x;
            }
            
            easeInOutCubic(x) {
                return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
            }
            
            // リソースの解放
            dispose() {
                console.log('リソースを解放します');
                
                // アニメーションフレームをキャンセル
                if (this._animationFrameId) {
                    cancelAnimationFrame(this._animationFrameId);
                    this._animationFrameId = null;
                }
                
                // タイマーをクリア
                if (this._fadeOutTimer) {
                    clearTimeout(this._fadeOutTimer);
                    this._fadeOutTimer = null;
                }
                
                if (this._reverseAnimationTimer) {
                    clearTimeout(this._reverseAnimationTimer);
                    this._reverseAnimationTimer = null;
                }
                
                // メッシュの解放
                if (this.donutMeshes && this.donutMeshes.length > 0) {
                    for (const mesh of this.donutMeshes) {
                        if (mesh) {
                            if (this.scene) this.scene.remove(mesh);
                            if (mesh.geometry) mesh.geometry.dispose();
                            if (mesh.material) {
                                if (mesh.material.map) mesh.material.map.dispose();
                                mesh.material.dispose();
                            }
                        }
                    }
                    this.donutMeshes = [];
                }
                
                // テキストメッシュの解放
                if (this.textMesh) {
                    if (this.scene) this.scene.remove(this.textMesh);
                    if (this.textMesh.geometry) this.textMesh.geometry.dispose();
                    if (this.textMesh.material) this.textMesh.material.dispose();
                    this.textMesh = null;
                }
                
                // テクスチャの解放
                if (this.donutTexture) {
                    this.donutTexture.dispose();
                    this.donutTexture = null;
                }
                
                // レンダラーの解放
                if (this.renderer) {
                    this.renderer.dispose();
                    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                    }
                    this.renderer = null;
                }
                
                // カメラとシーンの参照を解放
                this.camera = null;
                if (this.scene) {
                    // シーン内の全オブジェクトを削除
                    while(this.scene.children.length > 0) { 
                        const object = this.scene.children[0];
                        this.scene.remove(object);
                    }
                    this.scene = null;
                }
                
                // イベントリスナーの削除
                window.removeEventListener('resize', this.onResize);
                
                console.log('すべてのリソースを解放しました');
            }
            
            // アニメーションを完全に停止するメソッド
            stopAnimation() {
                console.log('アニメーションを完全に停止します');
                
                // アニメーションフラグを無効に
                this.isAnimating = false;
                this.animationComplete = true;
                this.reverseAnimationActive = false;
                
                // アニメーションフレームをキャンセル
                if (this._animationFrameId) {
                    cancelAnimationFrame(this._animationFrameId);
                    this._animationFrameId = null;
                }
                
                // タイマーをクリア
                if (this._fadeOutTimer) {
                    clearTimeout(this._fadeOutTimer);
                    this._fadeOutTimer = null;
                }
                
                if (this._reverseAnimationTimer) {
                    clearTimeout(this._reverseAnimationTimer);
                    this._reverseAnimationTimer = null;
                }
                
                // ドーナツメッシュを不可視に
                if (this.donutMeshes && this.donutMeshes.length > 0) {
                    for (const mesh of this.donutMeshes) {
                        if (mesh) {
                            mesh.visible = false;
                            if (mesh.material) mesh.material.opacity = 0;
                        }
                    }
                }
                
                // テキストメッシュを不可視に
                if (this.textMesh) {
                    this.textMesh.visible = false;
                    if (this.textMesh.material) this.textMesh.material.opacity = 0;
                }
                
                console.log('アニメーションを完全に停止しました');
            }
        }
        
        // ページ読み込み時の初期化
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM ContentLoaded イベント発生');
            console.log('THREE利用可能:', typeof THREE !== 'undefined');
            console.log('FontLoader利用可能:', typeof THREE.FontLoader !== 'undefined' || 
                                     typeof FontLoader !== 'undefined');
            console.log('TextGeometry利用可能:', typeof THREE.TextGeometry !== 'undefined' || 
                                      typeof TextGeometry !== 'undefined');
            
            // グローバルLenisインスタンスを初期化
            if (typeof window.initGlobalLenis === 'function') {
                window.initGlobalLenis();
            }
            
            // バブルを生成
            createBubbles('welcome-bubble-container', 15);
            
            // ボタンイベントの設定
            const startBtn = document.getElementById('start-btn');
            const backBtn = document.getElementById('back-btn');
            
            // トランジション開始ボタン
            if (startBtn) {
                startBtn.addEventListener('click', function() {
                    console.log('トランジション開始ボタンがクリックされました');
                    
                    // ウェルカムセクションからアニメーションセクションに切り替え
                    switchSection('welcome-section', 'animation-section', () => {
                        console.log('アニメーションセクションに切り替えました');
                        
                        // アニメーションの初期化と開始
                        try {
                            const texturePath = '../texture/circle_mofvji.webp';
                            console.log('設定されたテクスチャパス:', texturePath);
                            
                            // アニメーション開始
                            transactionAnimation = new TransactionAnimation('canvas-container', texturePath);
                            console.log('トランジションアニメーションのインスタンス作成完了');
                        } catch (error) {
                            console.error('トランジションアニメーションの作成中にエラーが発生しました:', error);
                            // エラー時はコンテンツセクションに直接切り替え
                            switchSection('animation-section', 'content-section');
                        }
                    });
                });
            }
            
            // 戻るボタン
            if (backBtn) {
                backBtn.addEventListener('click', function() {
                    console.log('戻るボタンがクリックされました');
                    
                    // コンテンツセクションからアニメーションセクションに切り替え
                    switchSection('content-section', 'animation-section', () => {
                        console.log('アニメーションセクション（戻る方向）に切り替えました');
                        
                        // アニメーションの初期化と開始
                        try {
                            const texturePath = '../texture/circle_mofvji.webp';
                            console.log('設定されたテクスチャパス:', texturePath);
                            
                            // バックワード方向のアニメーション開始
                            transactionAnimation = new TransactionAnimation('canvas-container', texturePath);
                            transactionAnimation.textDirection = "backward"; // 逆方向を設定
                            console.log('トランジションアニメーション（戻る方向）のインスタンス作成完了');
                        } catch (error) {
                            console.error('トランジションアニメーションの作成中にエラーが発生しました:', error);
                            // エラー時はウェルカムセクションに直接切り替え
                            switchSection('animation-section', 'welcome-section');
                        }
                    });
                });
            }
        });