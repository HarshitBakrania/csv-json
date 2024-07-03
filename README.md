## CSV TO JSON CONVERTOR

### To run the convertor you need to follow these steps:
1. Get a Postgres Database URL and paste it in `.env` file.
2. Replace the csv file you need to convert in the `.env` file by providing the location of the file. (There is also a `test.csv` file in the repo)
3. ` npm install `
4. run `db.js` to create the table in your database.
5. run `app.js` to convert your CSV file to JSON.

You can go to the `/convert` to look at your converted JSON file and the data is automatically inserted into your table.
