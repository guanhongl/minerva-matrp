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

// TODO: handle error(s)
// sendEnrollmentEmail
function sendEnrollmentEmail(to) {
  const credentials = JSON.parse(Assets.getText('settings.production.json'));
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
  .then(data => {
    console.log('access token: ', data.access_token)
  })
  .catch(error => {
    console.log(error)
  });

  HTTP.post("https://www.googleapis.com/oauth2/v4/token", {
    data: {
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: "refresh_token",
    }
  }, function (error, response) {
    if (error) {
      console.log(error);
    } else {
      // console.log(response);
      console.log(response.data.access_token)

      // const accessToken = getAccessToken();
      const accessToken = response.data.access_token;

      // SMTP
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

      const mailOptions = {
        from: `Minerva Alert <${credentials.user}>`,
        to,
        subject: "Welcome to Minerva!",
        // generateTextFromHTML: true,
        html: "<h1>Hello!</h1>",
        text: "Hello!"
      };

      transport.sendMail(mailOptions, function (error, result) {
        if (error) {
          console.log('Error: ', error);
        } else {
          console.log('Success: ', result);
        }
        transport.close();
      });
    }
  });
};

export const acceptMethod = new ValidatedMethod({
  name: 'acceptMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ firstName, lastName, email }) {
    if (Meteor.isServer) {
      console.log(firstName, lastName, email);
      const userID = Accounts.createUser({ username: email, email: email });

      const username = Meteor.users.findOne({ _id: userID }).username; // the user email
      // TODO: format email
      sendEnrollmentEmail(username);

      const role = ROLE.USER; // default to USER for now
      UserProfiles._collection.insert({ email, firstName, lastName, userID, role });
      Roles.addUsersToRoles(userID, [role]);

      return userID;
    }
    return '';
  },
});

export const removeUserMethod = new ValidatedMethod({
  name: 'removeUserMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run(userID) {
    if (Meteor.isServer) {
      // Meteor.roleAssignment.remove({ 'user._id': userID });
      Roles.setUserRoles(userID, []);
      Meteor.users.remove({ _id: userID });
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
