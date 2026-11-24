import { createFileRoute, redirect } from '@tanstack/react-router';

// The ASC page became "For materials management"; old links land there permanently.
export const Route = createFileRoute('/for/asc')({
  staticData: { sitemap: false },
  beforeLoad: () => { throw redirect({ to: '/for/materials-management', statusCode: 301, replace: true }); },
});
