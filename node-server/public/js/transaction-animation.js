class TransactionAnimation {
    constructor(containerId, texturePath, nextPageUrl) {
        console.log('TransactionAnimation コンストラクタ開始', { containerId, texturePath, nextPageUrl });
        // 設定
        this.containerId = containerId;
        this.texturePath = texturePath;
        this.nextPageUrl = nextPageUrl || 'content.html'; // デフォルト遷移先を設定
        
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
        this.loadingElement = document.getElementById('loading');
        
        // アニメーションパラメータ
        this.animationDuration = 1.5;  // 各ドーナツのアニメーション時間（秒）
        this.delayBetweenDonuts = 0.1; // ドーナツ間の遅延時間（秒）
        this.finalDelay = 0.5;         // 最終段階後の遅延時間（秒）
        
        // ドーナツの設定
        this.donutCount = 10; // ドーナツの枚数
        this.rotationAngle = 15; // 各ドーナツの回転角度（度）
        
        // 初期Z位置（深さ方向に少しずつずらす）
        this.zPositions = Array.from({ length: this.donutCount }, (_, i) => 7 + (i * 0.2));
        
        // 終了位置Z（個別に設定可能）
        this.targetZ = Array.from({ length: this.donutCount }, (_, i) => 5 - (i * 0.7));
        
        // リセット位置Z（個別に設定）
        this.resetZ = Array.from({ length: this.donutCount }, (_, i) =>5 - (i * 0.7));
        
        // 文字表示パラメータ
        this.textMesh = null;
        this.textVisible = false;
        this.textFadeInDuration = 1.0; // 文字のフェードイン時間
        this.textPosition = { x: 0, y: 0, z: 2 }; // 文字の位置
        this.textSize = 0.5; // 文字のサイズ
        this.textContent = "TRANSITION"; // 表示するテキスト
        
        // 逆アニメーションパラメータ
        this.reverseAnimationActive = false;
        this.reverseAnimationDuration = 2.0; // 逆アニメーションの時間
        this.fadeOutDuration = 1.0; // フェードアウトの時間
        
        // 時間管理
        this.clock = new THREE.Clock();
        this.elapsedTime = 0;
        
        // 各ドーナツの開始時間を計算（等間隔に配置）
        this.startTimes = Array.from({ length: this.donutCount }, (_, i) => i * this.delayBetweenDonuts);
        
        // 各ドーナツのアニメーションフェーズ（0: 待機, 1: アニメーション中, 2: 完了）
        this.phases = Array(this.donutCount).fill(0);
        
        // セットアップ
        this.init();
        
        // ウィンドウリサイズイベントの設定
        this._resizeHandler = this.handleResize.bind(this);
        window.addEventListener('resize', this._resizeHandler, false);
        
        // ローディング表示を確実に非表示にするタイマー
        this.loadingTimeout = setTimeout(() => {
            if (this.loadingElement) {
                this.loadingElement.classList.add('hidden');
            }
        }, 3000); // 3秒後に強制的に非表示
    }
    
    init() {
        console.log('init メソッド開始');
        this.setupScene();
        
        // トランジションオーバーレイのチェック
        const transitionOverlay = document.getElementById('transition-overlay');
        
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
                    this.createDonutMeshes();
                    console.log('ドーナツメッシュを作成しました');
                } else {
                    console.warn('テクスチャがロードされなかったため、ドーナツメッシュを作成できません');
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
                
                // ローディング表示を非表示に
                if (this.loadingElement) {
                    this.loadingElement.classList.add('hidden');
                    console.log('ローディング表示を非表示にしました');
                }
                
                // オーバーレイを徐々に非表示にする
                const transitionOverlay = document.getElementById('transition-overlay');
                if (transitionOverlay) {
                    setTimeout(() => {
                        transitionOverlay.classList.add('transition-hidden');
                        console.log('トランジションオーバーレイをフェードアウト');
                    }, 500); // アニメーション開始後少し待ってからフェードアウト
                }
                
                this.animate();
            })
            .catch(error => {
                console.error('リソースのロードに失敗しました:', error);
                // エラー時もローディング表示を非表示に
                if (this.loadingElement) {
                    this.loadingElement.classList.add('hidden');
                    alert('リソースのロードに失敗しました。ページを再読み込みしてください。');
                }
            });
    }
    
    setupScene() {
        // シーン
        this.scene = new THREE.Scene();
        
        // カメラ
        this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 100);
        this.camera.position.z = 10;
        this.scene.add(this.camera);
        
        // レンダラー
        try {
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance' // パフォーマンス優先
            });
            
            // レンダラーの設定
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // パフォーマンスのためにピクセル比を制限
            
            // 色空間の設定
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            
            // レンダラーのDOM要素をコンテナに追加
            this.container.appendChild(this.renderer.domElement);
            
            console.log('レンダラーを初期化しました:', {
                width: this.width,
                height: this.height,
                pixelRatio: this.renderer.getPixelRatio(),
                colorSpace: this.renderer.outputColorSpace
            });
        } catch (error) {
            console.error('レンダラーの初期化中にエラーが発生しました:', error);
            alert('WebGLの初期化に失敗しました。ブラウザが最新であることを確認してください。');
        }
    }
    
    async loadTextures() {
        console.log('テクスチャのロード開始:', this.texturePath);
        return new Promise((resolve, reject) => {
            // テクスチャパスのチェック
            if (!this.texturePath) {
                console.error('テクスチャパスが指定されていません');
                reject(new Error('テクスチャパスが指定されていません'));
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
        });
    }
    
    createDonutMeshes() {
        // ドーナツの大きさ（画面を覆うサイズ）
        const aspectRatio = this.width / this.height;
        const size = Math.max(4, 4 * aspectRatio); // 画面アスペクト比に合わせたサイズ
        
        // 指定枚数のドーナツを作成
        for (let i = 0; i < this.donutCount; i++) {
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
            
            // 各ドーナツに23度の回転を与える（累積）
            const rotationRad = THREE.MathUtils.degToRad(this.rotationAngle * i);
            mesh.rotation.z = rotationRad;
            
            // スケールの設定（各ドーナツのサイズを少しずつ変える）
            const scaleFactor = 1.0 - (i * 0.01); // 後ろのドーナツほど少し小さく
            mesh.scale.set(scaleFactor, scaleFactor, 1);
            
            this.donutMeshes.push(mesh);
            this.scene.add(mesh);
            
            console.log(`ドーナツ ${i+1}/${this.donutCount} を作成: 位置Z=${mesh.position.z}, 回転=${this.rotationAngle * i}度`);
        }
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
                        color: 0x4ecdc4,
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
    
    // フォントのロード
    async loadFont() {
        console.log('フォントロードを開始');
        return new Promise((resolve, reject) => {
            try {
                let fontLoader;
                
                // FontLoaderの取得方法を変更（unpkg.comからのロード対応）
                if (typeof THREE.FontLoader !== 'undefined') {
                    console.log('THREE.FontLoaderを使用');
                    fontLoader = new THREE.FontLoader();
                } else if (typeof THREE.examples !== 'undefined' && THREE.examples.jsm && THREE.examples.jsm.loaders && THREE.examples.jsm.loaders.FontLoader) {
                    console.log('THREE.examples.jsm.loaders.FontLoaderを使用');
                    fontLoader = new THREE.examples.jsm.loaders.FontLoader();
                } else if (typeof FontLoader !== 'undefined') {
                    console.log('グローバルFontLoaderを使用');
                    fontLoader = new FontLoader();
                } else {
                    console.error('FontLoaderが見つかりません。CDN URLを確認してください');
                    // フォントなしでも続行
                    resolve(null);
                    return;
                }
                
                console.log('フォントをロード中:', 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json');
                fontLoader.load(
                    'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
                    font => {
                        console.log('フォントのロード成功');
                        this.font = font;
                        resolve(font);
                    },
                    undefined,
                    error => {
                        console.error('フォントのロードエラー:', error);
                        reject(error);
                    }
                );
            } catch (error) {
                console.error('フォントロードエラー:', error);
                // フォントなしでも続行
                resolve(null);
            }
        });
    }
    
    startAnimation() {
        this.isAnimating = true;
        this.clock.start();
    }
    
    updateAnimation() {
        if (!this.isAnimating) return;
        
        // 定期的なチェック
        try {
            const deltaTime = this.clock.getDelta();
            this.elapsedTime += deltaTime;
            
            // 定期的に進行状況をログ出力（秒単位で）
            if (Math.floor(this.elapsedTime) > Math.floor(this.elapsedTime - deltaTime)) {
                console.log(`アニメーション進行中: ${Math.floor(this.elapsedTime)}秒経過`, {
                    phases: this.phases,
                    textVisible: this.textVisible,
                    animationComplete: this.animationComplete,
                    reverseAnimationActive: this.reverseAnimationActive
                });
            }
            
            if (this.reverseAnimationActive) {
                // 逆アニメーション実行中
                this.updateReverseAnimation();
                return;
            }
            
            // 各ドーナツの更新
            if (!this.donutMeshes || this.donutMeshes.length === 0) {
                console.warn('ドーナツメッシュがまだ初期化されていません');
                return;
            }
            
            for (let i = 0; i < this.donutMeshes.length; i++) {
                const mesh = this.donutMeshes[i];
                
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
            // エラー発生時もアニメーションを継続
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
        setTimeout(() => {
            this.startFadeOut();
        }, (this.reverseAnimationDuration * 0.7) * 1000); // 逆アニメーションの70%が経過した時点でフェードアウト開始
    }
    
    // 全体のフェードアウトを開始
    startFadeOut() {
        console.log('フェードアウト開始');
        const container = document.getElementById('canvas-container');
        if (!container) {
            console.error('フェードアウト：キャンバスコンテナが見つかりません');
            this.navigateToNextPage();
            return;
        }
        
        // オーバーレイを表示
        const transitionOverlay = document.getElementById('transition-overlay');
        if (transitionOverlay) {
            transitionOverlay.classList.remove('transition-hidden');
            console.log('トランジションオーバーレイを表示');
            
            // セッションストレージにトランジション情報を設定
            sessionStorage.setItem('transitionStarted', 'true');
            sessionStorage.setItem('transitionStartTime', new Date().toString());
            sessionStorage.setItem('transitionDirection', 'forward');
        }
        
        container.style.transition = `opacity ${this.fadeOutDuration}s ease-out`;
        container.style.opacity = '0';
        console.log(`フェードアウト設定: ${this.fadeOutDuration}秒後に完了予定`);
        
        // フェードアウト後に指定されたURLに遷移
        this.fadeOutTimeout = setTimeout(() => {
            this.navigateToNextPage();
        }, this.fadeOutDuration * 1000);
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
                
                // 位置のアニメーション
                mesh.position.z = THREE.MathUtils.lerp(
                    this.targetZ[i],
                    this.zPositions[i],
                    this.easeInOutCubic(progress)
                );
                
                // 透明度のアニメーション（徐々に透明に）
                if (progress > 0.5) { // 後半で透明度を下げる
                    const fadeProgress = (progress - 0.5) * 2; // 0.5～1の範囲を0～1に正規化
                    mesh.material.opacity = 1 - this.easeInCubic(fadeProgress);
                }
            }
            
            // テキストも徐々に消す
            if (this.textMesh && progress > 0.3) {
                const fadeProgress = (progress - 0.3) / 0.7; // 0.3～1の範囲を0～1に正規化
                this.textMesh.material.opacity = 1 - this.easeInCubic(Math.min(fadeProgress, 1));
            }
        } catch (error) {
            console.error('逆アニメーションの更新中にエラーが発生しました:', error);
        }
    }
    
    resetDonutsPosition() {
        // すべてのドーナツを個別のリセット位置に移動
        for (let i = 0; i < this.donutMeshes.length; i++) {
            const mesh = this.donutMeshes[i];
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
    
    resetAnimation() {
        // アニメーション状態をリセット
        this.isAnimating = true;
        this.animationComplete = false;
        this.elapsedTime = 0;
        this.phases = Array(this.donutCount).fill(0);
        
        // コンテンツを非表示
        const contentElement = document.getElementById('content');
        if (contentElement) {
            contentElement.classList.remove('visible');
        }
        
        // ドーナツを初期位置に戻す
        for (let i = 0; i < this.donutMeshes.length; i++) {
            const mesh = this.donutMeshes[i];
            // 配列の範囲内かチェック
            if (i < this.zPositions.length) {
                mesh.position.z = this.zPositions[i];
            } else {
                // 範囲外の場合はデフォルト値
                mesh.position.z = 5;
            }
            mesh.material.opacity = 0;
        }
    }
    
    // 次のページへ遷移するメソッド
    navigateToNextPage() {
        console.log('フェードアウト完了、ページ遷移を実行', { nextPageUrl: this.nextPageUrl });
        
        try {
            // リソースを先に解放して遷移をスムーズにする
            this.dispose();
            
            // nextPageUrlがある場合はそこに遷移、なければcontent.htmlをデフォルトとする
            const targetUrl = this.nextPageUrl || 'content.html';
            console.log(`${targetUrl}へのページ遷移を開始します`);
            window.location.href = targetUrl;
        } catch (error) {
            console.error('ページ遷移中にエラーが発生しました:', error);
            // エラーが発生しても必ず遷移する
            window.location.href = this.nextPageUrl || 'content.html';
        }
    }
    
    animate() {
        try {
            this.updateAnimation();
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            } else {
                console.warn('レンダラー、シーン、またはカメラが初期化されていません');
            }
        } catch (error) {
            console.error('アニメーションループでエラーが発生しました:', error);
        }
        
        // アニメーションフレームを要求し、IDを保存
        if (this.isAnimating) {
            this._animationFrameId = requestAnimationFrame(() => this.animate());
        }
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
        console.log('リソース解放を開始します');
        
        // アニメーションの停止
        this.isAnimating = false;
        this.animationComplete = true;
        
        // タイムアウトをクリア
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = null;
        }
        
        // フェードアウトタイムアウトをクリア
        if (this.fadeOutTimeout) {
            clearTimeout(this.fadeOutTimeout);
            this.fadeOutTimeout = null;
        }
        
        // フェードアウトインターバルをクリア
        if (this.fadeOutInterval) {
            clearInterval(this.fadeOutInterval);
            this.fadeOutInterval = null;
        }
        
        // アニメーションフレームをキャンセル
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
        
        // Three.jsリソースの解放
        if (this.scene) {
            // メモリリークを防ぐためのディープクリーニング関数
            const disposeObject = (obj) => {
                if (!obj) return;
                
                // 子オブジェクトを再帰的に処理
                if (obj.children && obj.children.length > 0) {
                    // 配列のコピーを作成（子要素の削除による反復問題を避けるため）
                    const children = [...obj.children];
                    for (const child of children) {
                        disposeObject(child);
                    }
                }
                
                // ジオメトリの解放
                if (obj.geometry) {
                    obj.geometry.dispose();
                    obj.geometry = null;
                }
                
                // マテリアルの解放
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(material => {
                            if (!material) return;
                            // テクスチャの解放
                            Object.keys(material).forEach(prop => {
                                if (material[prop] && material[prop].isTexture) {
                                    material[prop].dispose();
                                    material[prop] = null;
                                }
                            });
                            material.dispose();
                        });
                    } else if (obj.material) {
                        // テクスチャの解放
                        Object.keys(obj.material).forEach(prop => {
                            if (obj.material[prop] && obj.material[prop].isTexture) {
                                obj.material[prop].dispose();
                                obj.material[prop] = null;
                            }
                        });
                        obj.material.dispose();
                    }
                    obj.material = null;
                }
                
                // 親からの削除
                if (obj.parent) {
                    obj.parent.remove(obj);
                }
            };
            
            // シーン全体を処理
            disposeObject(this.scene);
            this.scene = null;
        }
        
        // レンダラーの解放
        if (this.renderer) {
            try {
                // WebGLRenderingContextのリソースを解放
                const gl = this.renderer.getContext();
                if (gl) {
                    const loseExt = gl.getExtension('WEBGL_lose_context');
                    if (loseExt) {
                        loseExt.loseContext();
                    }
                }
                
                this.renderer.dispose();
                
                // DOMからcanvas要素を削除
                if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                    this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                } else if (this.renderer.domElement) {
                    this.renderer.domElement.remove();
                }
                
                this.renderer = null;
            } catch (error) {
                console.error('レンダラーの解放中にエラーが発生しました:', error);
            }
        }
        
        // テクスチャの明示的な解放
        if (this.donutTexture) {
            this.donutTexture.dispose();
            this.donutTexture = null;
        }
        
        // その他のプロパティのクリア
        this.donutMeshes = [];
        this.textMesh = null;
        this.camera = null;
        this.textureLoader = null;
        this.clock = null;
        
        // イベントリスナーの削除
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
        
        console.log('すべてのリソースを解放しました');
    }
}

// ページロード時に初期化
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ContentLoaded - トランザクションアニメーション初期化開始');
    
    // welcome.htmlからの遷移かどうかを確認
    const transitionStarted = sessionStorage.getItem('transitionStarted');
    const transitionStartTime = sessionStorage.getItem('transitionStartTime');
    if (transitionStarted) {
        console.log(`welcome.htmlからの遷移を検出しました（開始時刻: ${transitionStartTime}）`);
        sessionStorage.removeItem('transitionStarted');
        sessionStorage.removeItem('transitionStartTime');
    }
    
    // THREE.jsが正しく読み込まれているか確認
    if (typeof THREE === 'undefined') {
        console.error('THREE.jsが読み込まれていません。アニメーションを開始できません。');
        alert('THREE.jsが読み込まれていません。ページを再読み込みしてください。');
        return;
    }
    
    const texturePath = '../texture/circle_mofvji.webp';
    console.log('設定されたテクスチャパス:', texturePath);
    const nextPageUrl = 'content.html'; // 遷移先のページを設定
    let transactionAnimation = null;
    
    // アニメーションの初期化と開始
    // ローディング表示をいったん表示
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
        console.log('ローディング表示を表示');
    } else {
        console.error('ローディング要素が見つかりません');
    }
    
    // キャンバスコンテナを表示
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
        // hiddenクラスを削除して表示
        canvasContainer.classList.remove('hidden');
        console.log('キャンバスコンテナを表示');
    } else {
        console.error('キャンバスコンテナが見つかりません');
    }
    
    try {
        // FontLoaderとTextGeometryの存在確認ログ
        console.log('FontLoader状態:', typeof FontLoader !== 'undefined' ? 'グローバルで利用可能' : 'グローバルでは利用不可');
        console.log('TextGeometry状態:', typeof TextGeometry !== 'undefined' ? 'グローバルで利用可能' : 'グローバルでは利用不可');
        
        if (typeof THREE.FontLoader !== 'undefined') {
            console.log('THREE.FontLoader: 利用可能');
        }
        
        if (typeof THREE.TextGeometry !== 'undefined') {
            console.log('THREE.TextGeometry: 利用可能');
        }
        
        // アニメーションの初期化
        console.log('トランザクションアニメーションのインスタンス作成開始');
        transactionAnimation = new TransactionAnimation(
            'canvas-container',
            texturePath,
            nextPageUrl
        );
        console.log('トランザクションアニメーションのインスタンス作成完了');
    } catch (error) {
        console.error('トランザクションアニメーションの作成中にエラーが発生しました:', error);
        // エラーメッセージを表示
        alert('アニメーションの初期化中にエラーが発生しました。ページを再読み込みしてください。');
    }
    
    // ページ遷移時にリソースを解放
    window.addEventListener('beforeunload', () => {
        console.log('ページ遷移 - リソース解放');
        if (transactionAnimation) {
            try {
                transactionAnimation.dispose();
            } catch (error) {
                console.error('リソース解放中にエラーが発生しました:', error);
            }
        }
    });
});

function handleResize() {
        console.log('ウィンドウリサイズを検知、キャンバスを再調整します');
        
        // 新しいウィンドウサイズを設定
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // カメラのアスペクト比を更新
        if (this.camera) {
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
        }
        
        // レンダラーのサイズを更新
        if (this.renderer) {
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // パフォーマンス考慮でピクセル比を制限
        }
        
        // ドーナツメッシュのサイズ調整（もし必要なら）
        if (this.donutMeshes && this.donutMeshes.length > 0) {
            const aspectRatio = this.width / this.height;
            const size = Math.max(4, 4 * aspectRatio);
            
            for (let i = 0; i < this.donutMeshes.length; i++) {
                const mesh = this.donutMeshes[i];
                if (mesh && mesh.geometry) {
                    // サイズを更新（新しいジオメトリで置き換え）
                    const oldGeometry = mesh.geometry;
                    mesh.geometry = new THREE.PlaneGeometry(size * 2, size * 2);
                    oldGeometry.dispose(); // 古いジオメトリを解放
                    
                    // スケールの再設定
                    const scaleFactor = 1.0 - (i * 0.01);
                    mesh.scale.set(scaleFactor, scaleFactor, 1);
                }
            }
        }
        
        // テキストメッシュの位置調整（もし必要なら）
        if (this.textMesh) {
            // 画面サイズに合わせてテキストの位置や大きさを調整
            const textScaleFactor = Math.min(1, this.width / 1200); // 画面幅に応じてスケール調整
            this.textMesh.scale.set(textScaleFactor, textScaleFactor, textScaleFactor);
        }
        
        // 再レンダリング
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
