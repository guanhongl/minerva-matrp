import { Meteor } from 'meteor/meteor';
import { fetch, Headers } from 'meteor/fetch';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';
import { ROLE } from './role/Role';
import { MATRP } from './matrp/MATRP';
import { UserProfiles } from './user/UserProfileCollection';
import { PendingUsers } from './pending-user/PendingUserCollection';
import nodemailer from 'nodemailer';

// get the auth code for refresh token and access token (if needed)
// let code = '';

// fetch("https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
//   scope: "https://www.googleapis.com/auth/gmail.send",
//   redirect_uri: "https://developers.google.com/oauthplayground",
//   response_type: "code",
//   access_type: "offline",
//   client_id: credentials.clientId,
//   prompt: "consent",
// }), {
//   method: 'GET',
//   headers: new Headers({
//     'Content-Type': 'application/json'
//   }),
// })
// .then(response => response.json())
// .then(response => {
//   // NEED CONSENT
//   console.log('auth code: ', response)
//   code = response.code;
// });
// fetch("https://www.googleapis.com/oauth2/v4/token", {
//   method: 'POST',
//   headers: new Headers({
//     'Content-Type': 'application/json'
//   }),
//   body: JSON.stringify({
//     code,
//     client_id: credentials.clientId,
//     client_secret: credentials.clientSecret,
//     redirect_uri: "https://developers.google.com/oauthplayground",
//     grant_type: "authorization_code",
//   }),
// })
// .then(response => response.json())
// .then(response => {
//   console.log('refresh token: ', response.refresh_token)
//   console.log('access token: ', response.access_token)
// });

export const acceptMethod = new ValidatedMethod({
  name: 'acceptMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ firstName, lastName, email, _id }) {
    if (Meteor.isServer) {
      console.log("first: ", firstName, "last: ", lastName, "@: ", email);
      const userID = Accounts.createUser({ username: email, email });
      console.log("ID: ", userID);
      // set up the credentials
      const credentials = JSON.parse(Assets.getText('settings.production.json'));
      const body = {
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: credentials.refreshToken,
        grant_type: "refresh_token",
      };
      // fetch the access token
      return fetch("https://www.googleapis.com/oauth2/v4/token", {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(body),
      })
        .then(response => response.json())
        .then(response => {
          // throw error if invalid access_token (likely bad refresh token)
          if (response.error) {
            throw new Error(`[${response.error}] ${response.error_description}`);
          }
          // else
          if (response.access_token) {
            const accessToken = response.access_token;
            // set up SMTP
            const transport = nodemailer.createTransport({
              service: "gmail",
              auth: {
                type: "OAuth2",
                user: credentials.user,
                clientId: credentials.clientId,
                clientSecret: credentials.clientSecret,
                refreshToken: credentials.refreshToken,
                accessToken,
              }
            });
            // set up the enrollment URL
            const enrollURL = new URL(Meteor.absoluteUrl(`/#/enroll-acct/${userID}`));
            // set up the email
            const mailOptions = {
              from: `Minerva Alert <${credentials.user}>`,
              to: email,
              subject: "Welcome to Minerva!",
              // generateTextFromHTML: true,
              html: "<p>Congratulations. Your account has been successfully created.</p>"
                  + "<br>"
                  + "<p>To activate your account, simply click the link below:</p>"
                  + `<a href="${enrollURL}" target="_blank" rel="noopener noreferrer">click here</a>`,
              text: "Congratulations. Your account has been successfully created. "
                  + "To activate your account, simply click the link below: "
                  + enrollURL,
            };
            // send the enrollment email
            return transport.sendMail(mailOptions);
          }
        })
        .then(response => {
          // if success
          console.log(response)
          // set up the role and the profile
          const role = ROLE.USER; // default to USER for now
          UserProfiles.defineBase({ email, firstName, lastName, userID, role });
          Roles.addUsersToRoles(userID, [role]);
          // remove the pending user
          PendingUsers.removeIt(_id);

          return userID;
        })
        .catch(error => {
          // catch any errors and remove the account
          Meteor.users.remove({ _id: userID });
          throw new Meteor.Error(error.message);
        });
    }
    return '';
  },
});

export const setPasswordMethod = new ValidatedMethod({
  name: 'setPassword',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ userId, newPassword }) {
    if (Meteor.isServer) {
      Accounts.setPassword(userId, newPassword);

      return '';
    }
    return '';
  },
});

export const removeMethod = new ValidatedMethod({
  name: 'removeMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ collectionName, userID, profileID }) {
    if (Meteor.isServer) {
      // remove the account
      Meteor.users.remove({ _id: userID });
      // remove the role
      Roles.setUserRoles(userID, []);
      // remove the profile
      const collection = MATRP.getCollection(collectionName);
      collection.assertValidRoleForMethod(this.userId);
      return collection.removeIt(profileID);
    }
    return '';
  },
});

export const updateRoleMethod = new ValidatedMethod({
  name: 'updateRoleMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ prev, collectionName, user, newRole }) {
    if (Meteor.isServer) {
      const { _id, email, firstName, lastName, userID, role } = user;
      // disallow admin to set their own role
      if (this.userId === userID) {
        throw new Meteor.Error("You cannot set your own role.");
      }
      // remove the prev profile
      let collection = MATRP.getCollection(prev);
      collection.assertValidRoleForMethod(this.userId);
      collection.removeIt(_id);
      // insert the new profile
      collection = MATRP.getCollection(collectionName);
      collection.assertValidRoleForMethod(this.userId);
      collection.defineBase({ email, firstName, lastName, userID, role: newRole });
      // set role accordingly
      Roles.setUserRoles(userID, [newRole]);

      return '';
    }
    return '';
  },
});
