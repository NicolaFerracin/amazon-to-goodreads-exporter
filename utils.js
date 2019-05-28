const inquirer = require('inquirer');

// List of possible user actions
const actions = [
  { name: 'Quit', value: 0 },
  new inquirer.Separator('= Amazon ='),
  { name: 'Get list content', value: 'getAmazonListContent' },
  new inquirer.Separator('= Goodreads ='),
  { name: 'Authenticate', value: 'authenticate' },
  { name: "Get user's shelves", value: 'getUserShelves' },
  { name: 'Add book to shelf - (requires authentication)', value: 'addBookToShelf' },
  { name: 'Search book', value: 'searchBook' },
  new inquirer.Separator('= Amazon + Goodreads ='),
  {
    name: 'Migrate Amazon list to GoodRead shelf - (requires authentication)',
    value: 'migrate'
  },
  new inquirer.Separator()
];

// List of possible questions
const questions = {
  actions: [
    {
      name: 'ACTION',
      type: 'list',
      choices: actions,
      message: 'Please, choose an action from the list.'
    }
  ],
  amazonListContent: [
    {
      name: 'ID',
      type: 'input',
      message: 'Please, insert the Amazon whishlist ID (i.e. 2KWHR5PDMZXXX).',
      validate: answer => {
        if (!answer) {
          return 'You must enter an ID.';
        }
        return true;
      }
    },
    {
      name: 'DOMAIN',
      type: 'input',
      message: 'Please, insert the Amazon domain (i.e. com, de, es, co.uk).',
      default: 'com'
    },
    {
      name: 'FIELDS',
      type: 'checkbox',
      message: 'Which fields do you need?',
      choices: ['title', 'asin', 'author', 'image', 'stars', 'price', 'link'],
      validate: answer => {
        if (!answer.length) {
          return 'You must select at least one field.';
        }
        return true;
      }
    }
  ],
  getUserShelves: [
    {
      name: 'ID',
      type: 'input',
      message: 'What is the Goodreads user ID?',
      validate: answer => {
        if (!answer) {
          return 'You must enter a user ID.';
        }
        return true;
      }
    }
  ],
  searchBook: [
    {
      name: 'BOOK',
      type: 'input',
      message: 'What book are you looking for (title, author, ASIN...)?',
      validate: answer => {
        if (!answer) {
          return 'You must enter a search term.';
        }
        return true;
      }
    }
  ],
  authenticate: url => [
    {
      name: 'AUTHENTICATE',
      type: 'input',
      message: `Please click the following link to authenticate and type yes when done.\n${url}\n`,
      validate: answer => {
        if (answer !== 'y' && answer !== 'yes') {
          return 'You must click the link and type "yes".';
        }
        return true;
      }
    }
  ],
  addBookToShelf: [
    {
      name: 'SHELF_NAME',
      type: 'input',
      message: `What is the name of the shelf?\nIf the shelf you provide does not exist, a new shelf will be created.`,
      validate: answer => {
        if (!answer) {
          return 'You must enter a shelf name.';
        }
        return true;
      }
    },
    {
      name: 'BOOK_ID',
      type: 'input',
      message: `What is the id of the book?\nYou can use the search to find a book id.`,
      validate: answer => {
        if (!answer) {
          return 'You must enter a book id.';
        }
        return true;
      }
    }
  ],
  migrate1: [
    {
      name: 'ID',
      type: 'input',
      message: 'Which Amazon list would you like to migrate? (i.e. 2KWHR5PDMZXXX).',
      validate: answer => {
        if (!answer) {
          return 'You must enter an ID.';
        }
        return true;
      }
    },
    {
      name: 'DOMAIN',
      type: 'input',
      message: 'Please, insert the Amazon domain (i.e. com, de, es, co.uk).',
      default: 'com'
    }
  ],
  migrate2: [
    {
      name: 'SHELF_NAME',
      type: 'input',
      message: `What is the name of the shelf?\nIf the shelf you provide does not exist, a new shelf will be created.`,
      validate: answer => {
        if (!answer) {
          return 'You must enter a shelf name.';
        }
        return true;
      }
    }
  ]
};

const promisifyWithDelay = (delay, fn) => {
  return new Promise(resolve => {
    setTimeout(async () => fn(resolve), delay * 1000);
  });
};

module.exports = {
  actions,
  questions,
  promisifyWithDelay
};
