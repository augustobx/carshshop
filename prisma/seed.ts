// Delegación al script maestro de seed SaaS
import('../scripts/seed-saas.mjs').catch(err => {
  console.error('Error ejecutando seed-saas:', err);
});