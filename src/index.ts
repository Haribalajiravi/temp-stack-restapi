import express, {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from 'express';
const app: express.Application = express();
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import UserRoutes from './routes/user';
import dotEnv from 'dotenv';
import swaggerUI, { SwaggerOptions } from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import ProductConfig from './config';
dotEnv.config();

mongoose.Promise = global.Promise;
mongoose.connect(
  process.env.MONGO_DB_URL || ProductConfig.mongo.url,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const options: SwaggerOptions = {
  swaggerDefinition: ProductConfig.swagger.definition,
  apis: ['./src/routes/user.ts'],
};

app.use(
  '/docs',
  swaggerUI.serve,
  swaggerUI.setup(swaggerJsDoc(options))
);

app.use(cookieParser());
app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use('/user', UserRoutes);
app.use(
  (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).send({ success: false, message: err });
    }
    next();
  }
);

const port: string = process.env.PORT || ProductConfig.port;
app.listen(port);
// tslint:disable-next-line:no-console
console.log(`Server listening at ${port}`);
