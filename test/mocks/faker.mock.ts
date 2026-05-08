export const faker = {
    internet: {
        email: jest.fn(() => 'test@example.com'),
        username: jest.fn(() => 'testuser'),
        password: jest.fn(() => 'TestPassword123!'),
        url: jest.fn(() => 'https://example.com'),
    },
    commerce: {
        department: jest.fn(() => 'Games'),
        productName: jest.fn(() => 'Test Product'),
        productDescription: jest.fn(() => 'Test product description'),
    },
    helpers: {
        slugify: jest.fn((value: string) =>
            value.toLowerCase().replace(/\s+/g, '-')
        ),
        arrayElement: jest.fn((values: unknown[]) => values[0]),
    },
    image: {
        avatar: jest.fn(() => 'https://example.com/avatar.png'),
    },
    phone: {
        number: jest.fn(() => '+15555550123'),
    },
    datatype: {
        boolean: jest.fn(() => true),
    },
    person: {
        firstName: jest.fn(() => 'John'),
        lastName: jest.fn(() => 'Doe'),
        fullName: jest.fn(() => 'John Doe'),
    },
    string: {
        uuid: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
        alphanumeric: jest.fn(() => 'abc123'),
    },
    number: {
        int: jest.fn(() => 42),
    },
    date: {
        past: jest.fn(() => new Date('2020-01-01')),
        recent: jest.fn(() => new Date('2024-01-01')),
        future: jest.fn(() => new Date('2030-01-01')),
        birthdate: jest.fn(() => new Date('1990-01-01')),
    },
    lorem: {
        paragraph: jest.fn(() => 'Lorem ipsum dolor sit amet'),
        sentence: jest.fn(() => 'Lorem ipsum dolor sit amet.'),
    },
};
