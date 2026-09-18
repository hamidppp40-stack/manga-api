const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

const BASE = 'https://azoramoon.com';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'ar,en;q=0.9'
};

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'سيرفر مانجا ستار شغال!' });
});

app.get('/manga', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const url = page > 1 ? `${BASE}/manga/page/${page}/` : `${BASE}/manga/`;
    const { data } = await axios.get(url, { headers: HEADERS });
    const $ = cheerio.load(data);

    const mangas = [];
    $('.page-item-detail, .c-tabs-item__content').each((i, el) => {
      const titleEl = $(el).find('.post-title h3 a, .h4 a').first();
      const title = titleEl.text().trim();
      const link = titleEl.attr('href');
      const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
      
      if (title && link) {
        const slug = link.replace(BASE, '').replace(/^\/|\/$/g, '');
        mangas.push({ id: slug, title: title, cover: img });
      }
    });

    res.json({ 
      status: 'ok', 
      page: page, 
      count: mangas.length, 
      hasNextPage: mangas.length > 0,
      mangas 
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.get('/manga/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) {
      return res.json({ status: 'ok', count: 0, mangas: [] });
    }

    const url = `${BASE}/?s=${encodeURIComponent(q)}&post_type=wp-manga`;
    const { data } = await axios.get(url, { headers: HEADERS });
    const $ = cheerio.load(data);

    const mangas = [];
    $('.page-item-detail, .c-tabs-item__content').each((i, el) => {
      const titleEl = $(el).find('.post-title h3 a, .h4 a').first();
      const title = titleEl.text().trim();
      const link = titleEl.attr('href');
      const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');

      if (title && link) {
        const slug = link.replace(BASE, '').replace(/^\/|\/$/g, '');
        mangas.push({ id: slug, title, cover: img });
      }
    });

    res.json({ status: 'ok', count: mangas.length, query: q, mangas });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.get('/manga/*', async (req, res) => {
  try {
    const slug = req.params[0];
    const url = `${BASE}/${slug}/`;
    const { data } = await axios.get(url, { headers: HEADERS });
    const $ = cheerio.load(data);

    const title = $('.post-title h1').text().trim();
    const cover = $('.summary_image img').attr('src') || $('.summary_image img').attr('data-src');
    const description = $('.description-summary p').text().trim() 
                     || $('.summary__content p').text().trim();

    const chapters = [];
    $('.wp-manga-chapter a, li.wp-manga-chapter a').each((i, el) => {
      const name = $(el).text().trim();
      const link = $(el).attr('href');
      if (link && name) {
        const chapterSlug = link.replace(BASE, '').replace(/^\/|\/$/g, '');
        chapters.push({ id: chapterSlug, name: name });
      }
    });

    res.json({ 
      status: 'ok', 
      id: slug,
      title, 
      cover, 
      description, 
      chaptersCount: chapters.length,
      chapters 
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.get('/chapter/*', async (req, res) => {
  try {
    const slug = req.params[0];
    const url = `${BASE}/${slug}/`;
    const { data } = await axios.get(url, { headers: HEADERS });
    const $ = cheerio.load(data);

    const images = [];
    $('.reading-content img, .page-break img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        const cleanSrc = src.trim();
        if (cleanSrc && !cleanSrc.includes('loading')) {
          images.push(cleanSrc);
        }
      }
    });

    res.json({ 
      status: 'ok', 
      id: slug, 
      count: images.length, 
      images 
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
