const request = require('supertest');
const app = require('../app'); // Express app

describe('Favorite API Tests', () => {
    let token;
    let favoriteId;

    const user = {
        email: 'favoritetest@example.com',
        password: '12345678',
    };

    const productId = '1234567890abcdef';
    test("displays correct number of favorite cars", () => {
        render(<Favorite favorites={mockFavorites} />);

        const items = screen.getAllByTestId("favorite-item");
        expect(items.length).toBe(2);
    });
    test('adds vehicle to favorite list successfully', async () => {
        const res = await request(app)
            .post('/api/favorites')
            .set('Authorization', `Bearer ${token}`)
            .send({
                vehicleId,
            });

        expect([200, 201]).toContain(res.statusCode);
        expect(res.body).toHaveProperty('message');
    });
});
