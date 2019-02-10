const express = require('express');
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');

const { catchErrors, sanitizeXss } = require('./utils');
const { findByUsername, createUser } = require('./users');

const router = express.Router();

function form(req, res) {
  const data = {
    title: 'Nýskráning',
    name: '',
    email: '',
    username: '',
    password: '',
    password2: '',
    errors: [],
    page: 'register',
  };
  res.render('register', data);
}

const validations = [
  check('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),

  check('email')
    .isLength({ min: 1 })
    .withMessage('Netfang má ekki vera tómt'),

  check('email')
    .isEmail()
    .withMessage('Netfang verður að vera netfang'),

  check('username')
    .isLength({ min: 1 })
    .withMessage('Notendanafn má ekki vera tómt'),

  check('username')
    .custom(async (value) => {
      const user = await findByUsername(value);

      return user === null;
    })
    .withMessage('Notendanafn er ekki laust'),

  check('password')
    .isLength({ min: 8 })
    .withMessage('Lykilorð verður að vera a.m.k. 8 stafir'),

  check('password2')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Lykilorð verða að vera eins'),
];

const sanitations = [
  sanitize('name').trim().escape(),
  sanitizeXss('name'),

  sanitizeXss('email'),
  sanitize('email').trim().normalizeEmail(),
];

/**
 * Route handler sem athugar stöðu á umsókn og birtir villur ef einhverjar,
 * sendir annars áfram í næsta middleware.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 * @returns Næsta middleware ef í lagi, annars síðu með villum
 */
function showErrors(req, res, next) {
  const {
    body: {
      name = '',
      email = '',
      username = '',
      password = '',
      password2 = '',
    } = {},
  } = req;

  const data = {
    name,
    email,
    username,
    password,
    password2,
    page: 'register',
  };

  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const errors = validation.array();
    data.errors = errors;
    data.title = 'Nýskráning – vandræði';

    return res.render('register', data);
  }

  return next();
}

async function register(req, res) {
  const {
    body: {
      name = '',
      email = '',
      username = '',
      password = '',
    } = {},
  } = req;

  await createUser(username, password, name, email);

  return res.redirect('/register/thanks');
}

function thanks(req, res) {
  return res.render('thanks-user', { title: 'Nýskráning tókst', page: 'register' });
}

router.get('/', form);
router.post(
  '/',
  validations,
  showErrors,
  sanitations,
  catchErrors(register),
);
router.get('/thanks', thanks);

module.exports = router;
