import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository') private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Cliente não encontrado');
    }

    const findProductsId = products.map(p => {
      return { id: p.id };
    });

    const foundProducts = await this.productsRepository.findAllById(
      findProductsId,
    );

    if (foundProducts.length !== findProductsId.length) {
      throw new AppError('Código de produto inválido na solicitação do pedido');
    }

    const orderProducts = foundProducts.map(p => {
      const index = products.findIndex(pro => pro.id === p.id);
      if (p.quantity < products[index].quantity) {
        throw new AppError('Estoque insuficiente');
      }

      return {
        product_id: p.id,
        price: p.price,
        quantity: products[index].quantity,
      };
    });

    await this.productsRepository.updateQuantity(
      orderProducts.map(op => ({ id: op.product_id, quantity: op.quantity })),
    );

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    return order;
  }
}

export default CreateOrderService;
