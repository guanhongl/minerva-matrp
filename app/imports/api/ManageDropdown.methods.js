import { Meteor } from 'meteor/meteor';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { MATRP } from './matrp/MATRP';
import { _ } from 'meteor/underscore';

/**
 * Meteor method used to define new instances of the given dropdown collection.
 * @param 
 * @param 
 */
export const defineMethod = new ValidatedMethod({
    name: 'Dropdown.define',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ collectionName, newOption }) {
        if (Meteor.isServer) {
            const collection = MATRP.getCollection(collectionName);
            // throw error if user is not authorized
            collection.assertValidRoleForMethod(this.userId);
            // throw error if option is empty
            if (!newOption) {
                throw new Meteor.Error("option-empty", "The option cannot be empty.");
            }
            // throw error if option exists
            if (collection.hasOption(newOption)) {
                throw new Meteor.Error("option-exists", "The option already exists.");
            }
            
            return collection.define(newOption);
        }
        return '';
    },
});

export const removeItMethod = new ValidatedMethod({
    name: 'Dropdown.removeIt',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ collectionName, option, instance }) {
        if (Meteor.isServer) {
            const collection = MATRP.getCollection(collectionName);
            // throw error if user is not authorized
            collection.assertValidRoleForMethod(this.userId);
            // throw error if option is in use
            if (collection.inUse(option)) {
                throw new Meteor.Error("option-in-use", "The option is in use.");
            }

            return collection.removeIt(instance);
        }
        return true;
    },
  });