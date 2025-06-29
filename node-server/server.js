const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// テンプレートエンジンの設定
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 静的ファイルのルート設定
app.use(express.static(path.join(__dirname, 'public')));

// 追加の静的ファイルパス（親ディレクトリからの参照用）
app.use('/texture', express.static(path.join(__dirname, '../texture')));
app.use('/script', express.static(path.join(__dirname, '../')));

// ルートへのアクセス
app.get('/', (req, res) => {
  res.render('index');
});

// サーバー起動
app.listen(port, () => {
  console.log(`Bubble Universe server running at http://localhost:${port}`);
});
