const express = require('express');

const { catchErrors, ensureLoggedIn, ensureAdmin } = require('./utils');
const { select, update, deleteRow } = require('./db');

const router = express.Router();

/**
 * Route fyrir lista af umsóknum.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
async function applicationsRoute(req, res) {
  const applications = await select();

  const data = {
    title: 'Umsóknir',
    applications,
    page: 'applications',
  };

  return res.render('applications', data);
}

/**
 * Route til að uppfæra stöðu á umsókn, tekur við `id` í `body` og setur þá
 * umsókn sem unna.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
async function processApplication(req, res) {
  const { id } = req.body;

  await update([id]);

  return res.redirect('/applications');
}

/**
 * Route til að eyða umsókn, tekur við `id` í `body` og eyðir.
 * Aðeins aðgengilegt fyrir admin.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
async function deleteApplication(req, res) {
  const { id } = req.body;

  await deleteRow([id]);

  return res.redirect('/applications');
}

router.get('/', ensureLoggedIn, catchErrors(applicationsRoute));
router.post('/process', ensureLoggedIn, catchErrors(processApplication));
router.post('/delete', ensureLoggedIn, ensureAdmin, catchErrors(deleteApplication));

module.exports = router;
