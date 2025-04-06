import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/invitados.tsx'),
  route('gastos', 'routes/gastos.tsx'),
] satisfies RouteConfig;
