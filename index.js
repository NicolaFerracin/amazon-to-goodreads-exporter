#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
require('dotenv').config();
const { getListContent } = require('./amazon_utils');
const goodreadsUtils = require('./goodreads_utils');
const { questions, promisifyWithDelay } = require('./utils');

// Check the env variables are present
const isEnvSetup = () => {
  if (!process.env.GOODREADS_KEY || !process.env.GOODREADS_SECRET) {
    console.log(chalk.white.bgRed('Environment variables for Goodreads API could not be found.'));
    console.log(
      chalk.white.bgRed('Please add an .env file with GOODREADS_KEY and GOODREADS_SECRET.')
    );
    return false;
  }
  return true;
};

// Welcome message
const init = () => {
  const welcomeMessage = 'Welcome to Amazon-to-Goodreads exporter!';
  console.log(chalk.white.bgGreen(`\t${' '.repeat(welcomeMessage.length)}\t`));
  console.log(chalk.white.bgGreen(`\t${welcomeMessage}\t`));
  console.log(chalk.white.bgGreen(`\t${' '.repeat(welcomeMessage.length)}\t`));
  console.log('='.repeat(40));
  console.log('Some warnings:');
  console.log(
    '- This tool scrapes Amazon whishlists using puppeteer. Whislists need to be public.'
  );
  console.log(
    '- This tool uses the official Goodreads API. It has a rate limit of 1 request per second, as per terms and conditions.'
  );
  console.log(
    '- On Amazon whishlists there is no ISIN available therefore book searches are done using the ASIN which sometimes results in no book being found. In these cases an error is displayed and you can search and add your books manually.'
  );
  console.log(
    '- If you add a book to a non-existing shelf, the API will create one for you. Bare in mind that by default shelves are not exclusive so as a side effect books will be added to the Read shelf as well. If you want to avoid it, create the shelf manually on Goodreads and set it as exclusive.'
  );
  console.log(
    '- Adding a book to a shelf and migrating an Amazon wishlist require you authenticate via OAuth. Use the "Authenticate" option and follow the instructions.'
  );
  console.log('='.repeat(40));
  console.log('\n\n');
};

// Propmt a given question
const askQuestion = question => inquirer.prompt(question);

// memoize amazon lists content to avoid slow re-fetch
const amazonLists = {};
// Get content for given amazon list
const _getAmazonListContent = async (id, domain, fields) => {
  let content;
  if (amazonLists[id]) {
    content = amazonLists[id];
  } else {
    content = await getListContent(id, domain);
    if (content.error) {
      console.log(chalk.white.bgRed(content.error));
      console.log(content.fullMessage);
    } else {
      amazonLists[id] = content;
    }
  }

  return content.map(item => {
    for (key in item) {
      if (!fields.includes(key)) {
        delete item[key];
      }
    }
    return item;
  });
};

const getAmazonListContent = async () => {
  const { ID, DOMAIN, FIELDS } = await askQuestion(questions.amazonListContent);
  const res = await _getAmazonListContent(ID, DOMAIN, FIELDS);
  console.log(res);
};

// Authenticate gooreads user
const authenticate = async () => {
  try {
    const url = await goodreadsUtils.getRequestToken();
    await askQuestion(questions.authenticate(url));
    await goodreadsUtils.getAccessToken();
    console.log(chalk.white.bgGreen('You are now authenticated to Goodreads.'));
    console.log(
      chalk.white.bgGreen(
        'You can now make authenticated requests to Goodreads, such as creating shelves, adding books to shelves and migrating Amazon lists to Goodreads shelves.'
      )
    );
  } catch (error) {
    console.log(error);
  }
};

// Get user's shelves
const getUserShelves = async () => {
  const userId = (await askQuestion(questions.getUserShelves)).ID;
  const shelves = await goodreadsUtils.getUserShelves(userId);
  if (shelves) {
    console.log(shelves);
  }
};

// Add book to shelf
const addBookToShelf = async () => {
  const { SHELF_NAME, BOOK_ID } = await askQuestion(questions.addBookToShelf);
  const res = await goodreadsUtils.addBookToShelf(SHELF_NAME, BOOK_ID);
  console.log(res);
};

// Search book
const searchBook = async () => {
  const query = (await askQuestion(questions.searchBook)).BOOK;
  const books = await goodreadsUtils.searchBook(query);
  if (books) {
    console.log(books);
  }
};

// Get a list of books to migrate - first part of migration
const findBooksToMigrate = async () => {
  const { ID, DOMAIN } = await askQuestion(questions.migrate1);
  const listContent = await _getAmazonListContent(ID, DOMAIN, ['title', 'asin']);

  // search by ASIN on goodreads
  const booksPromises = listContent.map((item, index) => {
    return promisifyWithDelay(index, async resolve => {
      console.log(`Searching for book with asin ${item.asin}.`);
      const book = await goodreadsUtils.searchBook(item.asin);
      return resolve(book);
    });
  });

  const books = await Promise.all(booksPromises);
  return books;
};

// Add list of books to Goodreads shelf - second part of migration
const migrateBooks = async books => {
  const shelfName = (await askQuestion(questions.migrate2)).SHELF_NAME;
  const addBookPromises = books
    .filter(book => book)
    .map((book, index) => {
      return promisifyWithDelay(index, async resolve => {
        console.log(`Adding book ${book[0].title} to shelf.`);
        const res = await goodreadsUtils.addBookToShelf(shelfName, book[0].id, book[0].title);
        resolve(res);
      });
    });
  const addBooksRes = await Promise.all(addBookPromises);
  addBooksRes.forEach(res => console.log(res));
};

// Main function
const run = async () => {
  if (!isEnvSetup()) {
    return;
  }
  init();
  let action;
  while (action !== 0) {
    action = (await askQuestion(questions.actions)).ACTION;
    if (action === 'getAmazonListContent') {
      await getAmazonListContent();
    } else if (action === 'authenticate') {
      await authenticate();
    } else if (action === 'getUserShelves') {
      await getUserShelves();
    } else if (action === 'addBookToShelf') {
      await addBookToShelf();
    } else if (action === 'searchBook') {
      await searchBook();
    } else if (action === 'migrate') {
      const books = await findBooksToMigrate();
      await migrateBooks(books);
    }
    console.log('\n');
  }
};

run();
