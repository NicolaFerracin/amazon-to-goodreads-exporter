const chalk = require('chalk');
const { xml2json } = require('xml-js');
const { simpleRequest, oauthRequest } = require('./request_utils');
const { OAuth } = require('oauth');

const URLS = {
  base: 'https://goodreads.com',
  getShelves: 'https://www.goodreads.com/shelf/list.xml',
  searchBook: 'https://www.goodreads.com/search/index.xml',
  createShelf: 'https://www.goodreads.com/user_shelves.xml',
  addBookToShelf: 'https://www.goodreads.com/shelf/add_to_shelf.xml'
};

const getUserShelves = async userId => {
  const res = await simpleRequest({
    method: 'GET',
    url: URLS.getShelves,
    params: { user_id: userId, key: process.env.GOODREADS_KEY }
  });

  if (res.status !== 200) {
    console.error(chalk.white.bgRed(`There was an error with your request. ${res.message}.`));
    return;
  }

  const shelves = JSON.parse(xml2json(res.data, { compact: false, spaces: 4 }));
  return shelves.elements[0].elements[1].elements.map(shelf => ({
    [shelf.elements[0].name]: shelf.elements[0].elements[0].text,
    [shelf.elements[1].name]: shelf.elements[1].elements[0].text,
    [shelf.elements[2].name]: shelf.elements[2].elements[0].text
  }));
};

const searchBook = async query => {
  const res = await simpleRequest({
    method: 'GET',
    url: URLS.searchBook,
    params: { q: query, key: process.env.GOODREADS_KEY }
  });

  if (res.status !== 200) {
    console.error(chalk.white.bgRed(`There was an error with your request. ${res.message}.`));
    return;
  }

  const book = JSON.parse(xml2json(res.data, { compact: false, spaces: 4 }));
  const result = book.elements[0].elements[1].elements[6].elements;

  if (!result) {
    console.log(chalk.white.bgRed(`Query '${query}' didn't return any result.`));
  } else {
    return book.elements[0].elements[1].elements[6].elements.map(el => ({
      [el.elements[8].elements[0].name]: el.elements[8].elements[0].elements[0].text,
      [el.elements[8].elements[1].name]: el.elements[8].elements[1].elements[0].text,
      [el.elements[8].elements[2].name]: el.elements[8].elements[2].elements[0].elements[0].text,
      [el.elements[8].elements[3].name]: el.elements[8].elements[3].elements[0].text,
      [el.elements[8].elements[4].name]: el.elements[8].elements[4].elements[0].text
    }));
  }
};

// OAuth related variables
let OAUTH;
let OAUTH_TOKEN;
let OAUTH_TOKEN_SECRET;
let ACCESS_TOKEN;
let ACCESS_TOKEN_SECRET;

const initOAuth = () => {
  const requestURL = `https://www.goodreads.com/oauth/request_token`;
  const accessURL = 'https://www.goodreads.com/oauth/access_token';
  const callbackURL = 'http://localhost:3000';
  const version = '1.0';
  const encryption = 'HMAC-SHA1';

  OAUTH = new OAuth(
    requestURL,
    accessURL,
    process.env.GOODREADS_KEY,
    process.env.GOODREADS_SECRET,
    version,
    callbackURL,
    encryption
  );
};

const getRequestToken = () => {
  return new Promise(resolve => {
    if (!OAUTH) {
      initOAuth();
    }

    OAUTH.getOAuthRequestToken((error, oAuthToken, oAuthTokenSecret) => {
      if (error) {
        reject(chalk.white.bgRed('Something went wrong. Please restart the authentication flow.'));
      }

      const url = `${URLS.base}/oauth/authorize?oauth_token=${oAuthToken}&oauth_callback=${
        OAUTH._authorize_callback
      }`;

      OAUTH_TOKEN = oAuthToken;
      OAUTH_TOKEN_SECRET = oAuthTokenSecret;
      resolve(url);
    });
  });
};

const getAccessToken = () => {
  return new Promise((resolve, reject) => {
    if (!OAUTH) {
      reject(
        chalk.white.bgRed(
          'Something went wrong. Please restart the authentication flow and make sure to click on the authentication URL.'
        )
      );
    }

    OAUTH.getOAuthAccessToken(
      OAUTH_TOKEN,
      OAUTH_TOKEN_SECRET,
      1,
      (error, accessToken, accessTokenSecret) => {
        if (error) {
          reject(
            chalk.white.bgRed(
              'Something went wrong. Please restart the authentication flow and make sure to click on the authentication URL.'
            )
          );
        }

        ACCESS_TOKEN = accessToken;
        ACCESS_TOKEN_SECRET = accessTokenSecret;

        resolve();
      }
    );
  });
};

const addBookToShelf = async (shelfName, bookId, bookTitle) => {
  if (!OAUTH) {
    return chalk.white.bgRed(
      'You need to authenticate yourself before being able to add a book to a shelf.'
    );
  }

  try {
    await oauthRequest(OAUTH, {
      url: URLS.addBookToShelf,
      params: { key: process.env.GOODREADS_KEY, name: shelfName, book_id: bookId },
      token: ACCESS_TOKEN,
      tokenSecret: ACCESS_TOKEN_SECRET
    });
    if (bookTitle) {
      return chalk.white.bgGreen(
        `Book "${bookTitle}" (id: ${bookId}) added with success to ${shelfName}!`
      );
    }
    return chalk.white.bgGreen(`Book with id: ${bookId} added with success to ${shelfName}!`);
  } catch (error) {
    const data = JSON.parse(xml2json(error.data, { compact: false, spaces: 4 }));
    const errorMessage = data.elements[0].elements[1].elements[3].elements[0].cdata;
    return chalk.white.bgRed(`Error: ${errorMessage}. Title: ${bookTitle}. Id: ${bookId}.`);
  }
};

module.exports = {
  getUserShelves,
  searchBook,
  getRequestToken,
  getAccessToken,
  addBookToShelf
};
