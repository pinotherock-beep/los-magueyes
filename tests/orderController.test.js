jest.mock('../src/config/database', () => ({
  sequelize: { query: jest.fn() }
}));

const { sequelize } = require('../src/config/database');
const orderController = require('../src/controllers/orderController');

describe('Cola de pedidos FIFO', () => {
  beforeEach(() => jest.clearAllMocks());

  test('consulta activos en orden ascendente y asigna su turno', async () => {
    sequelize.query
      .mockResolvedValueOnce([{ id: 4 }, { id: 7 }, { id: 9 }])
      .mockResolvedValueOnce([{ id: 3, status: 'entregado' }]);
    const res = { render: jest.fn() };
    const next = jest.fn();

    await orderController.index({}, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(sequelize.query.mock.calls[0][0]).toContain('ORDER BY o.created_at ASC, o.id ASC');
    expect(sequelize.query.mock.calls[1][0]).toContain('ORDER BY o.updated_at DESC, o.id DESC');
    expect(res.render).toHaveBeenCalledWith('admin/orders/index', {
      title: 'Pedidos',
      orders: [
        { id: 4, queuePosition: 1 },
        { id: 7, queuePosition: 2 },
        { id: 9, queuePosition: 3 }
      ],
      historyOrders: [{ id: 3, status: 'entregado' }]
    });
  });
});
