# Amazon to Goodreads exporter

![Amazon to Goodreads exporter](https://raw.githubusercontent.com/NicolaFerracin/amazon-to-goodreads-exporter/master/amazon-to-goodreads.png)

This interactive command line tool allows you to migrate public Amazon wishlists to Goodreads shelves.

## How to use

### Clone the repo

```
git clone https://github.com/NicolaFerracin/amazon-to-goodreads-exporter.git
```

### Install the dependencies

```
cd ./amazon-to-goodreads-exporter
npm i
```

### Add env variables

You can get them at https://www.goodreads.com/api/keys

```
echo 'GOODREADS_KEY=KEY' >> .env
echo 'GOODREADS_SECRET=SECRET' >> .env
```

### Run the CLI

```
node index.js
```

## Dependencies

`axios`: interact with Goodreads API  
`chalk`: terminal output styling  
`dotenv`: inject environment variables  
`inquirer`: create interactive interfaces on the terminal  
`oauth`: authenticate user on Goodreads  
`puppeteer`: headless browser for scraping Amazon wishlists  
`query-string`: easy URL parsing and paramters creation  
`xml-js`: parse XML to a JS object (for Goodreads API)
