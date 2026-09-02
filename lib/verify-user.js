/* lib/verify-user.js — ONE session check for every api/ function.
   "Does this access_token belong to this uid?" answered by Supabase auth
   itself. Lives outside api/ so Vercel never deploys it as a route.
   CommonJS on purpose: api/order.js is CommonJS (module.exports) and
   require()s it; save-user.js and feedback.js are ESM and import the named
   export, which Node resolves from the `exports.verifyUser =` form below.
   api/order.js keeps its local wrapper name so its call sites do not change. */
exports.verifyUser = async function verifyUser(supabaseUrl, serviceKey, uid, token) {
  if (!supabaseUrl || !serviceKey || !uid || !token) return false;
  try {
    const who = await fetch(supabaseUrl + '/auth/v1/user', {
      headers: { apikey: serviceKey, Authorization: 'Bearer ' + token }
    }).then(r => r.json());
    return !!(who && who.id === uid);
  } catch (e) { return false; }
};
