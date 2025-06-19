module.exports = {
  siteUrl: 'https://hotelserodani.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/admin/*']
      }
    ],
    additionalSitemaps: [
      'https://hotelserodani.com/sitemap-0.xml',
    ],
  },
  exclude: ['/admin', '/admin/*', '/admin/login', '/admin/dashboard', '/admin/dashboard/*'],
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
}; 