const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const API = 'https://api.mangadex.org';

// 1) الصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'سيرفر مانجا ستار شغال!' });
});

// 2) قائمة المانجا مع Pagination
app.get('/manga', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    const response = await axios.get(`${API}/manga`, {
      params: {
        limit: limit,
        offset: offset,
        'availableTranslatedLanguage[]': 'ar',
        'includes[]': 'cover_art',
        'order[latestUploadedChapter]': 'desc'
      }
    });

    const mangas = response.data.data.map(m => {
      const title = m.attributes.title.ar 
        || m.attributes.title.en 
        || Object.values(m.attributes.title)[0] 
        || 'بدون اسم';
      const coverRel = m.relationships.find(r => r.type === 'cover_art');
      const coverFile = coverRel?.attributes?.fileName;
      const cover = coverFile 
        ? `https://uploads.mangadex.org/covers/${m.id}/${coverFile}.256.jpg` 
        : null;
      return { id: m.id, title, cover };
    });

    const total = response.data.total || 0;
    res.json({ 
      status: 'ok', 
      count: mangas.length, 
      offset: offset,
      total: total,
      hasMore: (offset + limit) < total,
      mangas 
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// 3) البحث في المانجا
app.get('/manga/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;

    if (!q || q.trim() === '') {
      return res.json({ status: 'ok', count: 0, offset: 0, total: 0, hasMore: false, mangas: [] });
    }

    const response = await axios.get(`${API}/manga`, {
      params: {
        title: q,
        limit: limit,
        offset: offset,
        'availableTranslatedLanguage[]': 'ar',
        'includes[]': 'cover_art',
        'order[relevance]': 'desc'
      }
    });

    const mangas = response.data.data.map(m => {
      const title = m.attributes.title.ar 
        || m.attributes.title.en 
        || Object.values(m.attributes.title)[0] 
        || 'بدون اسم';
      const coverRel = m.relationships.find(r => r.type === 'cover_art');
      const coverFile = coverRel?.attributes?.fileName;
      const cover = coverFile 
        ? `https://uploads.mangadex.org/covers/${m.id}/${coverFile}.256.jpg` 
        : null;
      return { id: m.id, title, cover };
    });

    const total = response.data.total || 0;
    res.json({ 
      status: 'ok', 
      count: mangas.length, 
      offset: offset,
      total: total,
      hasMore: (offset + limit) < total,
      query: q,
      mangas 
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// 4) تفاصيل مانجا + الفصول العربية
app.get('/manga/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const info = await axios.get(`${API}/manga/${id}`, {
      params: { 'includes[]': 'cover_art' }
    });

    const m = info.data.data;
    const title = m.attributes.title.ar 
      || m.attributes.title.en 
      || Object.values(m.attributes.title)[0] 
      || 'بدون اسم';
    const description = m.attributes.description?.ar 
      || m.attributes.description?.en 
      || 'لا يوجد وصف';
    const coverRel = m.relationships.find(r => r.type === 'cover_art');
    const coverFile = coverRel?.attributes?.fileName;
    const cover = coverFile 
      ? `https://uploads.mangadex.org/covers/${id}/${coverFile}.512.jpg` 
      : null;

    const chaptersRes = await axios.get(`${API}/manga/${id}/feed`, {
      params: {
        limit: 500,
        'translatedLanguage[]': ['ar'],
        'order[chapter]': 'desc',
        'includes[]': []
      }
    });

    const chapters = chaptersRes.data.data.map(c => ({
      id: c.id,
      name: c.attributes.chapter 
        ? `الفصل ${c.attributes.chapter}` 
        : c.attributes.title || 'فصل',
      chapterNumber: c.attributes.chapter || '0'
    }));

    res.json({ 
      status: 'ok', 
      id, 
      title, 
      cover, 
      description, 
      chapters,
      chaptersCount: chapters.length
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// 5) صور الفصل
app.get('/chapter/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const chapterRes = await axios.get(`${API}/at-home/server/${id}`);
    const baseUrl = chapterRes.data.baseUrl;
    const hash = chapterRes.data.chapter.hash;
    const data = chapterRes.data.chapter.data;

    const images = data.map(file => `${baseUrl}/data/${hash}/${file}`);

    res.json({ 
      status: 'ok', 
      id, 
      count: images.length,
      images 
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});
