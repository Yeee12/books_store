const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User.model');
const Book = require('../../src/models/Book.model');

describe('Book Endpoints', () => {
  let adminToken;
  let adminUser;

  beforeEach(async () => {
    // Create admin user
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin123456',
      role: 'admin',
      isEmailVerified: true
    });

    // Login admin
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123456'
      });

    adminToken = loginRes.body.data.tokens.accessToken;
  });

  describe('GET /api/v1/books', () => {
    beforeEach(async () => {
      // Create sample books
      await Book.create([
        {
          title: 'JavaScript: The Good Parts',
          author: 'Douglas Crockford',
          description: 'A book about JavaScript',
          genre: 'Technology',
          price: 29.99,
          stock: 10,
          addedBy: adminUser._id
        },
        {
          title: 'Clean Code',
          author: 'Robert Martin',
          description: 'A book about writing clean code',
          genre: 'Technology',
          price: 39.99,
          stock: 15,
          addedBy: adminUser._id
        }
      ]);
    });

    it('should get all books', async () => {
      const res = await request(app)
        .get('/api/v1/books')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.books).toHaveLength(2);
    });

    it('should filter books by price', async () => {
      const res = await request(app)
        .get('/api/v1/books?price[gte]=30')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.books).toHaveLength(1);
      expect(res.body.data.books[0].price).toBeGreaterThanOrEqual(30);
    });

    it('should search books', async () => {
      const res = await request(app)
        .get('/api/v1/books?search=JavaScript')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.books[0].title).toContain('JavaScript');
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/v1/books?page=1&limit=1')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.books).toHaveLength(1);
      expect(res.body.data.pagination.totalPages).toBeGreaterThan(1);
    });
  });

  describe('POST /api/v1/books', () => {
    it('should create a new book (admin)', async () => {
      const bookData = {
        title: 'New Book',
        author: 'Test Author',
        description: 'A test book',
        genre: 'Fiction',
        price: 19.99,
        stock: 5
      };

      const res = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bookData)
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.data.book.title).toBe(bookData.title);
    });

    it('should not create book without authentication', async () => {
      const bookData = {
        title: 'New Book',
        author: 'Test Author',
        description: 'A test book',
        genre: 'Fiction',
        price: 19.99,
        stock: 5
      };

      const res = await request(app)
        .post('/api/v1/books')
        .send(bookData)
        .expect(401);

      expect(res.body.status).toBe('fail');
    });

    it('should validate required fields', async () => {
      const invalidBook = {
        title: 'Book Without Price'
      };

      const res = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidBook)
        .expect(400);

      expect(res.body.status).toBe('fail');
    });
  });

  describe('GET /api/v1/books/:id', () => {
    let bookId;

    beforeEach(async () => {
      const book = await Book.create({
        title: 'Test Book',
        author: 'Test Author',
        description: 'A test book',
        genre: 'Fiction',
        price: 19.99,
        stock: 5,
        addedBy: adminUser._id
      });
      bookId = book._id;
    });

    it('should get book by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/books/${bookId}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.book.title).toBe('Test Book');
    });

    it('should return 404 for non-existent book', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/v1/books/${fakeId}`)
        .expect(404);

      expect(res.body.status).toBe('fail');
    });
  });

  describe('PATCH /api/v1/books/:id', () => {
    let bookId;

    beforeEach(async () => {
      const book = await Book.create({
        title: 'Original Title',
        author: 'Test Author',
        description: 'Original description',
        genre: 'Fiction',
        price: 19.99,
        stock: 5,
        addedBy: adminUser._id
      });
      bookId = book._id;
    });

    it('should update book (admin)', async () => {
      const updateData = {
        title: 'Updated Title',
        price: 24.99
      };

      const res = await request(app)
        .patch(`/api/v1/books/${bookId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.book.title).toBe('Updated Title');
      expect(res.body.data.book.price).toBe(24.99);
    });
  });

  describe('DELETE /api/v1/books/:id', () => {
    let bookId;

    beforeEach(async () => {
      const book = await Book.create({
        title: 'Book to Delete',
        author: 'Test Author',
        description: 'Will be deleted',
        genre: 'Fiction',
        price: 19.99,
        stock: 5,
        addedBy: adminUser._id
      });
      bookId = book._id;
    });

    it('should delete book (admin)', async () => {
      const res = await request(app)
        .delete(`/api/v1/books/${bookId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.status).toBe('success');

      // Verify book is deleted
      const book = await Book.findById(bookId);
      expect(book).toBeNull();
    });
  });
});
