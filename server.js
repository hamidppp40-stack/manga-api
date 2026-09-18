const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// الرابط الأساسي لموقع MangaSlayer (قد يتغير)
const BASE_URL = 'https://mangaslayers.com';

// مسار لجلب قائمة المانجا
app.get('/manga', async (req, res) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/manga-list`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    const mangas = [];
    
    // هذه المحددات (Selectors) تعتمد على تصميم الموقع الحالي
    $('.manga-item').each((i, el) => {
      const title = $(el).find('.manga-title').text().trim();
      const link = $(el).find('a').attr('href');
      const cover = $(el).find('img').attr('src');
      if (title && link) {
        mangas.push({ title, link: BASE_URL + link, cover });
      }
    });
    
    res.json({ status: 'ok', count: mangas.length, mangas });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// مسار لجلب تفاصيل مانجا وفصولها
app.get('/manga/:id', async (req, res) => {
    // ... كود جلب التفاصيل والفصول ...
});

// مسار لجلب صور الفصل
app.get('/chapter/:id', async (req, res) => {
    // ... كود جلب صور الفصل ...
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
