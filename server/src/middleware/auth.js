import { supabaseAdmin } from "../services/supabaseAdmin.js";

export async function requireAuth(req, _res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    const error = new Error("Missing authorization token");
    error.status = 401;
    next(error);
    return;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    const authError = new Error("Invalid authorization token");
    authError.status = 401;
    next(authError);
    return;
  }

  req.user = data.user;
  next();
}
