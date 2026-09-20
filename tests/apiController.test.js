jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({ isEmpty: () => true }))
}));

jest.mock('../src/config/database', () => ({
  sequelize: {
    query: jest.fn(),
    transaction: jest.fn()
  }
}));

const { sequelize } = require('../src/config/database');
const apiController = require('../src/controllers/apiController');

describe('Registro de pedidos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockImplementation(callback => callback({ connection: 'test' }));
  });

  test('guarda nombre, dirección y teléfono dentro de la transacción', async () => {
    sequelize.query
      .mockResolvedValueOnce([{ id: 1, name: 'Taco surtido', price: '32.00' }])
      .mockResolvedValueOnce([12])
      .mockResolvedValueOnce({ affectedRows: 1 });

    const req = {
      body: {
        customerName: 'Israel Arr',
        address: 'Calle 10 #25, colonia Centro',
        phone: '999 123 4567',
        orderType: 'llevar',
        notes: '',
        items: [{ productId: 1, quantity: 2 }]
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    await apiController.createOrder(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(sequelize.query.mock.calls[1][0]).toContain('customer_name, address, phone');
    expect(sequelize.query.mock.calls[1][1].replacements).toMatchObject({
      customerName: 'Israel Arr',
      address: 'Calle 10 #25, colonia Centro',
      phone: '999 123 4567'
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      orderId: 12,
      orderNumber: '0012',
      total: 64
    }));
  });
});
