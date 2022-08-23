import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
import { _ } from 'meteor/underscore';
// import { Roles } from 'meteor/alanning:roles';
import BaseCollection from '../base/BaseCollection';
import { ROLE } from '../role/Role';

class DispenseTypeCollection extends BaseCollection {
  constructor() {
    super('DispenseTypes', new SimpleSchema({
      dispenseType: String,
    }));
  }

  /**
   * Defines a new DispenseType.
   * @param dispenseType.
   * @return {String} the docID of the new document.
   */
  define(dispenseType) {
    const docID = this._collection.insert({
      dispenseType,
    });
    return docID;
  }

  /**
   * A stricter form of remove that throws an error if the document or docID could not be found in this collection.
   * @param { String | Object } name A document or docID in this collection.
   * @returns true
   */
  removeIt(name) {
    const doc = this.findDoc(name);
    check(doc, Object);
    this._collection.remove(doc._id);
    return true;
  }

  /**
   * Default publication method for entities.
   * It publishes the entire collection.
   */
  publish() {
    if (Meteor.isServer) {
      // get the DispenseTypeCollection instance.
      const instance = this;
      Meteor.publish("DispenseType", function publish() {
        if (this.userId) {
          return instance._collection.find();
        }
        return this.ready();
      });
    }
  }

  /**
   * Subscribe to the entire collection.
   */
  subscribe() {
    if (Meteor.isClient) {
      return Meteor.subscribe("DispenseType");
    }
    return null;
  }

  /**
   * Default implementation of assertValidRoleForMethod. Asserts that userId is logged in as an Admin or User.
   * This is used in the define, update, and removeIt Meteor methods associated with each class.
   * @param userId The userId of the logged in user. Can be null or undefined
   * @throws { Meteor.Error } If there is no logged in user, or the user is not an Admin or User.
   */
  assertValidRoleForMethod(userId) {
    this.assertRole(userId, [ROLE.ADMIN]);
  }

  /**
   * case insensitive query
   * @param {*} option 
   */
  hasOption(option) {
    const re = new RegExp(`^${option}$`, "i");
    const record = this._collection.findOne({ dispenseType: { $regex: re } });

    return !!record;
  }

  inUse(option) {
    if (option == "Patient Use") {
      return true;
    }

    return false;
  }

  /**
   * Returns the number of matched documents.
   */
  updateMulti(prev, option, instance) {
    if (prev == "Patient Use") {
      throw new Error("Can't modify Patient Use.");
    }

    // update this dispenseType
    this._collection.update(instance, { $set: { dispenseType: option } });
    
    return 0;
  }
}

/**
 * Provides the singleton instance of this class to all other entities.
 */
export const DispenseTypes = new DispenseTypeCollection();
