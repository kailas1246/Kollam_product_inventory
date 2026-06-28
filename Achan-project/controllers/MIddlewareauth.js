import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

export const checkBlocked = async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (user && user.isBlocked) {
    return res
      .status(403)
      .json({ message: "You are blocked from using this service." });
  }

  next();
};
