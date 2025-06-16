module.exports = {
  siteUrl: 'https://hotelserodani.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/'
      }
    ],
    additionalSitemaps: [
      'https://hotelserodani.com/sitemap.xml',
    ],
  },
  exclude: ['/admin/*'],
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
}; 