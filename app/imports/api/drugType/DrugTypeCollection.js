import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
import { _ } from 'meteor/underscore';
// import { Roles } from 'meteor/alanning:roles';
import BaseCollection from '../base/BaseCollection';
import { ROLE } from '../role/Role';
import { Drugs } from '../drug/DrugCollection';

export const drugTypePublications = {
  drugType: 'DrugType',
  drugTypeAdmin: 'DrugTypeAdmin',
};

class DrugTypeCollection extends BaseCollection {
  constructor() {
    super('DrugTypes', new SimpleSchema({
      drugType: String,
    }));
  }

  /**
   * Defines a new DrugType.
   * @param drugType.
   * @return {String} the docID of the new document.
   */
  define(drugType) {
    const docID = this._collection.insert({
      drugType: drugType,
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
      // get the DrugTypeCollection instance.
      const instance = this;
      Meteor.publish(drugTypePublications.drugType, function publish() {
        if (this.userId) {
          return instance._collection.find();
        }
        return this.ready();
      });

      Meteor.publish(drugTypePublications.drugTypeAdmin, function publish() {
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
      return Meteor.subscribe(drugTypePublications.drugType);
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
    this.assertRole(userId, [ROLE.ADMIN, ROLE.SUPERUSER, ROLE.USER]);
  }

  /**
   * case insensitive query
   * @param {*} option 
   */
  hasOption(option) {
    const records = this._collection.find().fetch();

    return _.pluck(records, "drugType").map(record => record.toLowerCase()).includes(option.toLowerCase());
  }

  inUse(option) {
    return !!Drugs.findOne({ drugType: option });
  }
}

/**
 * Provides the singleton instance of this class to all other entities.
 */
export const DrugTypes = new DrugTypeCollection();
