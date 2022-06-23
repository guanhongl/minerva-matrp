import { Meteor } from 'meteor/meteor';
import { CallPromiseMixin } from 'meteor/didericis:callpromise-mixin';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { _ } from 'meteor/underscore';
import { MATRP } from '../matrp/MATRP';
import QRCode from 'qrcode';
import { Random } from 'meteor/random';
import { cloneDeep } from 'lodash';

export const addMethod = new ValidatedMethod({
    name: 'supply.add',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ data }) {
        if (Meteor.isServer) {
            const collection = MATRP.supplies;
            collection.assertValidRoleForMethod(this.userId);

            // validation
            let errorMsg = '';
            // the required String fields
            const requiredFields = ['supply', 'supplyType', 'minQuantity', 'location', 'quantity'];
            // if the field is empty, append error message
            requiredFields.forEach(field => {
                if (!data[field]) {
                    errorMsg += `${field} cannot be empty.\n`;
                }
            });
            if (errorMsg) {
                throw new Meteor.Error("required-fields", errorMsg);
            }

            // submit
            data.minQuantity = parseInt(data.minQuantity, 10);
            data.quantity = parseInt(data.quantity, 10);

            const { supply, supplyType, minQuantity, quantity, location, donated, donatedBy, note } = data;
            const target = collection.findOne({ supply }); // returns the existing supply or undefined
            const targetLot = target?.stock?.find(o => ( o.location === location && o.donated === donated )); // returns the existing lot or undefined
            // if lot exists, increment the quantity:
            if (!!targetLot) {
                targetLot.quantity += quantity;
                collection.update(target._id, { stock: target.stock });

                return targetLot.QRCode;
            } else {
                // generate the QRCode and the uuid for the new lot
                const _id = Random.id();
                const URL = Meteor.absoluteUrl(`/#/dispense?tab=2&_id=${_id}`);
                
                return QRCode.toDataURL(URL)
                    .then(url => {
                        const newLot = { _id, quantity, location, donated, donatedBy, note, QRCode: url };
                        // if the supply does not exist:
                        if (!!!target) {
                            // insert the new supply and lot
                            const definitionData = { supply, supplyType, minQuantity, stock: [newLot] };
                            collection.define(definitionData);

                            return url;
                        } else {
                            // else append the new lot
                            target.stock.push(newLot);
                            collection.update(target._id, { stock: target.stock });

                            return url;
                        }
                    })
                    .catch(err => {
                        throw new Meteor.Error("qrcode-failure", err);
                    });
            }
        }
        return null;
    },
});

export const dispenseMethod = new ValidatedMethod({
    name: 'supply.dispense',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ data }) {
        if (Meteor.isServer) {
            const collection = MATRP.supplies;
            const history = MATRP.history;
            collection.assertValidRoleForMethod(this.userId);

            data.dispensedFrom = Meteor.user().username;
            // handle non patient use dispense
            if (data.dispenseType !== 'Patient Use') {
                data.dispensedTo = 'N/A';
                data.site = 'N/A';
            }
            // validation
            let errorMsg = '';
            // the required String fields
            const requiredFields = ['dispensedTo', 'site', 'supply', 'supplyType', 'location', 'quantity'];
            // if the field is empty, append error message
            requiredFields.forEach(field => {
                if (!data[field]) {
                    errorMsg += `${field} cannot be empty.\n`;
                }
            });
            if (errorMsg) {
                throw new Meteor.Error("required-fields", errorMsg);
            }

            // submit
            data.quantity = parseInt(data.quantity, 10);

            const { inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, supply, note, 
                supplyType, quantity, donated, donatedBy, location } = data;
            const target = collection.findOne({ supply }); // find the existing supply
            const { _id, stock } = target;
            const copy = cloneDeep({ id: _id, stock }); // the copy of the record to update
            const targetIndex = stock.findIndex((o => o.location === location && o.donated === donated)); // find the index of existing the supply
            const targetQuantity = stock[targetIndex].quantity;
            // if dispense quantity > target quantity:
            if (quantity > targetQuantity) {
                throw new Meteor.Error("quantity-cap", `${supply} @ ${location} only has ${targetQuantity} remaining.`);
            } else {
            // if dispense quantity < supply quantity:
                if (quantity < targetQuantity) {
                    stock[targetIndex].quantity -= quantity; // decrement the quantity
                } else {
            // else if dispense quantity === supply quantity:
                    stock.splice(targetIndex, 1); // remove the stock
                }
            }
            // const update = { id: _id, stock };
            const element = [{ name: supply, supplyType, quantity, donated, donatedBy }];
            const definitionData = { inventoryType, dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, note, element };

            try {
                collection.update(_id, { stock });
                history.define(definitionData);

                return `${supply} @ ${location} updated successfully`;
            } catch (error) {
            // if update or define fail, restore the copy
                collection.update(_id, { stock: copy.stock });

                throw new Meteor.Error("update-error", error);
            };
        }
        return null;
    },
});

export const updateMethod = new ValidatedMethod({
    name: 'supply.update',
    mixins: [CallPromiseMixin],
    validate: null,
    run({ _id, uuid, fields }) {
        if (Meteor.isServer) {
            const collection = MATRP.supplies;
            collection.assertValidRoleForMethod(this.userId);
            const { newSupplyType, newMinQuantity, newLocation, newQuantity, newDonated, newDonatedBy, newNote } = fields;
            
            // validation
            const minQuantity = parseInt(newMinQuantity, 10);
            const quantity = parseInt(newQuantity, 10);
            // throw error if (location, donated) is not unique
            const target = collection.findOne({ _id });
            const current = target.stock.find(o => ( o.location === newLocation && o.donated === newDonated ));
            const notUnique = !!current && (current._id !== uuid);
            if (notUnique) {
                throw new Meteor.Error("unique-error", "Location, donated pair must be unique.")
            }
            // submit
            const targetLot = target.stock.find(o => o._id === uuid);
            targetLot.location = newLocation;
            targetLot.quantity = quantity;
            targetLot.donated = newDonated;
            targetLot.donatedBy = newDonated ? newDonatedBy : '';
            targetLot.note = newNote;
            const updateData = { supplyType: newSupplyType, minQuantity, stock: target.stock };
            collection.update(_id, updateData);

            return 'Supply updated successfully.';
        }
        return null;
    },
});