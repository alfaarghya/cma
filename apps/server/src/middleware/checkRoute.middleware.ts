import { NextFunction, Request, Response } from "express";

//check the route on server
const checkRoutes = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method}${req.url}`);
  next();
}

export default checkRoutes;