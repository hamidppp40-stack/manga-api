const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// رابط الترحيب
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'سيرفر مانجا ستار شغال!' });
});

// رابط تجريبي للمانجا
app.get('/manga', (req, res) => {
  res.json({
    status: 'ok',
    mangas: [
      { id: '1', title: 'One Piece', cover: 'https://example.com/op.jpg' },
      { id: '2', title: 'Naruto', cover: 'https://example.com/naruto.jpg' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});