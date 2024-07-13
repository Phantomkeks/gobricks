# Gobricks
Small UI automation script for adding Gobricks bricks to the cart of [yourwobb](https://www.yourwobb.com/) via [Puppeteer](https://pptr.dev/).

## How to start?
1. Run `git clone https://github.com/Phantomkeks/gobricks.git`
2. Run `npm ci --package-lock`
3. Get your executable path of Chrome browser by opening `chrome://version/` in your browser
4. Add the executable path to the configuration file (`configuration/defaults.js`)
5. Adapt list of parts in `configuration/parts.js`
6. Login in your Chrome browser to [yourwobb](https://www.yourwobb.com/) to give access to the cart 
7. Run `npm run start`

## To Do
- CSV support of [rebrickable](https://rebrickable.com/) parts list