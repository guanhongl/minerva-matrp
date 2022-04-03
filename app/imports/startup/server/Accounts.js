import { Meteor } from 'meteor/meteor';
// import { Accounts } from 'meteor/accounts-base';
import { ROLE } from '../../api/role/Role';
import { AdminProfiles } from '../../api/user/AdminProfileCollection';
import { UserProfiles } from '../../api/user/UserProfileCollection';

/* eslint-disable no-console */

// see https://docs.meteor.com/api/email.html
// process.env.MAIL_URL = 'smtps://minervapostmaster@gmail.com:m!nervA22@smtp.gmail.com:465';

// see https://github.com/iron-meteor/iron-router/issues/3 and https://github.com/meteor/meteor/blob/devel/packages/accounts-base/accounts_server.js
// Accounts.urls.enrollAccount = (token) => {
//   const url = new URL(Meteor.absoluteUrl(`#/enroll-acct/${token}`));
//   return url.toString();
// };

// Accounts.emailTemplates.siteName = 'AwesomeSite';
// Accounts.emailTemplates.from = 'Minerva Alert <minervapostmaster@gmail.com>';

// Accounts.emailTemplates.enrollAccount.subject = (user) => 'Welcome to Minerva!';

// Accounts.emailTemplates.enrollAccount.text = (user, url) => `${'Congratulations. Your account has been successfully created.\n\n'
//     + 'To activate your account, simply click the link below:\n\n'}${
//   url}`;

function createUser(email, role, firstName, lastName, password) {
  console.log(`  Creating user ${email} with role ${role}.`);
  if (role === ROLE.ADMIN) {
    AdminProfiles.define({ email, firstName, lastName, password });
  } else { // everyone else is just a user.
    UserProfiles.define({ email, firstName, lastName, password });
  }
}

// When running app for first time, pass a settings file to set up a default user account.
if (Meteor.users.find().count() === 0) {
  if (Meteor.settings.defaultAccounts) {
    console.log('Creating the default user(s)');
    Meteor.settings.defaultAccounts.map(({ email, password, role, firstName, lastName }) => createUser(email, role, firstName, lastName, password));
  } else {
    console.log('Cannot initialize the database!  Please invoke meteor with a settings file.');
  }
}
