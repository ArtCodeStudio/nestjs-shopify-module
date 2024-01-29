import { Injectable, NestMiddleware } from "@nestjs/common";
import * as bodyParser from "body-parser";
import { IUserRequest } from "../interfaces/user-request";
import { NextFunction } from "express";
import type { ServerResponse } from "http";

/**
 * Body parser urlencoded middleware to use the middleware if you have disabled the default nest paser middleware
 * @see https://github.com/nestjs/nest/blob/master/packages/core/nest-application.ts#L159
 * @see https://github.com/expressjs/body-parser
 */
@Injectable()
export class BodyParserUrlencodedMiddleware implements NestMiddleware {
  use(req: IUserRequest, res: ServerResponse, next: NextFunction) {
    const urlencodedParser = bodyParser.urlencoded({ extended: true });
    return urlencodedParser(req, res, next);
  }
}
