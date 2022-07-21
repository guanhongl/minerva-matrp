import { Meteor } from 'meteor/meteor';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Roles } from 'meteor/alanning:roles';
import _ from 'lodash';
import { MATRP } from './matrp/MATRP';
import { ROLE } from './role/Role';
import { loadCollectionNewDataOnly } from './utilities/load-fixtures';
import { Parser, transforms } from 'json2csv';
import csv from 'csvtojson';

/**
 * download the database as a .csv file
 */
export const downloadDatabaseMethod = new ValidatedMethod({
    name: 'downloadDatabase',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ db, _ids }) {
        if (!this.userId) {
            throw new Meteor.Error('unauthorized', 'You must be logged in to download the database.');
        } else if (!Roles.userIsInRole(this.userId, [ROLE.ADMIN])) {
            throw new Meteor.Error('unauthorized', 'You must be an admin to download the database.');
        }
        // Don't do the dump except on server side (disable client-side simulation).
        if (Meteor.isServer) {
            const collection = MATRP[db];
            if (collection.count() === 0) {
                throw new Meteor.Error("empty-database", "The database is empty.");
            }
            // get collection as json
            const json = _.sortBy(collection.dumpAll(_ids), (entry) => Object.values(entry)[0]);
            // fields: the csv columns
            // arr: the nested field
            let fields, arr;
            switch (db) {
                case 'drugs':
                    fields = ['drug', 'drugType', 'minQuantity', 'unit', 
                        'lotIds.lotId', 'lotIds.brand', 'lotIds.expire', 'lotIds.location', 'lotIds.quantity', 
                        'lotIds.donated', 'lotIds.donatedBy', 'lotIds.note', 'lotIds._id', 'lotIds.QRCode'];
                    arr = 'lotIds';
                    break;
                case 'vaccines':
                    fields = ['vaccine', 'brand', 'minQuantity', 'visDate', 
                        'lotIds.lotId', 'lotIds.expire', 'lotIds.location', 'lotIds.quantity', 'lotIds.note', 'lotIds._id', 'lotIds.QRCode'];
                    arr = 'lotIds';
                    break;
                case 'supplies':
                    fields = ['supply', 'supplyType', 'minQuantity', 
                        'stock.location', 'stock.quantity', 'stock.donated', 'stock.donatedBy', 'stock.note', 'stock._id', 'stock.QRCode'];
                    arr = 'stock';
                    break;
                case 'history':
                    fields = [
                        // all shared
                        'dateDispensed', 'inventoryType', 'dispenseType', 'dispensedFrom', 'dispensedTo', 'site', 'note', 
                        // some shared
                        'element.name', 'element.quantity', 'element.lotId', 'element.brand', 'element.expire', 'element.donated', 'element.donatedBy', 
                        // none shared
                        'element.unit', 'element.dose', 'element.visDate', 'element.supplyType', 
                    ];
                    arr = 'element';
                    break;
                default:
                    console.log('No type.');
            };
            // unwind arrays multiple times or with nested objects.
            const transforms_ = [transforms.unwind({ paths: [arr] })];
            // json to csv
            try {
                const json2csvParser = new Parser({ fields, transforms: transforms_ });
                const csv = json2csvParser.parse(json);

                return csv;
            } catch (error) {
                throw new Meteor.Error(error.message);
            }
        }
        return null;
    },
});

/**
 * upload the .csv file to the database
 */
export const uploadDatabaseMethod = new ValidatedMethod({
    name: 'uploadDatabase',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ data, db }) {
        if (!this.userId) {
            throw new Meteor.Error('unauthorized', 'You must be logged in to upload to the database.');
        } else if (!Roles.userIsInRole(this.userId, [ROLE.ADMIN])) {
            throw new Meteor.Error('unauthorized', 'You must be an admin to upload to the database.');
        }
        if (Meteor.isServer) {
            const collection = MATRP[db];
            // throw error if database is not empty
            if (collection.count() > 0) {
                throw new Meteor.Error("not-empty", "The database is not empty. Try resetting the database.");
            }
            // throw error if csv is empty
            if (!data) {
                throw new Meteor.Error("no-file", "No file specified");
            }
            // csv to json
            return csv({ checkType: true }).fromString(data)
                .then(json => {
                    return loadCollectionNewDataOnly(collection, json);
                })
                // can't catch csvtojson
                .catch(error => {
                    throw new Meteor.Error(error.message);
                });
        }
        return '';
    },
});

/**
 * remove all for a database
 */
export const resetDatabaseMethod = new ValidatedMethod({
    name: 'resetDatabase',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ db }) {
        if (!this.userId) {
            throw new Meteor.Error('unauthorized', 'You must be logged in to reset the database.');
        } else if (!Roles.userIsInRole(this.userId, [ROLE.ADMIN])) {
            throw new Meteor.Error('unauthorized', 'You must be an admin to reset the database.');
        }
        if (Meteor.isServer) {
            return MATRP[db].resetDB();
        }
        return null;
    },
});

/**
 * reads the template .csv file
 */
export const readCSVMethod = new ValidatedMethod({
    name: 'readCSV',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ db }) {
        if (!this.userId) {
            throw new Meteor.Error('unauthorized', 'You must be logged in.');
        } else if (!Roles.userIsInRole(this.userId, [ROLE.ADMIN])) {
            throw new Meteor.Error('unauthorized', 'You must be an admin.');
        }
        if (Meteor.isServer) {
            return Assets.getText(`${db}_template.csv`);
        }
        return null;
    },
});

/**
 * export counts of drugs/vaccines/supplies dispensed
 */
 export const downloadCountsMethod = new ValidatedMethod({
    name: 'downloadCounts',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ type, _ids }) {
        if (!this.userId) {
            throw new Meteor.Error('unauthorized', 'You must be logged in to download the database.');
        } else if (!Roles.userIsInRole(this.userId, [ROLE.ADMIN])) {
            throw new Meteor.Error('unauthorized', 'You must be an admin to download the database.');
        }
        // Don't do the dump except on server side (disable client-side simulation).
        if (Meteor.isServer) {
            const collection = MATRP.history;
            if (collection.count() === 0) {
                throw new Meteor.Error("empty-database", "The database is empty.");
            }
            if (!type) {
                throw new Meteor.Error("no-type", "Inventory type must be selected.");
            }
            // get collection as json; get names and quantities
            const json = collection.find(
                { _id: { $in: _ids } },
                { fields: { "element.name": 1, "element.quantity": 1 } },
            ).map(e => e.element).flat(); // flatMap

            // maybe sort
            const counts = {};
            json.forEach(({ name, quantity }) => {
                counts[name] = counts[name] ? counts[name] + quantity : quantity;
            });

            const countsJSON = [];
            for (const prop in counts) {
                countsJSON.push({ name: prop, quantity: counts[prop] });
            }

            // fields: the csv columns
            const fields = ["name", "quantity"];
            // json to csv
            try {
                const json2csvParser = new Parser({ fields });
                const csv = json2csvParser.parse(countsJSON);

                return csv;
            } catch (error) {
                throw new Meteor.Error(error.message);
            }
        }
        return null;
    },
});