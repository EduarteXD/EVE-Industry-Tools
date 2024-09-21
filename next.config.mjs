/** @type {import('next').NextConfig} */
import withYaml from 'next-plugin-yaml'
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();
const nextConfig = withNextIntl(withYaml());

export default nextConfig;
