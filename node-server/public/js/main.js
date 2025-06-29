// バブル生成関数
function createBubbles(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // 既存のバブルをクリア
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  
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
  if (fromId === 'animation-section' && window.transactionAnimation) {
    console.log('アニメーションを停止してリソースを解放します');
    
    // アニメーションフレームをキャンセル
    if (window.transactionAnimation._animationFrameId) {
      cancelAnimationFrame(window.transactionAnimation._animationFrameId);
      window.transactionAnimation._animationFrameId = null;
    }
    
    // アニメーション停止
    window.transactionAnimation.stopAnimation();
    
    // レンダラーのDOMエレメントを削除（メモリリーク防止）
    if (window.transactionAnimation.renderer && window.transactionAnimation.renderer.domElement) {
      const canvasContainer = document.getElementById('canvas-container');
      if (canvasContainer && canvasContainer.contains(window.transactionAnimation.renderer.domElement)) {
        canvasContainer.removeChild(window.transactionAnimation.renderer.domElement);
      }
    }
    
    // リソースを解放
    window.transactionAnimation.dispose();
    window.transactionAnimation = null;
    
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
    
    // コンテンツセクションに切り替える場合、スクロール監視を開始
    if (toId === 'content-section') {
      // スクロール処理の初期化
      initScrollAnimations();
      // キャンバスの表示
      initCanvasWrappers();
      
      // コンテンツセクションがアクティブになったら、bodyのオーバーフローを調整
      document.body.style.overflow = 'auto';
      window.scrollTo(0, 0); // 一番上にスクロール
      
      // 遅延してからすべてのコンテンツを確実に表示（アニメーション終了後）
      setTimeout(() => {
        // キャンバスラッパーを強制的に表示
        document.querySelectorAll('.canvas-wrapper').forEach(wrapper => {
          wrapper.classList.add('visible');
          wrapper.style.opacity = '1';
          wrapper.style.visibility = 'visible';
        });
        
        // コンテンツ内のテキスト要素も強制的に表示
        document.querySelectorAll('.intro-content p, .section-title').forEach(el => {
          el.classList.add('visible');
          el.style.opacity = '1';
          el.style.visibility = 'visible';
        });
      }, 1000);
    } else {
      // それ以外のセクションに切り替える場合は、bodyのオーバーフローをhiddenに戻す
      document.body.style.overflow = 'hidden';
    }
    
    if (callback && typeof callback === 'function') {
      callback();
    }
  }, 800); // フェードアウト時間に合わせる
}

// スクロールアニメーションの初期化
function initScrollAnimations() {
  // Intersection Observerの設定
  const observerOptions = {
    root: null, // ビューポートをルートとして使用
    rootMargin: '0px',
    threshold: 0.2 // 要素の20%が見えたときに発火
  };
  
  // セクションタイトルの監視
  const titleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        titleObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // パラグラフの監視
  const paragraphObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        paragraphObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // キャンバスラッパーの監視
  const canvasObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        canvasObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // 要素の監視を開始
  document.querySelectorAll('.section-title').forEach((el, index) => {
    titleObserver.observe(el);
  });
  
  document.querySelectorAll('.intro-content p').forEach((el, index) => {
    el.style.setProperty('--delay', index);
    paragraphObserver.observe(el);
  });
  
  document.querySelectorAll('.canvas-wrapper').forEach((el, index) => {
    el.style.setProperty('--delay', index);
    canvasObserver.observe(el);
  });
  
  console.log('スクロールアニメーションの監視を開始しました');
}

// キャンバスラッパーの初期化（Three.jsのシーンを各ラッパーに割り当て）
function initCanvasWrappers() {
  // キャンバスラッパーを取得
  const canvasWrappers = document.querySelectorAll('.canvas-wrapper');
  if (!canvasWrappers.length) return;
  
  console.log(`${canvasWrappers.length}個のキャンバスラッパーを初期化します`);
  
  // 各ラッパーにThree.jsシーンを作成
  canvasWrappers.forEach((wrapper, index) => {
    const canvasId = wrapper.getAttribute('data-canvas-id');
    if (!canvasId) return;
    
    console.log(`キャンバス ${canvasId} を初期化中...`);
    
    // 既存のキャンバスがあれば削除（クリーンな状態から始める）
    const existingCanvas = document.getElementById(canvasId);
    if (existingCanvas) {
      existingCanvas.parentNode.removeChild(existingCanvas);
    }
    
    // シーンを作成し、ラッパーに追加
    const canvas = document.createElement('canvas');
    canvas.id = canvasId;
    canvas.classList.add('bubble-canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    wrapper.prepend(canvas);
    
    // シーンに応じてパラメータを変える
    let config = {
      containerId: canvasId,
      bubbleCount: 20 + index * 5, // 各キャンバスで泡の数を変える
      speedFactor: 0.5 + index * 0.3, // 速度も変える
      colorScheme: index % 3 // 色合いも変える
    };
    
    // BubbleSceneをインスタンス化
    try {
      window[`bubbleScene${index}`] = new BubbleScene(config);
      console.log(`キャンバス ${canvasId} の初期化が完了しました`);
      
      // 確実にキャンバスが見えるように強制的に一度レンダリング
      if (window[`bubbleScene${index}`]) {
        window[`bubbleScene${index}`].render();
      }
      
      // ラッパーを確実に可視化
      wrapper.style.visibility = 'visible';
      wrapper.style.opacity = '1';
      wrapper.classList.add('visible');
      
      // キャンバスが視界内にあるかどうかを監視
      observeCanvasVisibility(wrapper, window[`bubbleScene${index}`]);
    } catch (error) {
      console.error(`キャンバス ${canvasId} の初期化中にエラーが発生しました:`, error);
    }
  });
  
  // すべてのキャンバスラッパーが確実に表示されるようにクラスを追加
  setTimeout(() => {
    document.querySelectorAll('.canvas-wrapper').forEach(wrapper => {
      wrapper.classList.add('visible');
      wrapper.style.opacity = '1';
      wrapper.style.visibility = 'visible';
    });
  }, 100);
}

// キャンバスの可視性を監視し、視界外のときは描画を停止
function observeCanvasVisibility(wrapper, sceneInstance) {
  // Intersection Observerの設定
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 視界内に入ったら描画を再開
        if (sceneInstance && typeof sceneInstance.resume === 'function') {
          sceneInstance.resume();
          console.log(`キャンバス ${wrapper.getAttribute('data-canvas-id')} の描画を再開`);
        }
      } else {
        // 視界外に出たら描画を一時停止
        if (sceneInstance && typeof sceneInstance.pause === 'function') {
          sceneInstance.pause();
          console.log(`キャンバス ${wrapper.getAttribute('data-canvas-id')} の描画を一時停止`);
        }
      }
    });
  }, {
    root: null,
    rootMargin: '0px',
    threshold: 0.1 // 10%が見えたら反応
  });
  
  // 監視開始
  observer.observe(wrapper);
}

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

// DOMが完全に読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM ContentLoaded イベント発生');
  
  // 初期状態でbodyのオーバーフローを設定
  document.body.style.overflow = 'hidden';
  
  // バブルを生成
  createBubbles('welcome-bubble-container', 15);
  
  // コンテンツセクションがアクティブかどうかをチェック
  if (document.getElementById('content-section').classList.contains('active-section')) {
    // コンテンツセクションがアクティブならスクロール可能に
    document.body.style.overflow = 'auto';
    // ヒーローセクション用のバブルを生成
    createBubbles('content-bubble-container', 15);
    // スクロール処理の初期化
    initScrollAnimations();
    // キャンバスの表示
    initCanvasWrappers();
  }
  
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
          const texturePath = '/texture/circle_mofvji.webp';
          console.log('設定されたテクスチャパス:', texturePath);
          
          // アニメーション開始
          window.transactionAnimation = new TransactionAnimation('canvas-container', texturePath);
          
          // トランジションの方向を設定
          window.transactionAnimation.textDirection = "forward"; // 前進トランジション
          
          console.log('トランジションアニメーションのインスタンス作成完了');
        } catch (error) {
          console.error('トランジションアニメーションの初期化中にエラーが発生しました:', error);
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
      
      // トランジションアニメーションを使用して戻る
      switchSection('content-section', 'animation-section', () => {
        console.log('アニメーションセクションに戻りました');
        
        // アニメーションの初期化と開始（逆方向）
        try {
          const texturePath = '/texture/circle_mofvji.webp';
          console.log('設定されたテクスチャパス:', texturePath);
          
          // アニメーション開始
          window.transactionAnimation = new TransactionAnimation('canvas-container', texturePath);
          
          // トランジションの方向を設定
          window.transactionAnimation.textDirection = "backward"; // 後退トランジション
          
          console.log('逆方向のトランジションアニメーションのインスタンス作成完了');
        } catch (error) {
          console.error('トランジションアニメーションの初期化中にエラーが発生しました:', error);
        }
      });
    });
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
});
