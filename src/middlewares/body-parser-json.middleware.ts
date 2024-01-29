import { Injectable, NestMiddleware } from "@nestjs/common";
import * as bodyParser from "body-parser";
import { IUserRequest } from "../interfaces/user-request";
import { NextFunction } from "express";
import { ServerResponse } from "http";

/**
 * Body parser json middleware to use the middleware if you have disabled the default nest paser middleware
 * @see https://github.com/nestjs/nest/blob/master/packages/core/nest-application.ts#L159
 * @see https://github.com/expressjs/body-parser
 */
@Injectable()
export class BodyParserJsonMiddleware implements NestMiddleware {
  use(req: IUserRequest, res: ServerResponse, next: NextFunction) {
    const jsonParser = bodyParser.json();
    return jsonParser(req, res, next);
  }
}
