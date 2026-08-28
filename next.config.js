/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  typescript: {ignoreBuildErrors: false},
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        {key: 'X-Frame-Options', value: 'DENY'},
        {key: 'X-Content-Type-Options', value: 'nosniff'},
        {key: 'Referrer-Policy', value: 'no-referrer'},
        {key: 'X-Robots-Tag', value: 'noindex, nofollow'},
        {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'},
        {key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"},
      ],
    }];
  },
};
