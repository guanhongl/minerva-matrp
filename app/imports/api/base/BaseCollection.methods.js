import { Meteor } from 'meteor/meteor';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';
import _ from 'lodash';
import { MATRP } from '../matrp/MATRP';
import { ROLE } from '../role/Role';
import { loadCollectionNewDataOnly } from '../utilities/load-fixtures';

/**
 * Meteor method used to define new instances of the given collection name.
 * @param collectionName the name of the collection.
 * @param definitionDate the object used in the collection.define method.
 * @memberOf api/base
 */
export const defineMethod = new ValidatedMethod({
  name: 'BaseCollection.define',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ collectionName, definitionData }) {
    if (Meteor.isServer) {
      // console.log(collectionName, this.userId, definitionData);
      const collection = MATRP.getCollection(collectionName);
      collection.assertValidRoleForMethod(this.userId);
      return collection.define(definitionData);
    }
    return '';
  },
});

export const updateMethod = new ValidatedMethod({
  name: 'BaseCollection.update',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ collectionName, updateData }) {
    if (Meteor.isServer) {
      // console.log('updateMethod(%o, %o)', collectionName, updateData);
      const collection = MATRP.getCollection(collectionName);
      collection.assertValidRoleForMethod(this.userId);
      collection.update(updateData.id, updateData);
    }
  },
});

export const removeItMethod = new ValidatedMethod({
  name: 'BaseCollection.removeIt',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ collectionName, instance }) {
    if (Meteor.isServer) {
      const collection = MATRP.getCollection(collectionName);
      collection.assertValidRoleForMethod(this.userId);
      return collection.removeIt(instance);
    }
    return true;
  },
});

export const findOneMethod = new ValidatedMethod({
  name: 'BaseCollection.findOne',
  mixins: [CallPromiseMixin],
  validate: null,
  run({ collectionName, selector, options }) {
    if (Meteor.isServer) {
      const collection = MATRP.getCollection(collectionName);
      collection.assertValidRoleForMethod(this.userId);
      return collection.findOne(selector, options);
    }
    return null;
  },
});