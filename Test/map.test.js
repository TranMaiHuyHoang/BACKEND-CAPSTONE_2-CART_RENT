const request = require('supertest');
const app = require('../app'); // Express app

describe('Map API Tests', () => {
    let token;

    const user = {
        email: 'maptest@example.com',
        password: '12345678',
    };
    test("renders search input for finding rental location", () => {
        render(<Map />);

        expect(
            screen.getByPlaceholderText(/search location/i)
        ).toBeInTheDocument();
    });
    test('searches nearby vehicles by latitude and longitude', async () => {
        const res = await request(app)
            .get('/api/map/nearby')
            .query({
                latitude: 10.7769,
                longitude: 106.7009,
            });

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
