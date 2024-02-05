const dns = require('dns');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8081;
const cors = require('cors');
app.use(cors({optionsSuccessStatus: 200}));

app.use(express.urlencoded());

/* url object example:
  {
    long: 'https://www.radiorecord.ru/',
    short: 1,
  }
 */
const urls = [];

app.post('/api/shorturl', async (req, res) => {
  const urlFromBody = req.body.url;

  if (!urlFromBody) {
    return res.json({'error': 'Invalid URL'});
  }

  try {
    await lookupURL(urlFromBody);
  } catch (err) {
    return res.json({'error': 'Invalid URL'});
  }

  let urlObj = urls.find((url) => url.long === urlFromBody);
  if (!urlObj) {
    urlObj = {
      long: urlFromBody,
      short: urls.length === 0 ? 1 : urls[urls.length - 1].short + 1,
    };
    urls.push(urlObj);
  }

  const result = {
    original_url: urlObj.long,
    short_url: urlObj.short,
  };

  return res.json(result);
});

const lookupURL = async (url) => {
  const parsedUrl = new URL(url);

  return new Promise((resolve, reject) => {
    dns.lookup(parsedUrl.protocol ? parsedUrl.host : parsedUrl.pathname, (error, address, family) => {
      if (error) {
        reject(error);
      }
      resolve(address);
    });
  });
};

app.get('/api/shorturl/:url', (req, res) => {
  const shortUrlFromParams = req.params.url;

  if (!Number(shortUrlFromParams) || Number(shortUrlFromParams) < 1) {
    return res.json({'error': 'Wrong format'});
  }

  const urlObj = urls.find((url) => url.short === Number(shortUrlFromParams));

  if (!urlObj) {
    return res.json({'error': 'No short URL found for the given input'});
  }

  return res.redirect(urlObj.long);
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
