const express = require('express');
const cors = require('cors');
const Nyora = require('nyora-sdk');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// إنشاء عميل Nyora
const client = new Nyora();

// 1) الصفحة الرئيسية
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'سيرفر مانجا ستار شغال!' });
});

// 2) جلب المصادر العربية فقط
app.get('/sources', async (req, res) => {
  try {
    const allSources = await client.sources.list();
    // فلترة المصادر العربية (لغة ar)
    const arabicSources = allSources.filter(s => s.lang === 'ar' || s.lang === 'arabic');
    res.json({ status: 'ok', count: arabicSources.length, sources: arabicSources });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// 3) قائمة المانجا (بحث أو الأكثر شهرة)
app.get('/manga', async (req, res) => {
  try {
    const { sourceId, query, page } = req.query;
    const p = parseInt(page) || 1;
    let result;

    if (query) {
      result = await client.manga.search(sourceId, query, p);
    } else {
      result = await client.manga.popular(sourceId, p);
    }

    res.json({ status: 'ok', page: p, hasNextPage: result.hasNextPage, mangas: result.entries });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// 4) تفاصيل المانجا + الفصول
app.get('/manga/details', async (req, res) => {
  try {
    const { sourceId, mangaUrl, title } = req.query;
    const details = await client.manga.details(sourceId, mangaUrl, { title });
    res.json({ status: 'ok', details });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// 5) صور الفصل
app.get('/chapter/pages', async (req, res) => {
  try {
    const { sourceId, chapterUrl, branch } = req.query;
    const pages = await client.manga.pages(sourceId, chapterUrl, { branch });
    res.json({ status: 'ok', pages });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// 6) أحدث التحديثات (للمانجا والمانهوا العربية)
app.get('/latest', async (req, res) => {
  try {
    const { sourceId, page } = req.query;
    const p = parseInt(page) || 1;
    const latest = await client.manga.latest(sourceId, p);
    res.json({ status: 'ok', page: p, hasNextPage: latest.hasNextPage, mangas: latest.entries });
  } catch (e) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

app.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});
