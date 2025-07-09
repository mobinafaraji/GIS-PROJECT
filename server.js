const express = require('express');
const cors = require('cors');
const request = require('request');
const app = express();

// فعال‌سازی CORS
app.use(cors());

// پروکسی کردن درخواست‌ها به GeoServer
app.use('/geoserver', (req, res) => {
  const targetUrl = `https://www.gis-geoserver.polimi.it/geoserver/gisgeoserver_06/wms${req.url}`;
  req.pipe(request(targetUrl)).pipe(res); // پروکسی درخواست‌ها به GeoServer
});

// راه‌اندازی سرور پروکسی
app.listen(3000, () => {
  console.log('Proxy server running at http://localhost:3000');
});
