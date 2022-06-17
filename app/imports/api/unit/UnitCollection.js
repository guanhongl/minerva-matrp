import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
import { _ } from 'meteor/underscore';
// import { Roles } from 'meteor/alanning:roles';
import BaseCollection from '../base/BaseCollection';
import { ROLE } from '../role/Role';
import { Drugs } from '../drug/DrugCollection';

export const unitPublications = {
  unit: 'Unit',
  unitAdmin: 'UnitAdmin',
};

class UnitCollection extends BaseCollection {
  constructor() {
    super('Units', new SimpleSchema({
      unit: String,
    }));
  }

  /**
   * Defines a new Unit.
   * @param unit.
   * @return {String} the docID of the new document.
   */
  define(unit) {
    const docID = this._collection.insert({
      unit,
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
      // get the UnitCollection instance.
      const instance = this;
      Meteor.publish(unitPublications.unit, function publish() {
        if (this.userId) {
          return instance._collection.find();
        }
        return this.ready();
      });

      Meteor.publish(unitPublications.unitAdmin, function publish() {
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
      return Meteor.subscribe(unitPublications.unit);
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

    return _.pluck(records, "unit").map(record => record.toLowerCase()).includes(option.toLowerCase());
  }

  inUse(option) {
    return !!Drugs.findOne({ unit: option });
  }
}

/**
 * Provides the singleton instance of this class to all other entities.
 */
export const Units = new UnitCollection();
