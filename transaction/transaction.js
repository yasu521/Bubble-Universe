/**
 * トランザクションアニメーション
 * Three.jsを使用したドーナツ形状のトランジションエフェクト
 */

class TransactionAnimation {
    constructor(containerId, texturePath, nextPageUrl) {
        console.log('TransactionAnimation コンストラクタ開始', { containerId, texturePath, nextPageUrl });
        // 設定
        this.containerId = containerId;
        this.texturePath = texturePath;
        this.nextPageUrl = nextPageUrl || null;
        
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
        this.delayBetweenDonuts = 0.1; // ドーナツ間の遅延時間（秒）を短くして20枚でも全体の長さを調整
        this.finalDelay = 0.5;         // 最終段階後の遅延時間（秒）
        
        // 20枚のドーナツ用の配列を準備
        this.donutCount = 10; // ドーナツの枚数
        this.rotationAngle = 15; // 各ドーナツの回転角度（度）
        
        // 初期Z位置（深さ方向に少しずつずらす）
        this.zPositions = Array.from({ length: this.donutCount }, (_, i) => 7 + (i * 0.2));
        
        // 終了位置Z（個別に設定可能）
        this.targetZ = Array.from({ length: this.donutCount }, (_, i) => 5 - (i * 0.5));
        
        // リセット位置Z（個別に設定）
        this.resetZ = Array.from({ length: this.donutCount }, (_, i) =>5 - (i * 0.5));
        
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
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
        
        // リサイズイベント
        window.addEventListener('resize', () => this.onResize());
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
            console.log('テキストメッシュの作成を開始');
            
            // フォントのチェック
            if (!this.font) {
                console.warn('フォントがロードされていないため、テキストメッシュを作成できません');
                return;
            }
            
            // TextGeometryの存在確認
            let TextGeometryConstructor;
            if (typeof THREE.TextGeometry !== 'undefined') {
                console.log('THREE.TextGeometryを使用');
                TextGeometryConstructor = THREE.TextGeometry;
            } else if (typeof THREE.examples !== 'undefined' && THREE.examples.jsm && THREE.examples.jsm.geometries && THREE.examples.jsm.geometries.TextGeometry) {
                console.log('THREE.examples.jsm.geometries.TextGeometryを使用');
                TextGeometryConstructor = THREE.examples.jsm.geometries.TextGeometry;
            } else if (typeof TextGeometry !== 'undefined') {
                console.log('グローバルTextGeometryを使用');
                TextGeometryConstructor = TextGeometry;
            } else {
                console.error('TextGeometryが見つかりません。CDN URLを確認してください');
                return;
            }
            
            // テキストジオメトリの作成
            console.log('テキストジオメトリを作成中');
            const textGeometry = new TextGeometryConstructor(this.textContent, {
                font: this.font,
                size: this.textSize,
                height: 0.05,
                curveSegments: 4,
                bevelEnabled: false
            });
            
            // テキストの中央揃え
            textGeometry.computeBoundingBox();
            const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
            const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
            textGeometry.translate(-textWidth / 2, -textHeight / 2, 0);
            
            // テキストマテリアルの作成
            const textMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0
            });
            
            // テキストメッシュの作成
            this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
            this.textMesh.position.set(
                this.textPosition.x,
                this.textPosition.y,
                this.textPosition.z
            );
            
            this.scene.add(this.textMesh);
            console.log('テキストメッシュを作成しました');
        } catch (error) {
            console.error('テキストメッシュの作成に失敗しました:', error);
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
        
        // フェードアウト後に必ずcontent.htmlに遷移
        setTimeout(() => {
            console.log('フェードアウト完了、次のアクション実行', { nextPageUrl: this.nextPageUrl });
            
            // 常にcontent.htmlに遷移
            console.log('content.htmlへのページ遷移を開始します');
            window.location.href = 'content.html';
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
        
        // 常にアニメーションフレームを要求
        requestAnimationFrame(() => this.animate());
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
        // タイムアウトをクリア
        if (this.loadingTimeout) {
            clearTimeout(this.loadingTimeout);
        }
        
        // メッシュの解放
        for (const mesh of this.donutMeshes) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        }
        
        // テキストメッシュの解放
        if (this.textMesh) {
            this.scene.remove(this.textMesh);
            this.textMesh.geometry.dispose();
            this.textMesh.material.dispose();
        }
        
        // テクスチャの解放
        if (this.donutTexture) {
            this.donutTexture.dispose();
        }
        
        // レンダラーの解放
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // イベントリスナーの削除
        window.removeEventListener('resize', this.onResize);
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
