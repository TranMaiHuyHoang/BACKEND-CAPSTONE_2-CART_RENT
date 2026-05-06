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
});
