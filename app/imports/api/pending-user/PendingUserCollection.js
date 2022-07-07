import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
// import { _ } from 'meteor/underscore';
import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';
import BaseCollection from '../base/BaseCollection';
import { ROLE } from '../role/Role';

class PendingUserCollection extends BaseCollection {
  constructor() {
    super('PendingUsers', new SimpleSchema({
      firstName: String,
      lastName: String,
      email: String,
      createdAt: Date,
    }));
  }

  /**
   * Defines a new PendingUser item.
   * @return {String} the docID of the new document.
   */
  define({ firstName, lastName, email, createdAt }) {
    // validation
    if (!firstName) {
      throw new Meteor.Error("required-fields", "First Name cannot be empty.");
    }
    if (!lastName) {
      throw new Meteor.Error("required-fields", "Last Name cannot be empty.");
    }
    if (!email) {
      throw new Meteor.Error("required-fields", "Email cannot be empty.");
    }
    if (this._collection.findOne({ email }) || Accounts.findUserByEmail(email)) {
      throw new Meteor.Error("email-error", "This email is already registered.");
    }
    const docID = this._collection.insert({
      firstName, lastName, email, createdAt,
    });
    return docID;
  }

  /**
   * A stricter form of remove that throws an error if the document or docID could not be found in this collection.
   * @param { String | Object } name A document or docID in this collection.
   * @returns true
   */
  removeIt(name) {
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'You must be logged in to remove.');
    } else if (!Roles.userIsInRole(this.userId, [ROLE.ADMIN])) {
      throw new Meteor.Error('unauthorized', 'You must be an admin to remove.');
    }

    const doc = this.findDoc(name);
    check(doc, Object);
    this._collection.remove(doc._id);
    return true;
  }

  /**
   * Default publication method for entities.
   */
  publish() {
    if (Meteor.isServer) {
      // get the PendingUserCollection instance.
      const instance = this;

      /** This subscription publishes all documents regardless of user, but only if the logged in user is the Admin. */
      Meteor.publish('PendingUser', function publish() {
        if (this.userId && Roles.userIsInRole(this.userId, ROLE.ADMIN)) {
          return instance._collection.find();
        }
        return this.ready();
      });
    }
  }

  /**
   * Subscription method for admin users.
   * It subscribes to the entire collection.
   */
  subscribePendingUser() {
    if (Meteor.isClient) {
      return Meteor.subscribe('PendingUser');
    }
    return null;
  }

  /**
   * assert true; no role required.
   */
  assertValidRoleForMethod(userId) {
    return true;
  }
}

/**
 * Provides the singleton instance of this class to all other entities.
 */
export const PendingUsers = new PendingUserCollection();
