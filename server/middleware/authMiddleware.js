const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect
 * Verifies the JWT from the Authorization header.
 * Attaches the authenticated user object to req.user on success.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data — excludes password via select("-password")
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. User belonging to this token no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token has expired.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Not authorized. Token is invalid.",
    });
  }
};

/**
 * authorize(...roles)
 * Role-based access control gate. Must be used AFTER protect middleware.
 * Usage: router.get('/admin-only', protect, authorize('admin'), handler)
 *
 * @param {...string} roles - One or more allowed roles (e.g., 'admin', 'bda')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please log in.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not permitted to perform this action.`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
