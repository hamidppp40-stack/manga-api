const express = require('express');
const cors = require('cors');
const Nyora = require('nyora-sdk').default;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const client = new Nyora();

// 1) الصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'سيرفر مانجا ستار شغال!' });
});

// 2) قائمة المصادر العربية
app.get('/sources', async (req, res) => {
  try {
    const allSources = await client.sources.list();
    const arabicSources = allSources.filter(s => s.lang === 'ar');
    res.json({
      status: 'ok',
      totalSources: allSources.length,
      arabicCount: arabicSources.length,
      sources: arabicSources
    });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// 3) قائمة المانجا من مصدر عربي
app.get('/manga', async (req, res) => {
  try {
    const { sourceId, page } = req.query;
    if (!sourceId) {
      return res.status(400).json({ status: 'error', message: 'sourceId مطلوب' });
    }
    const p = parseInt(page) || 1;
    const result = await client.manga.popular(sourceId, p);
    res.json({ status: 'ok', page: p, mangas: result.entries });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// 4) البحث
app.get('/manga/search', async (req, res) => {
  try {
    const { sourceId, q, page } = req.query;
    if (!sourceId || !q) {
      return res.status(400).json({ status: 'error', message: 'sourceId و q مطلوبان' });
    }
    const p = parseInt(page) || 1;
    const result = await client.manga.search(sourceId, q, p);
    res.json({ status: 'ok', page: p, mangas: result.entries });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// 5) تفاصيل المانجا
app.get('/manga/details', async (req, res) => {
  try {
    const { sourceId, mangaUrl, title } = req.query;
    if (!sourceId || !mangaUrl) {
      return res.status(400).json({ status: 'error', message: 'sourceId و mangaUrl مطلوبان' });
    }
    const details = await client.manga.details(sourceId, mangaUrl, { title });
    res.json({ status: 'ok', details });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// 6) صور الفصل
app.get('/chapter/pages', async (req, res) => {
  try {
    const { sourceId, chapterUrl, branch } = req.query;
    if (!sourceId || !chapterUrl) {
      return res.status(400).json({ status: 'error', message: 'sourceId و chapterUrl مطلوبان' });
    }
    const pages = await client.manga.pages(sourceId, chapterUrl, { branch });
    res.json({ status: 'ok', pages });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
