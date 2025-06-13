module.exports = {
  siteUrl: 'https://შენი-საიტი.ge',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/'
      }
    ]
  },
  exclude: ['/admin/*'],
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
}; 