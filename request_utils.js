const axios = require('axios');
const queryString = require('query-string');

const prepareUrl = (url, params) => {
  return `${url}?${queryString.stringify(params)}`;
};

const simpleRequest = async ({ method, url, params, data, headers }) => {
  try {
    const res = await axios({ method, url, params, data, headers });
    return res;
  } catch (error) {
    return error;
  }
};

const oauthRequest = (oauth, { url, params, token, data, tokenSecret }) => {
  return new Promise((resolve, reject) => {
    oauth.post(prepareUrl(url, params), token, tokenSecret, data, null, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
};

module.exports = { simpleRequest, oauthRequest };
