class BubbleScene {
  constructor(config) {
    this.config = config || {};
    this.containerId = this.config.containerId || 'defaultCanvasId';
    this.bubbleCount = this.config.bubbleCount || 20;
    this.speedFactor = this.config.speedFactor || 1;
    this.colorScheme = this.config.colorScheme || 0;
    this.isPaused = false;
    this.animationFrameId = null;
    this.bubbles = [];
    
    this.init();
  }
  
  init() {
    // キャンバス要素を取得
    this.canvas = document.getElementById(this.containerId);
    if (!this.canvas) {
      console.error(`キャンバス要素 #${this.containerId} が見つかりません`);
      return;
    }
    
    // キャンバスが確実に表示されるようにする
    this.canvas.style.visibility = 'visible';
    this.canvas.style.opacity = '1';
    
    // キャンバスのサイズを設定
    this.resizeCanvas();
    
    // リサイズイベントを監視
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // バブルを生成
    this.createBubbles();
    
    // アニメーションを開始
    this.start();
    
    console.log(`BubbleScene ${this.containerId} の初期化が完了しました`);
  }
  
  createBubbles() {
    this.bubbles = [];
    for (let i = 0; i < this.bubbleCount; i++) {
      this.bubbles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 30 + 10,
        dx: (Math.random() - 0.5) * 2 * this.speedFactor,
        dy: (Math.random() - 0.5) * 2 * this.speedFactor,
        color: this.getRandomColor(i)
      });
    }
  }
  
  getRandomColor(index) {
    const hue = this.colorScheme === 0 ? 
      // ブルー系
      200 + Math.random() * 60 : 
      this.colorScheme === 1 ? 
        // パープル系
        270 + Math.random() * 60 : 
        // マルチカラー
        (index * 30) % 360;
    
    return `hsla(${hue}, 70%, 60%, 0.7)`;
  }
  
  start() {
    if (this.isPaused) {
      this.isPaused = false;
    }
    
    // キャンバスのクリア
    if (this.canvas && this.canvas.getContext) {
      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // レンダリングループを開始
    this.render();
  }
  
  render() {
    if (this.isPaused) return;
    
    // キャンバスのクリア
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 背景を半透明に設定
    ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // バブルの描画と更新
    this.bubbles.forEach(bubble => {
      // 位置の更新
      bubble.x += bubble.dx;
      bubble.y += bubble.dy;
      
      // 境界チェック
      if (bubble.x < 0 || bubble.x > this.canvas.width) {
        bubble.dx = -bubble.dx;
      }
      if (bubble.y < 0 || bubble.y > this.canvas.height) {
        bubble.dy = -bubble.dy;
      }
      
      // バブルの描画
      ctx.beginPath();
      
      // グラデーションを作成
      const gradient = ctx.createRadialGradient(
        bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, 
        bubble.radius * 0.1,
        bubble.x, bubble.y, 
        bubble.radius
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.5, bubble.color);
      gradient.addColorStop(1, 'rgba(100, 100, 255, 0.1)');
      
      ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // 光沢効果を追加
      ctx.beginPath();
      ctx.arc(
        bubble.x - bubble.radius * 0.3,
        bubble.y - bubble.radius * 0.3,
        bubble.radius * 0.3,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();
    });
    
    // 次のフレームを要求
    this.animationFrameId = requestAnimationFrame(() => this.render());
  }
  
  pause() {
    if (!this.isPaused) {
      this.isPaused = true;
      
      // アニメーションフレームをキャンセル
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      
      console.log(`BubbleScene ${this.containerId} を一時停止しました`);
    }
  }
  
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.render(); // レンダリングを再開
      console.log(`BubbleScene ${this.containerId} を再開しました`);
    }
  }
  
  resizeCanvas() {
    if (!this.canvas) return;
    
    // 親要素のサイズに合わせる
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
      
      // キャンバススタイルを確実に設定
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.position = 'absolute';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
    }
    
    // リサイズ後にバブルの位置を調整
    if (this.bubbles && this.bubbles.length) {
      this.bubbles.forEach(bubble => {
        if (bubble.x > this.canvas.width) bubble.x = this.canvas.width * Math.random();
        if (bubble.y > this.canvas.height) bubble.y = this.canvas.height * Math.random();
      });
    }
    
    // リサイズ後に強制的に再レンダリング
    if (!this.isPaused) {
      this.render();
    }
  }
}
