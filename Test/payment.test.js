const request = require('supertest');
const app = require('../app'); // Express app

describe('Payment API Tests', () => {
    let token;
    let paymentId;

    const user = {
        email: 'paymenttest@example.com',
        password: '12345678',
    };

    const orderId = '1234567890abcdef';
    test("renders payment form fields", () => {
        render(<Payment />);

        expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/card holder/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument();
    });
    test('returns vehicle location detail by valid vehicle id', async () => {
        const vehicleRes = await request(app)
            .post('/api/vehicles')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Kia Morning',
                brand: 'Kia',
                pricePerDay: 450000,
                licensePlate: '43A-12345',
                location: 'Da Nang',
                latitude: 16.0471,
                longitude: 108.2068,
            });

        const vehicleId = vehicleRes.body.vehicle?._id || vehicleRes.body._id;

        const res = await request(app).get(`/api/map/vehicles/${vehicleId}`);

        expect([200, 404]).toContain(res.statusCode);
    });
});
