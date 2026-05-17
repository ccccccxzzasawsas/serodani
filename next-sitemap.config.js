const PUBLIC_SEO_PATHS = new Set([
  '/',
  '/rooms',
  '/gallery',
  '/fine-dining',
  '/wines',
  '/contact',
]);

module.exports = {
  siteUrl: 'https://hotelserodani.com',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/admin/*', '/api/', '/api/*', '/booking', '/book-redirect']
      }
    ],
  },
  exclude: [
    '/admin',
    '/admin/*',
    '/admin/login',
    '/admin/dashboard',
    '/admin/dashboard/*',
    '/api/*',
    '/booking',
    '/book-redirect',
    '/hotels',
    '/kakheti-hotels',
    '/telavi-hotels',
  ],
  transform: async (config, path) => {
    if (!PUBLIC_SEO_PATHS.has(path)) {
      return null;
    }

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: path === '/' ? 1.0 : config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    };
  },
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
}; 
