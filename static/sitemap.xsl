<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">

<xsl:output method="html" indent="yes" encoding="UTF-8"/>

<xsl:template match="/">
  <html>
    <head>
      <title>XML Sitemap</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 1200px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        h1 {
          color: #333;
          border-bottom: 3px solid #4CAF50;
          padding-bottom: 10px;
        }
        .info {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        table {
          width: 100%;
          background: white;
          border-collapse: collapse;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th {
          background: #4CAF50;
          color: white;
          padding: 15px;
          text-align: left;
        }
        td {
          padding: 12px 15px;
          border-bottom: 1px solid #ddd;
        }
        tr:hover {
          background: #f5f5f5;
        }
        a {
          color: #4CAF50;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        .count {
          font-size: 24px;
          font-weight: bold;
          color: #4CAF50;
        }
      </style>
    </head>
    <body>
      <h1>XML Sitemap</h1>
      
      <div class="info">
        <p>This is an XML Sitemap used by search engines like Google.</p>
        <p>Total URLs: <span class="count"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span></p>
      </div>

      <table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Priority</th>
            <th>Change Frequency</th>
            <th>Last Modified</th>
          </tr>
        </thead>
        <tbody>
          <xsl:for-each select="sitemap:urlset/sitemap:url">
            <tr>
              <td>
                <a href="{sitemap:loc}">
                  <xsl:value-of select="sitemap:loc"/>
                </a>
              </td>
              <td><xsl:value-of select="sitemap:priority"/></td>
              <td><xsl:value-of select="sitemap:changefreq"/></td>
              <td><xsl:value-of select="sitemap:lastmod"/></td>
            </tr>
          </xsl:for-each>
        </tbody>
      </table>
    </body>
  </html>
</xsl:template>

</xsl:stylesheet>
