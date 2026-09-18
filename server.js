const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const BASE = 'https://mangatime.org';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// 1) قائمة المانجا
app.get('/manga', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const url = page > 1 ? `${BASE}/page/${page}/` : BASE;
    const { data } = await axios.get(url, { headers: HEADERS });
    const $ = cheerio.load(data);

    const mangas = [];
    $('.page-item-detail, .manga').each((i, el) => {
      const title = $(el).find('.post-title h3 a, .h4 a').text().trim();
      const link = $(el).find('.post-title h3 a, .h4 a').attr('href');
      const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      if (title && link) {
        mangas.push({
          id: link.replace(BASE, '').replace(/\//g, ''),
          title,
          cover: img
        });
      }
    });

    res.json({ status: 'ok', page: parseInt(page), count: mangas.length, mangas });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// 2) تفاصيل مانجا + الفصول
app.get('/manga/:slug', async (req, res) => {
  try {
    const url = `${BASE}/${req.params.slug}/`;
    const { data } = await axios.get(url, { headers: HEADERS });
    const $ = cheerio.load(data);

    const title = $('.post-title h1').text().trim();
    const cover = $('.summary_image img').attr('src');
    const description = $('.description-summary p').text().trim();

    const chapters = [];
    $('.wp-manga-chapter a, li.wp-manga-chapter a').each((i, el) => {
      const name = $(el).text().trim();
      const link = $(el).attr('href');
      if (link) {
        chapters.push({
          id: link.replace(BASE, '').replace(/\//g, ''),
          name: name
        });
      }
    });

    res.json({ status: 'ok', title, cover, description, chapters });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// 3) صور الفصل
app.get('/chapter/:slug', async (req, res) => {
  try {
    const url = `${BASE}/${req.params.slug}/`;
    const { data } = await axios.get(url, { headers: HEADERS });
    const $ = cheerio.load(data);

    const images = [];
    $('.reading-content img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) images.push(src.trim());
    });

    res.json({ status: 'ok', images });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
