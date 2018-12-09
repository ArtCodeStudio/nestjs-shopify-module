import { Connection, Document, Model, Mongoose } from 'mongoose';
import { OrderSchema, OrderDocument} from './interfaces/order.schema';
import { ProductSchema, ProductDocument} from './interfaces/product.schema';
import { CustomerSchema, CustomerDocument } from './interfaces/customer.schema';
import { TransactionSchema, TransactionDocument} from './interfaces/transaction.schema';

export const shopifyApiProviders = (connection: Mongoose) => {
  return [
    {
      provide: 'OrderModelToken',
      useValue: <Model<OrderDocument>> connection.model('shopify_order', OrderSchema),
    },
    {
      provide: 'ProductModelToken',
      useValue: <Model<ProductDocument>> connection.model('shopify_product', ProductSchema),
    },
    {
      provide: 'CustomerModelToken',
      useValue: <Model<CustomerDocument>> connection.model('shopify_customer', CustomerSchema),
    },
    {
      provide: 'TransactionModelToken',
      useValue: <Model<TransactionDocument>> connection.model('shopify_transaction', TransactionSchema),
    },
  ];
}

