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
import csv from 'csvtojson';
import { _ } from 'meteor/underscore';

/**
 * Creates the URL for pasting in the browser, which will generate the code
 * to be placed in the CODE variable.
 */
export const generateAuthUrlMethod = new ValidatedMethod({
  name: 'generateAuthUrlMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run() {
    if (Meteor.isServer) {
      // get client_id
      const credentials = JSON.parse(Assets.getText('settings.production.json'));
      const client_id = credentials.clientId;
      // generate URL
      const URL = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
        scope: "https://www.googleapis.com/auth/gmail.send",
        // scope: "https://mail.google.com/",
        redirect_uri: "https://developers.google.com/oauthplayground",
        // redirect_uri: "http://localhost:3000",
        response_type: "code",
        access_type: "offline",
        client_id,
        // prompt: "consent",
      });

      return URL;
    }
    return null;
  },
});

/**
 * Generates a refresh token given the authorization code.
 */
export const generateRefreshTokenMethod = new ValidatedMethod({
  name: 'generateRefreshTokenMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run() {
    if (Meteor.isServer) {
      // set up the credentials
      const credentials = JSON.parse(Assets.getText('settings.production.json'));
      const body = {
        code: "", // PASTE HERE
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        redirect_uri: "https://developers.google.com/oauthplayground",
        // redirect_uri: "http://localhost:3000",
        grant_type: "authorization_code",
      };
      // fetch refresh token and access token
      fetch("https://www.googleapis.com/oauth2/v4/token", {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(body),
      })
        .then(response => response.json())
        .then(response => {
          console.log(response)
        });
      
      return '';
    }
    return null;
  },
});

// global scope
// see https://stackoverflow.com/questions/27509125/global-variables-in-meteor
ACCESS_TOKEN = "";

export const acceptMethod = new ValidatedMethod({
  name: 'acceptMethod',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ user }) {
    if (Meteor.isServer) {
      const { firstName, lastName, email, _id } = user;
      console.log("first: ", firstName, "last: ", lastName, "@: ", email);
      const userID = Accounts.createUser({ username: email, email });
      console.log("ID: ", userID);
      // set up the credentials
      const credentials = JSON.parse(Assets.getText('settings.production.json'));
      // set up SMTP
      let transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: credentials.user,
          // clientId: credentials.clientId,
          // clientSecret: credentials.clientSecret,
          // refreshToken: credentials.refreshToken,
          accessToken: ACCESS_TOKEN,
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
      // try the access token
      return transport.sendMail(mailOptions)
        // if first attempt error
        .catch(() => {
          // set up the POST body
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
                // throw new Error(`[${response.error}] ${response.error_description}`);
                return Promise.reject(new Error(`[${response.error}] ${response.error_description}`));
              }
              // else
              if (response.access_token) {
                // remember access_token
                ACCESS_TOKEN = response.access_token;
                // set up new transport
                transport = nodemailer.createTransport({
                  service: "gmail",
                  auth: {
                    type: "OAuth2",
                    user: credentials.user,
                    accessToken: ACCESS_TOKEN,
                  }
                });
                // send the enrollment email
                return transport.sendMail(mailOptions);
              }
            });
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

/**
 * @returns Promise array
 */
const createPromises = (userIDs, from, tos) => {
  // set up SMTP
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: from,
      accessToken: ACCESS_TOKEN,
    }
  });

  const promises = [];
  for (let k = 0; k < tos.length; k++) {
    const userID = userIDs[k];
    const to = tos[k];
    const enrollURL = new URL(Meteor.absoluteUrl(`/#/enroll-acct/${userID}`));
    const mailOptions = {
      from: `Minerva Alert <${from}>`,
      to,
      subject: "Welcome to Minerva!",
      html: "<p>Congratulations. Your account has been successfully created.</p>"
          + "<br>"
          + "<p>To activate your account, simply click the link below:</p>"
          + `<a href="${enrollURL}" target="_blank" rel="noopener noreferrer">click here</a>`,
      text: "Congratulations. Your account has been successfully created. "
          + "To activate your account, simply click the link below: "
          + enrollURL,
    };
    // push the promise
    const promise = transport.sendMail(mailOptions);
    promises.push(promise);
  }

  return promises;
}

/**
 * @returns the resolved array of results
 * @throws error
 */
async function sendMail(userIDs, credentials, json) {
  // try the access token
  try {
    console.log("TRY")
    // set up the email for each user
    const promises = createPromises(userIDs, credentials.user, _.pluck(json, "email"));

    const values = await Promise.all(promises);
    return values; // converts to a resolved Promise...
  // if first attempt error
  } catch (error) {
    console.log("CATCH")
    // set up the POST body
    const body = {
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: "refresh_token",
    };
    // fetch the access token
    const res = await fetch("https://www.googleapis.com/oauth2/v4/token", {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(body),
    });
    const response = await res.json();
    // throw error if invalid access_token (likely bad refresh token)
    if (response.error) {
      // return Promise.reject(new Error(`[${response.error}] ${response.error_description}`));
      throw new Error(`[${response.error}] ${response.error_description}`); // rethrow
    }
    // else
    if (response.access_token) {
      // remember access_token
      ACCESS_TOKEN = response.access_token;
      // send the enrollment emails w/ new access token
      const newPromises = createPromises(userIDs, credentials.user, _.pluck(json, "email"));
      const values = await Promise.all(newPromises);

      return values;
    }
  }
}

/**
 * upload the .csv file to the database
 */
export const uploadUserMethod = new ValidatedMethod({
  name: 'uploadUser',
  mixins: [CallPromiseMixin],
  validate: null,
  async run({ data }) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'You must be logged in to upload to the database.');
    } else if (!Roles.userIsInRole(this.userId, [ROLE.ADMIN])) {
      throw new Meteor.Error('unauthorized', 'You must be an admin to upload to the database.');
    }
    if (Meteor.isServer) {
      // throw error if csv is empty
      if (!data) {
        throw new Meteor.Error("no-file", "No file specified");
      }

      const ref = {
        student: "USER",
        doctor: "SUPERUSER",
        admin: "ADMIN",
      };

      // csv to json
      try {
        const json = await csv({ checkType: true }).fromString(data);
        console.log(json)
        const LENGTH = json.length;
        // reject the first required field
        const required = ["firstName", "lastName", "email"];
        for (let i = 0; i < required.length; i++) {
          const field = required[i];
          if (json.some(o => !o[field])) {
            // return Promise.reject(new Error(`${field} cannot be empty!`));
            throw new Error(`${field} cannot be empty!`); // rethrow
          }
        }
        // reject the first unrecognized role
        const unknown = json.find( o => (o.role !== "" && o.role !== "doctor" && o.role !== "admin") );
        if (!!unknown) {
          // return Promise.reject(new Error(`Unrecognized role: ${unknown.role}!`));
          throw new Error(`Unrecognized role: ${unknown.role}!`); // rethrow
        }
        // create the users
        const userIDs = [];
        for (let j = 0; j < LENGTH; j++) {
          const email = json[j].email;
          const userID = Accounts.createUser({ username: email, email });
          console.log(userID)
          userIDs.push(userID);
        }
        // set up the credentials
        const credentials = JSON.parse(Assets.getText('settings.production.json'));

        try {
          // const values = await Promise.all(promises);
          const values = await sendMail(userIDs, credentials, json);
          console.log(values)
          // set up the roles and profiles
          for (let k = 0; k < LENGTH; k++) {
            const { email, firstName, lastName } = json[k];
            // parse role
            const level = json[k].role || "student";
            const role = ref[level];
            const userID = userIDs[k];
            // profile
            MATRP[role].defineBase({ email, firstName, lastName, userID, role });
            // role
            Roles.addUsersToRoles(userID, [role]);
          }

          return LENGTH;
        } catch (error) {
          // remove the accounts
          Meteor.users.remove({ _id: { $in: userIDs } });
          // return Promise.reject(error);
          throw error; // rethrow
        }

      } catch (error) {
        console.log(error);
        throw new Meteor.Error(error.message);
      }
    }
    return '';
  },
});