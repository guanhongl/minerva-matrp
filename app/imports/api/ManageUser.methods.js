import { Meteor } from 'meteor/meteor';
import { fetch, Headers } from 'meteor/fetch';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';
import { ROLE } from './role/Role';
import { MATRP } from './matrp/MATRP';
import { UserProfiles } from './user/UserProfileCollection';
import nodemailer from 'nodemailer';

export const acceptMethod = new ValidatedMethod({
  name: 'acceptMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ firstName, lastName, email }) {
    if (Meteor.isServer) {
      console.log(firstName, lastName, email);
      const userID = Accounts.createUser({ username: email, email: email });

      Accounts.sendEnrollmentEmail(userID); // used solely to set the enroll token
      const enrollToken = Meteor.users.findOne({ _id: userID }).services.password.enroll.token;
      // console.log(enrollToken)

      // sendEnrollmentEmail
      const credentials = JSON.parse(Assets.getText('settings.production.json'));

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

      // get the access token
      const body = {
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: credentials.refreshToken,
        grant_type: "refresh_token",
      };

      fetch("https://www.googleapis.com/oauth2/v4/token", {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(body),
      })
      .then(response => response.json())
      .then(response => {
        console.log('access token: ', response.access_token)
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

        const enrollURL = new URL(Meteor.absoluteUrl(`#/enroll-acct/${enrollToken}`));

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

        return transport.sendMail(mailOptions);
      })
      .then(response => {
        console.log(response)

        const role = ROLE.USER; // default to USER for now
        UserProfiles._collection.insert({ email, firstName, lastName, userID, role });
        Roles.addUsersToRoles(userID, [role]);
      })
      .catch(error => {
        console.log('error: ', error)

        throw new Meteor.Error('email-error', 'Failed to send the enrollment email.');
      });
      
      return userID;
    }
    return '';
  },
});

export const removeUserMethod = new ValidatedMethod({
  name: 'removeUserMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ userID, username }) {
    if (Meteor.isServer) {
      // Meteor.roleAssignment.remove({ 'user._id': userID });
      const USER_ID = userID || Meteor.users.findOne({ username })._id;

      Roles.setUserRoles(USER_ID, []);
      Meteor.users.remove({ _id: USER_ID });
    }
    return '';
  },
});

export const updateRoleMethod = new ValidatedMethod({
  name: 'updateRoleMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ userID, role }) {
    if (Meteor.isServer) {
      const loggedInUser = Meteor.user();

      if (!loggedInUser || !Roles.userIsInRole(loggedInUser, ROLE.ADMIN)) {
        throw new Meteor.Error('access-denied', 'Access denied');
      }

      Roles.setUserRoles(userID, [role]);
    }
    return '';
  },
});

export const defineMethod = new ValidatedMethod({
  name: 'BaseProfileCollection.define',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ collectionName, definitionData }) {
    if (Meteor.isServer) {
      const collection = MATRP.getCollection(collectionName);
      // collection.assertValidRoleForMethod(this.userId);
      return collection.defineProfile(definitionData);
    }
    return '';
  },
});
